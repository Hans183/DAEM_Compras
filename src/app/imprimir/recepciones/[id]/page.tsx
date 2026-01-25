"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getRecepcionById } from "@/services/recepciones.service";
import { Recepcion } from "@/types/recepcion";
import { RecepcionPrintTemplate } from "../components/recepcion-print-template";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function RecepcionPrintPage() {
    const params = useParams();
    const id = params.id as string;
    const [recepcion, setRecepcion] = useState<Recepcion | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getRecepcionById(id);
                setRecepcion(data);

                // Trigger print after a short delay to ensure rendering
                setTimeout(() => {
                    window.print();
                }, 1000);
            } catch (error) {
                console.error(error);
                toast.error("Error al cargar la recepción");
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id]);

    if (isLoading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Preparando documento...</span>
            </div>
        );
    }

    if (!recepcion) {
        return (
            <div className="flex h-screen w-screen items-center justify-center text-red-500">
                Recepción no encontrada
            </div>
        );
    }

    return (
        <div id="printable-sheet" className="bg-gray-100 min-h-screen p-8 print:bg-white print:p-0 print:m-0 print:absolute print:top-0 print:left-0">
            <style jsx global>{`
                @media print {
                    @page {
                        margin: 0;
                        size: auto;
                    }
                    body {
                        background: white;
                    }
                    /* Override globals.css constraints if needed */
                    #printable-sheet {
                       padding: 0 !important;
                       margin: 0 !important;
                       width: 100% !important;
                       max-width: none !important;
                    }
                    .page-break {
                        page-break-after: always;
                    }
                }
            `}</style>

            <div className="mx-auto max-w-[210mm] space-y-8 print:space-y-0 text-black">
                {/* 1. ORIGINAL */}
                <div className="page-break">
                    <RecepcionPrintTemplate recepcion={recepcion} label="ORIGINAL" />
                </div>

                {/* 2. COPIA ESTABLECIMIENTO */}
                <div className="page-break">
                    <RecepcionPrintTemplate recepcion={recepcion} label="COPIA ESTABLECIMIENTO" />
                </div>

                {/* 3. COPIA BODEGA */}
                <div>
                    <RecepcionPrintTemplate recepcion={recepcion} label="COPIA BODEGA" />
                </div>
            </div>
        </div>
    );
}
