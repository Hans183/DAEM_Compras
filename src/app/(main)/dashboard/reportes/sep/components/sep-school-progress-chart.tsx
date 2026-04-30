"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SchoolSepKpis } from "@/services/reports.service";

interface SepSchoolProgressChartProps {
  kpis: SchoolSepKpis;
}

const COLORS = {
  facturado: "#10b981", // emerald-500
  obligado: "#f59e0b", // amber-500
  rrhh: "#8b5cf6", // violet-500
  disponible: "#94a3b8", // slate-400
};

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

export function SepSchoolProgressChart({ kpis }: SepSchoolProgressChartProps) {
  const data = [
    { name: "Facturado", value: kpis.distribucion.facturado, color: COLORS.facturado },
    { name: "Obligado", value: kpis.distribucion.obligado, color: COLORS.obligado },
    { name: "RRHH", value: kpis.distribucion.rrhh, color: COLORS.rrhh },
    { name: "Disponible", value: kpis.distribucion.disponible, color: COLORS.disponible },
  ].filter((d) => d.value > 0);

  const hasData = data.some((d) => d.value > 0);

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: { name: string; value: number; payload: { color: string } }[];
  }) => {
    if (!active || !payload || !payload.length) return null;
    const item = payload[0];
    const pct = kpis.presupuestoTotal > 0 ? ((item.value / kpis.presupuestoTotal) * 100).toFixed(1) : "0";
    return (
      <div className="rounded-lg border bg-background/95 px-3 py-2 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.payload.color }} />
          <span className="font-medium text-sm">{item.name}</span>
        </div>
        <p className="mt-1 font-semibold text-sm">{formatCurrency(item.value)}</p>
        <p className="text-muted-foreground text-xs">{pct}% del presupuesto</p>
      </div>
    );
  };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Distribución Presupuestaria</CardTitle>
        <CardDescription>Presupuesto: {formatCurrency(kpis.presupuestoTotal)}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 items-center justify-center">
        {hasData ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={2}
                stroke="hsl(var(--background))"
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={10}
                formatter={(value: string) => <span className="text-muted-foreground text-xs">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[300px] w-full items-center justify-center text-muted-foreground">
            Sin datos presupuestarios para mostrar
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Skeleton ── */
export function SepSchoolProgressChartSkeleton() {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="h-5 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent className="flex flex-1 items-center justify-center">
        <div className="h-[220px] w-[220px] animate-pulse rounded-full border-[20px] border-muted bg-transparent" />
      </CardContent>
    </Card>
  );
}
