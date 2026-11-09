"use client";

import { SessionProvider } from "next-auth/react";
import ReferralTracker from "@/components/ReferralTracker";

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <ReferralTracker />
      {children}
    </SessionProvider>
  );
}