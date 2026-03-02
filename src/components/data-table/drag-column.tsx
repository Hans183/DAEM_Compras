"use no memo";

import { useSortable } from "@dnd-kit/sortable";
import type { ColumnDef } from "@tanstack/react-table";
import { GripVertical } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { Compra } from "./compra";
// Import types for related entities if they are used in the ColumnDef
import type { OrdenCompra } from "./orden-compra";

function DragHandle({ id }: { id: number | string }) {
  const { attributes, listeners } = useSortable({
    id,
  });

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="size-7 text-muted-foreground hover:bg-transparent"
    >
      <GripVertical className="size-3 text-muted-foreground" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  );
}

export const dragColumn: ColumnDef<{
  id: number | string;
  orden_compra?: OrdenCompra;
  compra?: Compra;
  [key: string]: unknown;
}> = {
  id: "drag",
  header: () => null,
  cell: ({ row }) => <DragHandle id={row.original.id} />,
  enableSorting: false,
  enableHiding: false,
};
