"use client";

import * as React from "react";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, AlertCircle } from "lucide-react";

export function OfflineBanner() {
  const isOffline = useOfflineStatus();

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ type: "spring", stiffness: 220, damping: 25 }}
          className="fixed top-0 left-0 right-0 z-50 flex h-9 w-full items-center justify-center border-b border-destructive/20 bg-destructive/15 px-4 text-xs font-bold text-destructive backdrop-blur-md"
        >
          <div className="flex items-center gap-2">
            <WifiOff className="h-4 w-4 shrink-0 animate-pulse" />
            <span>Estación sin conexión. Operando en modo local (Caché caliente activa).</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default OfflineBanner;
