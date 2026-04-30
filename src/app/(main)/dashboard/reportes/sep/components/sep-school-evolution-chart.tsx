"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { SchoolSepKpis } from "@/services/reports.service";

interface SepSchoolEvolutionChartProps {
  kpis: SchoolSepKpis;
  year: number;
}

const chartConfig = {
  amount: {
    label: "Monto",
    color: "#6366f1", // indigo-500
  },
} satisfies ChartConfig;

export function SepSchoolEvolutionChart({ kpis, year }: SepSchoolEvolutionChartProps) {
  const chartData = kpis.monthlyEvolution.map((item) => {
    const date = new Date(year, item.month);
    return {
      ...item,
      monthName: format(date, "MMMM", { locale: es }),
    };
  });

  const hasData = chartData.some((d) => d.amount > 0);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Evolución Mensual</CardTitle>
        <CardDescription>Gasto en compras SEP durante {year}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {hasData ? (
          <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
            <AreaChart accessibilityLayer data={chartData}>
              <defs>
                <linearGradient id="fillAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-amount)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-amount)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="monthName"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tickFormatter={(value) =>
                  value >= 1_000_000
                    ? `$${(value / 1_000_000).toFixed(1)}M`
                    : value >= 1_000
                      ? `$${(value / 1_000).toFixed(0)}K`
                      : `$${value}`
                }
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
              <Area
                dataKey="amount"
                type="monotone"
                fill="url(#fillAmount)"
                stroke="var(--color-amount)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[300px] w-full items-center justify-center text-muted-foreground">
            No hay movimientos registrados para mostrar.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Skeleton ── */
export function SepSchoolEvolutionChartSkeleton() {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="h-5 w-40 animate-pulse rounded bg-muted" />
        <div className="h-4 w-56 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex h-[300px] w-full items-end gap-2 pt-8">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={`evo-skeleton-${i}`}
              className="flex-1 animate-pulse rounded-t bg-muted"
              style={{ height: `${20 + Math.random() * 60}%` }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
