"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

export const description = "Tendencia de volumen de solicitudes";

const chartConfig = {
  count: {
    label: "Solicitudes",
    color: "#7c3aed", // Violet 600
  },
} satisfies ChartConfig;

interface VolumeTrendChartProps {
  data: { month: string; count: number }[];
}

export function VolumeTrendChart({ data }: VolumeTrendChartProps) {
  const hasData = data && data.length > 0;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="items-start pb-0">
        <CardTitle>Volumen de Solicitudes</CardTitle>
        <CardDescription>Cantidad de solicitudes ingresadas por mes (Estacionalidad)</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        {hasData ? (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <AreaChart accessibilityLayer data={data} margin={{ top: 20 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} tickMargin={10} allowDecimals={false} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
              <Area
                dataKey="count"
                type="monotone"
                fill="var(--color-count)"
                fillOpacity={0.4}
                stroke="var(--color-count)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[300px] w-full items-center justify-center text-muted-foreground">
            No hay datos suficientes para mostrar la estacionalidad.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
