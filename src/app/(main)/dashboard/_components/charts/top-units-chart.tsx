"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";

export const description = "Ranking de unidades por cantidad de compras";

const chartConfig = {
    count: {
        label: "Compras",
        color: "#10b981", // Emerald 500
    },
} satisfies ChartConfig;

interface TopUnitsChartProps {
    data: { name: string; amount: number; count: number }[];
}

export function TopUnitsChart({ data }: TopUnitsChartProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Unidades con más compras</CardTitle>
                <CardDescription>Por cantidad de órdenes (Año en curso)</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                    <BarChart accessibilityLayer data={data} layout="vertical" margin={{ left: 0 }}>
                        <CartesianGrid horizontal={false} />
                        <YAxis
                            dataKey="name"
                            type="category"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            width={150} // Wider for unit names
                            style={{ fontSize: '11px' }}
                        />
                        <XAxis dataKey="count" type="number" hide />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="line" />}
                        />
                        <Bar
                            dataKey="count"
                            layout="vertical"
                            fill="var(--color-count)"
                            radius={4}
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
