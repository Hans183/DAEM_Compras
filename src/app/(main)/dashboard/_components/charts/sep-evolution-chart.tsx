"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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

const chartConfig = {
    amount: {
        label: "Monto",
        color: "#2563eb", // Blue 600
    },
} satisfies ChartConfig;

interface SepEvolutionChartProps {
    data: { month: number; amount: number; count: number }[];
    year: number;
}

export function SepEvolutionChart({ data, year }: SepEvolutionChartProps) {
    // Transform data to have month names
    const chartData = data.map((item) => {
        const date = new Date(year, item.month);
        return {
            ...item,
            monthName: format(date, "MMMM", { locale: es }),
        };
    });

    const hasData = chartData.some((d) => d.amount > 0);

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Inversión Mensual SEP</CardTitle>
                <CardDescription>
                    Evolución del gasto durante {year}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {hasData ? (
                    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                        <BarChart accessibilityLayer data={chartData}>
                            <CartesianGrid vertical={false} />
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
                                tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent indicator="dashed" />}
                            />
                            <Bar dataKey="amount" fill="var(--color-amount)" radius={4} />
                        </BarChart>
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
