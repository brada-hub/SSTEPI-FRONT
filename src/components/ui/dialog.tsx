"use client";

import * as React from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#07101f]/75 backdrop-blur-sm"
          />
          {children}
        </div>
      )}
    </AnimatePresence>
  );
}

interface DialogContentProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  onClose?: () => void;
  maxWidthClass?: string;
}

export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, onClose, maxWidthClass = "max-w-lg", ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        className={cn(
          "relative z-10 w-full rounded-2xl border border-border bg-card p-6 shadow-2xl overflow-hidden",
          maxWidthClass,
          className
        )}
        {...props}
      >
        {children}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground p-1 transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </motion.div>
    );
  }
);
DialogContent.displayName = "DialogContent";

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 text-left pb-4 border-b border-border/40", className)}
      {...props}
    />
  );
}
DialogHeader.displayName = "DialogHeader";

export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4 border-t border-border/30 mt-4",
        className
      )}
      {...props}
    />
  );
}
DialogFooter.displayName = "DialogFooter";

export function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-sm font-bold leading-none tracking-tight text-foreground uppercase tracking-wider",
        className
      )}
      {...props}
    />
  );
}
DialogTitle.displayName = "DialogTitle";

export function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-[10px] text-muted-foreground font-medium mt-1", className)}
      {...props}
    />
  );
}
DialogDescription.displayName = "DialogDescription";
