"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

export const description = "Carga de trabajo por comprador";

const chartConfig = {
  count: {
    label: "Compras",
    color: "#f59e0b", // Amber 500
  },
} satisfies ChartConfig;

interface BuyersWorkloadChartProps {
  data: { name: string; amount: number; count: number }[];
}

export function BuyersWorkloadChart({ data }: BuyersWorkloadChartProps) {
  const hasData = data && data.length > 0;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="items-start pb-0">
        <CardTitle>Carga por Comprador</CardTitle>
        <CardDescription>Solicitudes asignadas a cada comprador (sin anuladas)</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        {hasData ? (
          <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
            <BarChart accessibilityLayer data={data} layout="vertical" margin={{ left: 0, right: 32 }}>
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                width={150}
                style={{ fontSize: "11px" }}
              />
              <XAxis dataKey="count" type="number" hide />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
              <Bar dataKey="count" layout="vertical" fill="var(--color-count)" radius={4}>
                <LabelList dataKey="count" position="right" offset={8} className="fill-foreground" fontSize={11} />
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[200px] w-full items-center justify-center text-muted-foreground">
            No hay compras asignadas en el período.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
