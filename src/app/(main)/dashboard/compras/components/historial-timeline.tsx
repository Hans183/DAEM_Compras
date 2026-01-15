import { useEffect, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { getHistorialByCompra } from "@/services/historial.service";
import { HistorialCompra } from "@/types/historial";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { getUserAvatarUrl } from "@/services/users.service";

interface HistorialTimelineProps {
    compraId: string;
}

export function HistorialTimeline({ compraId }: HistorialTimelineProps) {
    const [historial, setHistorial] = useState<HistorialCompra[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistorial = async () => {
            setLoading(true);
            const logs = await getHistorialByCompra(compraId);
            setHistorial(logs);
            setLoading(false);
        };

        if (compraId) {
            fetchHistorial();
        }
    }, [compraId]);

    if (loading) {
        return (
            <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (historial.length === 0) {
        return (
            <div className="text-center p-4 text-muted-foreground text-sm">
                No hay historial registrado para esta compra.
            </div>
        );
    }

    return (
        <ScrollArea className="h-[300px] w-full pr-4">
            <div className="space-y-6">
                {historial.map((log) => (
                    <div key={log.id} className="relative pl-6 border-l-2 border-muted pb-1 last:pb-0">
                        {/* Dot */}
                        <div className="absolute top-0 -left-[5px] h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />

                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 mb-1">
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={log.expand?.usuario ? getUserAvatarUrl(log.expand.usuario) : undefined} />
                                    <AvatarFallback className="text-[10px]">
                                        {log.expand?.usuario?.name?.substring(0, 2).toUpperCase() || "??"}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium">
                                    {log.expand?.usuario?.name || "Usuario desconocido"}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(log.created), { addSuffix: true, locale: es })}
                                </span>
                            </div>

                            <p className="text-sm font-medium">{log.resumen}</p>

                            {/* Mostrar detalles de cambios si existen y no es solo creación */}
                            {log.accion === 'modificacion' && log.cambios && Object.keys(log.cambios).length > 0 && (
                                <div className="mt-2 text-xs bg-muted/50 p-2 rounded border">
                                    <ul className="space-y-1">
                                        {Object.entries(log.cambios).map(([key, diff]) => (
                                            <li key={key} className="flex flex-col sm:flex-row sm:gap-2">
                                                <span className="font-semibold capitalize text-muted-foreground">
                                                    {key.replace(/_/g, " ")}:
                                                </span>
                                                <span>
                                                    <span className="line-through text-red-400 mr-2 opacity-70">
                                                        {String(diff.anterior ?? "Vacío")}
                                                    </span>
                                                    <span className="text-green-600 font-medium">
                                                        {String(diff.nuevo ?? "Vacío")}
                                                    </span>
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <span className="text-[10px] text-muted-foreground ml-auto block pt-1">
                                {format(new Date(log.created), "dd/MM/yyyy HH:mm")}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
}
