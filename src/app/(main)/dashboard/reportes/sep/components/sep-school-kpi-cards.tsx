"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  BookOpen,
  DollarSign,
  FileCheck2,
  FileClock,
  Percent,
  TrendingUp,
  Users,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { SchoolSepKpis } from "@/services/reports.service";

interface SepSchoolKpiCardsProps {
  kpis: SchoolSepKpis;
}

function formatCurrency(val: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(val);
}

function formatCompact(val: number): string {
  if (Math.abs(val) >= 1_000_000) {
    return `$${(val / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(val) >= 1_000) {
    return `$${(val / 1_000).toFixed(0)}K`;
  }
  return formatCurrency(val);
}

export function SepSchoolKpiCards({ kpis }: SepSchoolKpiCardsProps) {
  const disponibleColor =
    kpis.disponible > 0
      ? "text-emerald-600 dark:text-emerald-400"
      : kpis.disponible === 0
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

  const disponibleBg =
    kpis.disponible > 0 ? "bg-emerald-500/10" : kpis.disponible === 0 ? "bg-amber-500/10" : "bg-red-500/10";

  const disponibleIconColor =
    kpis.disponible > 0 ? "text-emerald-500" : kpis.disponible === 0 ? "text-amber-500" : "text-red-500";

  const cards = [
    {
      title: "Presupuesto Total",
      value: formatCurrency(kpis.presupuestoTotal),
      subtitle: `Proyectado: ${formatCompact(kpis.presupuestoProyectado)}`,
      icon: DollarSign,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-500",
      valueColor: "text-foreground",
    },
    {
      title: "Inversión Compras",
      value: formatCurrency(kpis.inversionTotal),
      subtitle: `${kpis.totalCompras} compras gestionadas`,
      icon: TrendingUp,
      iconBg: "bg-indigo-500/10",
      iconColor: "text-indigo-500",
      valueColor: "text-foreground",
    },
    {
      title: "Compras Facturadas",
      value: formatCurrency(kpis.comprasFacturadas),
      subtitle: `${kpis.porcentajeFacturado.toFixed(1)}% del presupuesto`,
      icon: FileCheck2,
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-500",
      valueColor: "text-foreground",
    },
    {
      title: "Saldo Obligado",
      value: formatCurrency(kpis.comprasObligadas),
      subtitle: "OC pendientes de facturar",
      icon: FileClock,
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-500",
      valueColor: "text-foreground",
    },
    {
      title: "Gasto RRHH",
      value: formatCurrency(kpis.gastoRrhh),
      subtitle: `Proyectado: ${formatCompact(kpis.rrhhProyectado)}`,
      icon: Users,
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-500",
      valueColor: "text-foreground",
    },
    {
      title: "Disponible",
      value: formatCurrency(kpis.disponible),
      subtitle: kpis.disponible >= 0 ? "Saldo a favor" : "Déficit presupuestario",
      icon: kpis.disponible >= 0 ? ArrowUpRight : ArrowDownRight,
      iconBg: disponibleBg,
      iconColor: disponibleIconColor,
      valueColor: disponibleColor,
    },
    {
      title: "Acciones SEP",
      value: String(kpis.totalAcciones),
      subtitle: `Planificado: ${formatCompact(kpis.montoAcciones)}`,
      icon: BookOpen,
      iconBg: "bg-cyan-500/10",
      iconColor: "text-cyan-500",
      valueColor: "text-foreground",
    },
    {
      title: "% Ejecución",
      value: `${kpis.porcentajeEjecucion.toFixed(1)}%`,
      subtitle: "Facturado + Obligado + RRHH",
      icon: Percent,
      iconBg:
        kpis.porcentajeEjecucion > 90
          ? "bg-red-500/10"
          : kpis.porcentajeEjecucion > 70
            ? "bg-amber-500/10"
            : "bg-emerald-500/10",
      iconColor:
        kpis.porcentajeEjecucion > 90
          ? "text-red-500"
          : kpis.porcentajeEjecucion > 70
            ? "text-amber-500"
            : "text-emerald-500",
      valueColor: "text-foreground",
      progress: Math.min(100, kpis.porcentajeEjecucion),
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card
          key={card.title}
          className="group relative overflow-hidden border-border/60 transition-all duration-300 hover:border-border hover:shadow-md"
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">{card.title}</p>
                <p className={`font-bold text-2xl tracking-tight ${card.valueColor}`}>{card.value}</p>
                <p className="text-muted-foreground text-xs">{card.subtitle}</p>
              </div>
              <div className={`rounded-xl p-2.5 ${card.iconBg}`}>
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
            </div>

            {/* Progress bar for % Ejecución */}
            {"progress" in card && card.progress !== undefined && (
              <div className="mt-3">
                <Progress value={card.progress} className="h-1.5" />
              </div>
            )}
          </CardContent>

          {/* Subtle gradient accent on hover */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        </Card>
      ))}
    </div>
  );
}

/* ── Skeleton for loading state ── */
export function SepSchoolKpiCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={`kpi-skeleton-${i}`} className="border-border/60">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                <div className="h-7 w-32 animate-pulse rounded bg-muted" />
                <div className="h-3 w-28 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-10 w-10 animate-pulse rounded-xl bg-muted" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
