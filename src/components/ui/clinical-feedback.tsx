"use client";

import * as React from "react";
import { AlertCircle, FileQuestion, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

// 🌀 loader pulse icon helper
function MedicalPulse(props: React.ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

// 1. Loading State
interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = "Cargando registros clínicos...", className }: LoadingStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-12 text-center", className)}>
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary animate-pulse">
        <MedicalPulse className="h-6 w-6" />
      </div>
      <span className="mt-4 font-sans text-xs font-semibold uppercase tracking-widest text-muted-foreground animate-pulse">
        {message}
      </span>
    </div>
  );
}

// 2. Empty State
interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon = FileQuestion,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-10 border border-dashed border-border/80 rounded-2xl bg-card/20 text-center max-w-md mx-auto my-6", className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-muted-foreground border border-border">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-xs font-bold text-foreground uppercase tracking-wider">
        {title}
      </h3>
      <p className="mt-1 text-[10px] text-muted-foreground max-w-xs font-medium leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-[11px] font-bold text-white shadow-sm hover:bg-primary/90 transition-all cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// 3. Error State
interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  message = "Ha ocurrido un error al consultar el servidor clínico.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 border border-destructive/15 rounded-2xl bg-destructive/5 text-center max-w-md mx-auto my-6", className)}>
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
        <AlertCircle className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-xs font-bold text-destructive uppercase tracking-wider">
        Fallo de Conexión
      </h3>
      <p className="mt-1 text-[10px] text-muted-foreground max-w-xs font-medium">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-destructive/20 bg-background px-3 text-[11px] font-bold text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
        >
          <RefreshCw className="h-3 w-3" />
          Reintentar consulta
        </button>
      )}
    </div>
  );
}
