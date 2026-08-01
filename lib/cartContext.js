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

  const syncedRef = useRef(false);
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

  // When sign-in state changes, fetch member + server cart and merge
  useEffect(() => {
    if (!loaded) return;

    if (isSignedIn && !syncedRef.current) {
      syncedRef.current = true;
      setMemberStatus("loading");

      Promise.all([
        fetch("/api/member").then((res) => res.json()),
        fetch("/api/member/cart").then((res) => res.json()),
      ])
        .then(([memberRes, cartRes]) => {
          const memberData = memberRes?.member || null;
          const serverCart = Array.isArray(cartRes?.cart) ? cartRes.cart : [];

          const localCart = itemsRef.current;
          const merged = mergeCarts(localCart, serverCart);

          setMember(memberData);
          setMemberStatus("ready");

          // If merge produced a different result, update both local state and server
          if (JSON.stringify(merged) !== JSON.stringify(localCart)) {
            setItems(merged);
          }
          if (
            JSON.stringify(merged) !== JSON.stringify(serverCart) &&
            merged.length > 0
          ) {
            fetch("/api/member/cart", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ cart: merged }),
            }).catch(() => {});
          }
        })
        .catch(() => {
          setMemberStatus("ready");
        });

      return;
    }

    if (!isSignedIn) {
      // Reset member state on sign-out but never wipe the local cart.
      syncedRef.current = false;
      setMember(null);
      setMemberStatus("idle");
    }
  }, [isSignedIn, loaded]);

  // Debounce push to server whenever cart changes (only when signed in)
  useEffect(() => {
    if (!loaded) return;
    if (!isSignedIn) return;
    if (!syncedRef.current) return;

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