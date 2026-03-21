import pb from "@/lib/pocketbase";
import type { IngresoMensualSep, IngresoMensualSepFormData } from "@/types/ingreso-mensual-sep";
import type { Requirente } from "@/types/requirente";

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
  // Check if requirente belongs to Red Trumao
  const requirente = await pb.collection("requirente").getOne<Requirente>(data.requirente);
  const isRedTrumao = requirente.red_trumao;

  const prio_10 = isRedTrumao ? 0 : data.prioritarios * 0.1;
  const pref_10 = isRedTrumao ? 0 : data.preferentes * 0.1;
  const prio_reflejar = isRedTrumao ? data.prioritarios : data.prioritarios * 0.9;
  const pref_reflejar = isRedTrumao ? data.preferentes : data.preferentes * 0.9;
  const total_reflejar = prio_reflejar + pref_reflejar;

  return await pb.collection(INGRESOS_MENSUALES_SEP_COLLECTION).create<IngresoMensualSep>({
    ...data,
    prio_10,
    pref_10,
    prio_reflejar,
    pref_reflejar,
    total_reflejar,
  });
}

export async function updateIngresoMensualSep(id: string, data: Partial<IngresoMensualSepFormData>) {
  // If numeric fields or requirente are provided, re-calculate everything to keep consistency
  const updateData: Partial<IngresoMensualSep> = { ...data };

  if (data.prioritarios !== undefined || data.preferentes !== undefined || data.requirente !== undefined) {
    // We need the requirente info to check Red Trumao status
    const requirenteId =
      data.requirente ||
      (await pb.collection(INGRESOS_MENSUALES_SEP_COLLECTION).getOne<IngresoMensualSep>(id)).requirente;
    const requirente = await pb.collection("requirente").getOne<Requirente>(requirenteId);
    const isRedTrumao = requirente.red_trumao;

    const prioritarios = data.prioritarios ?? 0;
    const preferentes = data.preferentes ?? 0;

    updateData.prio_10 = isRedTrumao ? 0 : prioritarios * 0.1;
    updateData.pref_10 = isRedTrumao ? 0 : preferentes * 0.1;
    updateData.prio_reflejar = isRedTrumao ? prioritarios : prioritarios * 0.9;
    updateData.pref_reflejar = isRedTrumao ? preferentes : preferentes * 0.9;
    updateData.total_reflejar = (updateData.prio_reflejar || 0) + (updateData.pref_reflejar || 0);
  }

  return await pb.collection(INGRESOS_MENSUALES_SEP_COLLECTION).update<IngresoMensualSep>(id, updateData);
}

export async function deleteIngresoMensualSep(id: string) {
  return await pb.collection(INGRESOS_MENSUALES_SEP_COLLECTION).delete(id);
}
