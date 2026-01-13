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

export const description = "Ranking de compradores por monto total";

const chartConfig = {
    amount: {
        label: "Monto",
        color: "#6366f1", // Indigo 500
    },
} satisfies ChartConfig;

interface TopBuyersChartProps {
    data: { name: string; amount: number; count: number }[];
}

export function TopBuyersChart({ data }: TopBuyersChartProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Top Compradores</CardTitle>
                <CardDescription>Por monto total de compras (Año en curso)</CardDescription>
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
                            width={100}
                            style={{ fontSize: '12px' }}
                        />
                        <XAxis dataKey="amount" type="number" hide />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="line" />}
                        />
                        <Bar
                            dataKey="amount"
                            layout="vertical"
                            fill="var(--color-amount)"
                            radius={4}
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
