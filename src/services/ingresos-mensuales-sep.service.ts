import pb from "@/lib/pocketbase";
import type { IngresoMensualSep, IngresoMensualSepFormData } from "@/types/ingreso-mensual-sep";

export const INGRESOS_MENSUALES_SEP_COLLECTION = "ingresos_mensuales_sep";

export async function getIngresosMensualesSep({
  page = 1,
  perPage = 50,
  filter = "",
  sort = "-created",
  mes,
  anio,
}: {
  page?: number;
  perPage?: number;
  filter?: string;
  sort?: string;
  mes?: string;
  anio?: number;
}) {
  let finalFilter = filter;
  if (mes) {
    finalFilter = finalFilter ? `${finalFilter} && mes = "${mes}"` : `mes = "${mes}"`;
  }
  if (anio) {
    finalFilter = finalFilter ? `${finalFilter} && anio = ${anio}` : `anio = ${anio}`;
  }

  return await pb.collection(INGRESOS_MENSUALES_SEP_COLLECTION).getList<IngresoMensualSep>(page, perPage, {
    filter: finalFilter,
    sort,
    expand: "requirente",
  });
}

export async function createIngresoMensualSep(data: IngresoMensualSepFormData) {
  return await pb.collection(INGRESOS_MENSUALES_SEP_COLLECTION).create<IngresoMensualSep>(data);
}

export async function updateIngresoMensualSep(id: string, data: Partial<IngresoMensualSepFormData>) {
  return await pb.collection(INGRESOS_MENSUALES_SEP_COLLECTION).update<IngresoMensualSep>(id, data);
}

export async function deleteIngresoMensualSep(id: string) {
  return await pb.collection(INGRESOS_MENSUALES_SEP_COLLECTION).delete(id);
}
