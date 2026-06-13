"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function signOut() {
    setLoading(true);
    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
      router.push("/sign-in");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={compact ? "icon" : "default"}
      className={compact ? "rounded-full" : "rounded-full px-4"}
      onClick={signOut}
      disabled={loading}
      aria-label="Sign out"
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
      {!compact && "Log out"}
    </Button>
  );
}
