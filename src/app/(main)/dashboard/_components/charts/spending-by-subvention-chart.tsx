"use client";

import * as React from "react";
import { Label, Pie, PieChart } from "recharts";

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

export const description = "Gasto por Subvención";

interface SpendingBySubventionChartProps {
    data: { name: string; amount: number; count: number }[];
}

const COLORS = [
    "#3b82f6", // Blue 500
    "#8b5cf6", // Violet 500
    "#f59e0b", // Amber 500
    "#10b981", // Emerald 500
    "#ef4444", // Red 500
    "#06b6d4", // Cyan 500
    "#ec4899", // Pink 500
];

export function SpendingBySubventionChart({ data }: SpendingBySubventionChartProps) {
    // Generate dynamic chart config based on data
    const chartConfig = React.useMemo(() => {
        const config: ChartConfig = {
            amount: { label: "Monto" },
        };
        data.forEach((item, index) => {
            config[item.name] = {
                label: item.name,
                color: COLORS[index % COLORS.length],
            };
        });
        return config;
    }, [data]);

    const chartData = React.useMemo(() => {
        return data.map((item, index) => ({
            ...item,
            fill: `var(--color-${item.name})`,
        }));
    }, [data]);

    const totalAmount = React.useMemo(() => {
        return data.reduce((acc, curr) => acc + curr.amount, 0);
    }, [data]);

    return (
        <Card className="flex flex-col">
            <CardHeader className="items-center pb-0">
                <CardTitle>Gasto por Subvención</CardTitle>
                <CardDescription>Distribución del gasto total</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[300px]"
                >
                    <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Pie
                            data={chartData}
                            dataKey="amount"
                            nameKey="name"
                            innerRadius={60}
                            strokeWidth={5}
                        >
                            <Label
                                content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                        return (
                                            <text
                                                x={viewBox.cx}
                                                y={viewBox.cy}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                            >
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={viewBox.cy}
                                                    className="fill-foreground text-2xl font-bold"
                                                >
                                                    {data.length}
                                                </tspan>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) + 24}
                                                    className="fill-muted-foreground text-xs"
                                                >
                                                    Fuentes
                                                </tspan>
                                            </text>
                                        );
                                    }
                                }}
                            />
                        </Pie>
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
