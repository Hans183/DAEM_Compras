import { Compra, CompraFormData } from "@/types/compra";
import { CambiosObj } from "@/types/historial";

export function detectarCambios(
    compraOriginal: Compra,
    nuevosDatos: Partial<CompraFormData>
): CambiosObj {
    const cambios: CambiosObj = {};

    // Mapeo de campos a comparar
    const camposAComparar: (keyof CompraFormData)[] = [
        "numero_ordinario",
        "descripcion",
        "unidad_requirente",
        "comprador",
        "fecha_solicitud",
        "fecha_inicio",
        "subvencion",
        "estado",
        "presupuesto",
        "observacion",
        "motivo_anula"
    ];

    camposAComparar.forEach((key) => {
        const valorOriginal = compraOriginal[key];
        const valorNuevo = nuevosDatos[key];

        // Comparación simple (strict equality)
        // Manejo especial para undefined/null vs string vacio si es necesario
        // Pero en general queremos saber si cambió de valor.

        // Si ambos son null/undefined/vacios, se consideran iguales
        const isOriginalEmpty = valorOriginal === null || valorOriginal === undefined || valorOriginal === "";
        const isNewEmpty = valorNuevo === null || valorNuevo === undefined || valorNuevo === "";

        if (isOriginalEmpty && isNewEmpty) return;

        // Normalización para comparación (ej: números como string vs number)
        if (String(valorOriginal) !== String(valorNuevo)) {
            // Si el valor original no existía (era undefined en la creación o DB), guardamos null
            cambios[key] = {
                anterior: valorOriginal ?? null,
                nuevo: valorNuevo ?? null
            };
        }
    });

    return cambios;
}

export function generarResumenCambios(cambios: CambiosObj, accion: string): string {
    const keys = Object.keys(cambios);
    if (keys.length === 0) return `Acción: ${accion}`;

    if (accion === "creacion") return "Creó la solicitud de compra";
    if (accion === "eliminacion") return "Eliminó la solicitud de compra";

    // Para modificaciones, listamos los campos cambiados
    const camposLegibles = keys.map(k => k.replace(/_/g, " ")).join(", ");
    return `Modificó: ${camposLegibles}`;
}
