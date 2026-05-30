"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/stores/authStore";

const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes
const COUNTDOWN_LIMIT = 5; // 5 seconds warning

export function useInactivityTimer() {
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_LIMIT);

  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetInactivityTimer = () => {
    if (showWarning) return; // Don't reset if warning is active

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(COUNTDOWN_LIMIT);
    }, INACTIVITY_LIMIT);
  };

  // Warning countdown effect: just decrements the countdown every second
  useEffect(() => {
    if (!showWarning) {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
      return;
    }

    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, [showWarning]);

  // Logout side-effect: triggered safely after countdown hits 0 in a new render cycle
  useEffect(() => {
    if (showWarning && countdown === 0) {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
      logout();
      setShowWarning(false);
    }
  }, [countdown, showWarning, logout]);

  // Global event listeners for active session
  useEffect(() => {
    if (!token) {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      return;
    }

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    
    // Initial setup
    resetInactivityTimer();

    const handleActivity = () => {
      resetInactivityTimer();
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [token, showWarning]);

  const keepSessionAlive = async () => {
    setShowWarning(false);
    resetInactivityTimer();
    // Refrescar sesión de Laravel Sanctum para extender vigencia de sesión
    await useAuthStore.getState().refreshSession();
  };

  // ✅ Auto-refresh periódico cada 10 minutos para mantener activa la sesión
  useEffect(() => {
    if (!token) return;

    // Primer refresco de seguridad al cargar
    useAuthStore.getState().refreshSession();

    const interval = setInterval(() => {
      useAuthStore.getState().refreshSession();
    }, 10 * 60 * 1000); // 10 minutos

    return () => clearInterval(interval);
  }, [token]);

  return {
    showWarning,
    countdown,
    keepSessionAlive,
    forceLogout: logout,
  };
}
