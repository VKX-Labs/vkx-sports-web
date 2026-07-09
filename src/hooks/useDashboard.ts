"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/providers/auth-provider";

export function useDashboard() {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/register");
    }
  }, [user, loading, router]);

  return { user, profile, loading, signOut };
}
