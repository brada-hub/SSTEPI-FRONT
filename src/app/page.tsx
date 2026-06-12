"use client";

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

export default function RootPage() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (token) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  }, [token, navigate]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#07101f]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
