"use client";

import * as React from "react";
import { Medicine } from "@/services/pharmacyService";
import { Pill, ShieldAlert, BadgeAlert, Layers } from "lucide-react";

interface InventoryKPIsProps {
  medicines: Medicine[];
}

export function InventoryKPIs({ medicines }: InventoryKPIsProps) {
  const stats = React.useMemo(() => {
    const total = medicines.length;
    const critical = medicines.filter((m) => m.stock <= m.stock_critico).length;
    const low = medicines.filter((m) => m.stock > m.stock_critico && m.stock <= m.stock_critico * 2).length;
    const optimal = total - critical - low;

    return { total, critical, low, optimal };
  }, [medicines]);

  const cards = [
    {
      title: "Total Medicamentos",
      value: stats.total,
      description: "SKUs clínicos en catálogo",
      icon: Pill,
      color: "text-primary bg-primary/10",
    },
    {
      title: "Stock Crítico",
      value: stats.critical,
      description: "Requieren reabastecimiento",
      icon: ShieldAlert,
      color: stats.critical > 0 ? "text-destructive bg-destructive/10 animate-pulse" : "text-muted-foreground bg-secondary",
    },
    {
      title: "Stock Bajo",
      value: stats.low,
      description: "Próximos a punto crítico",
      icon: BadgeAlert,
      color: "text-accent-amber bg-accent-amber/10",
    },
    {
      title: "Stock Óptimo",
      value: stats.optimal,
      description: "Nivel logístico óptimo",
      icon: Layers,
      color: "text-accent-teal bg-accent-teal/10",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.title}
            className="rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:scale-[1.01]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {c.title}
              </span>
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${c.color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline">
              <span className="font-mono text-xl font-extrabold text-foreground tracking-tight">
                {c.value}
              </span>
            </div>
            <span className="text-[9px] font-medium text-muted-foreground block mt-0.5">
              {c.description}
            </span>
          </div>
        );
      })}
    </div>
  );
}
export default InventoryKPIs;
