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

export const description = "Evolución de tiempos de gestión";

const chartConfig = {
    days: {
        label: "Días Promedio",
        color: "#2563eb", // Blue 600
    },
} satisfies ChartConfig;

interface ProcessingTimeChartProps {
    data: { month: string; days: number }[];
}

export function ProcessingTimeChart({ data }: ProcessingTimeChartProps) {
    const hasData = data && data.length > 0;

    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="items-start pb-0">
                <CardTitle>Tiempos de Gestión</CardTitle>
                <CardDescription>
                    Promedio de días desde Solicitud hasta Orden de Compra (Mensual)
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-4">
                {hasData ? (
                    <ChartContainer config={chartConfig} className="w-full h-[300px]">
                        <BarChart accessibilityLayer data={data} margin={{ top: 20 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="month"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                tickFormatter={(value) => value.slice(0, 3)}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickMargin={10}
                                allowDecimals={false}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent indicator="dashed" />}
                            />
                            <Bar dataKey="days" fill="var(--color-days)" radius={4} />
                        </BarChart>
                    </ChartContainer>
                ) : (
                    <div className="flex h-[300px] w-full items-center justify-center text-muted-foreground">
                        No hay datos suficientes para mostrar la evolución.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
