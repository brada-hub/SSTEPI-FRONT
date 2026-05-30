"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

export default function RootPage() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (token) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }, [token, router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#07101f]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
