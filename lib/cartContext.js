/* eslint-disable no-unused-vars */
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { useSession } from "next-auth/react";

const CartContext = createContext(null);

const CART_STORAGE_KEY = "vesperCart";

function mergeCarts(localItems, serverItems) {
  const map = new Map();

  const add = (item) => {
    const key = `${item.id}__${item.slug || ""}`;
    const existing = map.get(key);
    if (existing) {
      existing.quantity += Number(item.quantity || 1);
    } else {
      map.set(key, { ...item, quantity: Number(item.quantity || 1) });
    }
  };

  (Array.isArray(localItems) ? localItems : []).forEach(add);
  (Array.isArray(serverItems) ? serverItems : []).forEach(add);

  return Array.from(map.values());
}

export function CartProvider({ children }) {
  const { data: session, status } = useSession();
  const isSignedIn = status === "authenticated";
  const userEmail = session?.user?.email || null;

  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [memberStatus, setMemberStatus] = useState("idle"); // idle | loading | ready
  const [member, setMember] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const itemsRef = useRef(items);
  itemsRef.current = items;

  const signedInRef = useRef(isSignedIn);
  signedInRef.current = isSignedIn;

  const emailRef = useRef(userEmail);
  emailRef.current = userEmail;

  // Tracks whether the initial sign-in sync has completed for the current
  // session. Reset on sign-out so the next sign-in merges again.
  const didInitialSyncRef = useRef(false);
  const pushTimerRef = useRef(null);
  const pendingPushRef = useRef(false);

  // Load local cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  // Persist local cart to localStorage whenever items change (after initial load)
  useEffect(() => {
    if (loaded) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, loaded]);

  /**
   * Pull the latest member profile + server cart, merge it with the local
   * cart, and write back the merged result if anything changed.
   *
   * This is used both for the initial sign-in sync and for cross-device
   * re-sync on window focus / visibility (a cart added on a phone will then
   * appear automatically on the computer, and vice versa).
   */
  const refreshFromServer = useCallback(async () => {
    if (!signedInRef.current) return;

    try {
      const [memberRes, cartRes] = await Promise.all([
        fetch("/api/member").then((res) => res.json()),
        fetch("/api/member/cart").then((res) => res.json()),
      ]);

      const memberData = memberRes?.member || null;
      const serverCart = Array.isArray(cartRes?.cart) ? cartRes.cart : [];

      const localCart = itemsRef.current;
      const merged = mergeCarts(localCart, serverCart);

      if (memberData) setMember(memberData);

      // Merge produced a different result — update local state. This will
      // also trigger the debounced push back to the server, so both sides
      // converge on the same cart.
      if (JSON.stringify(merged) !== JSON.stringify(localCart)) {
        setItems(merged);
      }
    } catch {
      // Network / server errors are non-fatal; keep the current local cart.
    }
  }, []);

  // When sign-in state changes, fetch member + server cart and merge
  useEffect(() => {
    if (!loaded) return;

    if (isSignedIn) {
      if (!didInitialSyncRef.current) {
        didInitialSyncRef.current = true;
        setMemberStatus("loading");
        refreshFromServer()
          .catch(() => {})
          .finally(() => setMemberStatus("ready"));
      }
      return;
    }

    // Reset member state on sign-out but never wipe the local cart.
    didInitialSyncRef.current = false;
    setMember(null);
    setMemberStatus("idle");
  }, [isSignedIn, loaded, refreshFromServer]);

  // Debounce push to server whenever cart changes (only when signed in)
  useEffect(() => {
    if (!loaded) return;
    if (!isSignedIn) return;
    if (!didInitialSyncRef.current) return;

    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pendingPushRef.current = true;

    pushTimerRef.current = setTimeout(() => {
      pendingPushRef.current = false;
      setSyncing(true);
      const cart = itemsRef.current;
      fetch("/api/member/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart }),
      })
        .catch(() => {})
        .finally(() => setSyncing(false));
    }, 800);
  }, [items, loaded, isSignedIn]);

  // Cross-tab sync (same browser): when another tab writes the cart to
  // localStorage, adopt it here so all open tabs stay in lock-step.
  useEffect(() => {
    function handleStorage(event) {
      if (event.key !== CART_STORAGE_KEY) return;
      try {
        const next = JSON.parse(event.newValue || "[]");
        if (!Array.isArray(next)) return;
        setItems((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
          return next;
        });
      } catch {
        // ignore malformed storage writes
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Cross-device sync: when the tab regains focus (returning to the browser,
  // switching back from another app, or switching devices), re-pull the
  // server cart and merge. This is what keeps a phone cart and a computer
  // cart in sync for the same signed-in account.
  useEffect(() => {
    function handleVisibility() {
      if (
        document.visibilityState === "visible" &&
        didInitialSyncRef.current &&
        signedInRef.current
      ) {
        refreshFromServer();
      }
    }

    function handleFocus() {
      if (didInitialSyncRef.current && signedInRef.current) {
        refreshFromServer();
      }
    }

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refreshFromServer]);

  function addItem(product, quantity = 1) {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          currency: product.currency,
          image: product.images[0],
          categoryLabel: product.categoryLabel,
          fulfillmentTime: product.fulfillmentTime,
          quantity,
        },
      ];
    });
  }

  function removeItem(id) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function updateQuantity(id, quantity) {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  }

  function clearCart() {
    setItems([]);
  }

  function openCart() {
    setCartOpen(true);
  }

  function closeCart() {
    setCartOpen(false);
  }

  async function saveMemberCartNow() {
    if (!isSignedIn) return { skipped: true };
    try {
      const response = await fetch("/api/member/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart: itemsRef.current }),
      });
      return { ok: response.ok };
    } catch {
      return { ok: false };
    }
  }

  async function saveDefaultAddress(address) {
    if (!isSignedIn) return { skipped: true };
    try {
      const response = await fetch("/api/member/address", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      if (!response.ok) return { ok: false };
      setMember((prev) => ({
        ...(prev || {}),
        defaultAddress: {
          ...(prev?.defaultAddress || {}),
          ...address,
        },
      }));
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }


  async function saveDefaultBirthData(birthData) {
    if (!isSignedIn) return { skipped: true };
    try {
      const response = await fetch("/api/member/birth-data", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birthData }),
      });
      if (!response.ok) return { ok: false };
      setMember((prev) => ({
        ...(prev || {}),
        defaultBirthData: { ...(prev?.defaultBirthData || {}), ...birthData },
      }));
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        // Cart
        items,
        totalItems,
        totalPrice,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        cartOpen,
        openCart,
        closeCart,
        loaded,
        // Member
        isSignedIn,
        userEmail,
        member,
        memberStatus,
        syncing,
        saveDefaultAddress,
        saveDefaultBirthData,
        saveMemberCartNow,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}