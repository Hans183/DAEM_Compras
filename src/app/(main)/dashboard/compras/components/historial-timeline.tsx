import { useEffect, useState } from "react";

import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getHistorialByCompra } from "@/services/historial.service";
import { getUserAvatarUrl } from "@/services/users.service";
import type { HistorialCompra } from "@/types/historial";

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
      <div className="p-4 text-center text-muted-foreground text-sm">No hay historial registrado para esta compra.</div>
    );
  }

  return (
    <ScrollArea className="h-[300px] w-full pr-4">
      <div className="space-y-6">
        {historial.map((log) => (
          <div key={log.id} className="relative border-muted border-l-2 pb-1 pl-6 last:pb-0">
            {/* Dot */}
            <div className="-left-[5px] absolute top-0 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />

            <div className="flex flex-col gap-1">
              <div className="mb-1 flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={log.expand?.usuario ? getUserAvatarUrl(log.expand.usuario) : undefined} />
                  <AvatarFallback className="text-[10px]">
                    {log.expand?.usuario?.name?.substring(0, 2).toUpperCase() || "??"}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm">{log.expand?.usuario?.name || "Usuario desconocido"}</span>
                <span className="text-muted-foreground text-xs">
                  {formatDistanceToNow(new Date(log.created), { addSuffix: true, locale: es })}
                </span>
              </div>

              <p className="font-medium text-sm">{log.resumen}</p>

              {/* Mostrar detalles de cambios si existen y no es solo creación */}
              {log.accion === "modificacion" && log.cambios && Object.keys(log.cambios).length > 0 && (
                <div className="mt-2 rounded border bg-muted/50 p-2 text-xs">
                  <ul className="space-y-1">
                    {Object.entries(log.cambios).map(([key, diff]) => (
                      <li key={key} className="flex flex-col sm:flex-row sm:gap-2">
                        <span className="font-semibold text-muted-foreground capitalize">
                          {key.replace(/_/g, " ")}:
                        </span>
                        <span>
                          <span className="mr-2 text-red-400 line-through opacity-70">
                            {String(diff.anterior ?? "Vacío")}
                          </span>
                          <span className="font-medium text-green-600">{String(diff.nuevo ?? "Vacío")}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <span className="ml-auto block pt-1 text-[10px] text-muted-foreground">
                {format(new Date(log.created), "dd/MM/yyyy HH:mm")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
