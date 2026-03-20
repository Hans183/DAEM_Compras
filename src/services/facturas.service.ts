import pb from "@/lib/pocketbase";
import type { Factura, FacturaFormData } from "@/types/factura";

export const FACTURAS_COLLECTION = "facturas";

export async function getFacturasByCompra(compraId: string) {
  return await pb.collection(FACTURAS_COLLECTION).getList<Factura>(1, 50, {
    filter: `compra = "${compraId}"`,
    sort: "-fecha",
  });
}

export async function createFactura(data: FacturaFormData) {
  const formData = new FormData();
  formData.append("compra", data.compra);
  formData.append("factura", data.factura);
  formData.append("monto", data.monto.toString());
  formData.append("fecha", data.fecha);

  if (data.documento) {
    formData.append("documento", data.documento);
  }

  return await pb.collection(FACTURAS_COLLECTION).create<Factura>(formData);
}

export async function updateFactura(id: string, data: Partial<FacturaFormData>) {
  const formData = new FormData();
  if (data.compra) formData.append("compra", data.compra);
  if (data.factura) formData.append("factura", data.factura);
  if (data.monto !== undefined) formData.append("monto", data.monto.toString());
  if (data.fecha) formData.append("fecha", data.fecha);

  if (data.documento) {
    formData.append("documento", data.documento);
  }

  return await pb.collection(FACTURAS_COLLECTION).update<Factura>(id, formData);
}

export async function deleteFactura(id: string) {
  return await pb.collection(FACTURAS_COLLECTION).delete(id);
}

export function getFacturaFileUrl(record: Factura, filename: string) {
  if (!filename) return null;
  return pb.files.getUrl(record, filename);
}
