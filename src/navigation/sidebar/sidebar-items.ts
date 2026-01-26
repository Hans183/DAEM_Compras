import {
  Building2,
  DollarSign,
  LayoutDashboard,
  type LucideIcon,
  ShoppingCart,
  Users,
  Package,
} from "lucide-react";


export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
  allowedRoles?: string[]; // Roles permitidos para ver este item
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
  allowedRoles?: string[]; // Roles permitidos para ver este item
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Dashboard Menu",
    items: [
      {
        title: "Inicio",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Usuarios",
        url: "/dashboard/users",
        icon: Users,
        allowedRoles: ["Admin", "Encargado compras"],
      },
      {
        title: "Compras",
        url: "/dashboard/compras",
        icon: ShoppingCart,
        allowedRoles: ["Admin", "Comprador", "Observador", "SEP", "Bodega", "Encargado compras"],
      },
      {
        title: "Recepciones",
        url: "/dashboard/recepciones",
        icon: Package,
        allowedRoles: ["Admin", "Bodega"],
      },

      {
        title: "Unidades Requirentes",
        url: "/dashboard/requirentes",
        icon: Building2,
        allowedRoles: ["Admin", "Comprador", "Encargado compras"],
      },
      {
        title: "Subvenciones",
        url: "/dashboard/subvenciones",
        icon: DollarSign,
        allowedRoles: ["Admin", "Comprador", "Encargado compras"],
      },
      {
        title: "Acciones SEP",
        url: "/dashboard/acciones",
        icon: Building2,
        allowedRoles: ["Admin", "SEP"],
      },
      {
        title: "RRHH SEP",
        url: "/dashboard/rrhh-sep",
        icon: Users,
        allowedRoles: ["Admin", "SEP"],
      },
      {
        title: "Reportes SEP",
        url: "/dashboard/reportes/sep",
        icon: Building2,
        allowedRoles: ["Admin", "SEP", "Observador"],
      },
    ],
  },
];
