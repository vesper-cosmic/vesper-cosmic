"use client";

import { SessionProvider } from "next-auth/react";
import ReferralTracker from "@/components/ReferralTracker";
import ConsentGate from "@/components/ConsentGate";

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <ReferralTracker />
      <ConsentGate />
      {children}
    </SessionProvider>
  );
}