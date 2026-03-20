"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Compra } from "@/types/compra";
import type { OrdenCompra } from "@/types/orden-compra";

import { OrdenesCompraList } from "../../compras/components/ordenes-compra-list";
import { FacturasList } from "./facturas-list";

interface EditSepCompraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  compra: Compra;
  onSuccess: () => void;
}

export function EditSepCompraDialog({ open, onOpenChange, compra, onSuccess }: EditSepCompraDialogProps) {
  // Calculate total OC value from expanded data if available
  const totalOcValue = compra.expand?.["ordenes_compra(compra)"]
    ? (compra.expand["ordenes_compra(compra)"] as OrdenCompra[]).reduce((acc, curr) => acc + (curr.oc_valor || 0), 0)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-7xl">
        <DialogHeader>
          <DialogTitle>Gestionar Compra SEP: {compra.numero_ordinario}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 gap-4 rounded-lg border bg-muted/20 p-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <p className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">Descripción</p>
              <p className="line-clamp-2 text-sm">{compra.descripcion}</p>
            </div>
            <div>
              <p className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">Establecimiento</p>
              <p className="truncate text-sm">{compra.expand?.unidad_requirente?.nombre || "N/A"}</p>
            </div>
            <div>
              <p className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">Monto Total OCs</p>
              <p className="font-bold text-blue-600 text-sm">$ {new Intl.NumberFormat("es-CL").format(totalOcValue)}</p>
            </div>
          </div>

          <Tabs defaultValue="facturas" className="w-full">
            <TabsList className="mb-6 grid w-full grid-cols-2">
              <TabsTrigger value="facturas" className="py-2 text-sm">
                Facturas
              </TabsTrigger>
              <TabsTrigger value="ordenes" className="py-2 text-sm">
                Órdenes de Compra
              </TabsTrigger>
            </TabsList>

            <TabsContent value="facturas" className="mt-0 outline-none">
              <FacturasList compraId={compra.id} canEdit={true} onUpdate={onSuccess} />
            </TabsContent>

            <TabsContent value="ordenes" className="mt-0 outline-none">
              <OrdenesCompraList compraId={compra.id} canEdit={true} onUpdate={onSuccess} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
