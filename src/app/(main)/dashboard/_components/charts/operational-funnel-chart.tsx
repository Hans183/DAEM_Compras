"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, LabelList } from "recharts";

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

export const description = "Embudo de Operaciones de Compras";

const chartConfig = {
    count: {
        label: "Cantidad",
    },
    solicitudes: {
        label: "Solicitudes",
        color: "#60a5fa", // Blue 400
    },
    asignadas: {
        label: "Asignadas",
        color: "#facc15", // Yellow 400
    },
    "con-oc": {
        label: "Con Orden de Compra",
        color: "#a78bfa", // Violet 400
    },
    terminadas: {
        label: "Terminadas",
        color: "#4ade80", // Green 400
    },
} satisfies ChartConfig;

interface OperationalFunnelChartProps {
    data: { stage: string; count: number; fill: string }[];
}

export function OperationalFunnelChart({ data }: OperationalFunnelChartProps) {
    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="items-start pb-0">
                <CardTitle>Embudo de Operaciones</CardTitle>
                <CardDescription>
                    Flujo de solicitudes desde creación hasta término
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer config={chartConfig} className="mx-auto max-h-[300px] w-full">
                    <BarChart
                        accessibilityLayer
                        data={data}
                        layout="vertical"
                        margin={{
                            left: 0,
                        }}
                    >
                        <CartesianGrid horizontal={false} />
                        <YAxis
                            dataKey="stage"
                            type="category"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            width={100}
                        />
                        <XAxis dataKey="count" type="number" hide />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Bar dataKey="count" layout="vertical" radius={5}>
                            <LabelList
                                dataKey="count"
                                position="right"
                                offset={8}
                                className="fill-foreground font-bold"
                                fontSize={12}
                            />
                        </Bar>
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
