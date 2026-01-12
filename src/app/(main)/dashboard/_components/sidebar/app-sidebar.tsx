"use client";

import Link from "next/link";
import Image from "next/image";

import { CircleHelp, ClipboardList, Command, Database, File, Search, Settings } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { APP_CONFIG } from "@/config/app-config";
import { useAuth } from "@/hooks/use-auth";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

const _data = {
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: Settings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: CircleHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: Search,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: Database,
    },
    {
      name: "Reports",
      url: "#",
      icon: ClipboardList,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: File,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { sidebarVariant, sidebarCollapsible, isSynced } = usePreferencesStore(
    useShallow((s) => ({
      sidebarVariant: s.sidebarVariant,
      sidebarCollapsible: s.sidebarCollapsible,
      isSynced: s.isSynced,
    })),
  );

  const { user } = useAuth();
  const { state } = useSidebar();

  const variant = isSynced ? sidebarVariant : props.variant;
  const collapsible = isSynced ? sidebarCollapsible : props.collapsible;

  const isCollapsed = state === "collapsed";

  return (
    <Sidebar {...props} variant={variant} collapsible={collapsible}>
      <SidebarHeader className="h-auto min-h-[80px]">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-auto py-3">
              <Link prefetch={false} href="/dashboard" className="flex items-center justify-center">
                {isCollapsed ? (
                  // Letra "D" cuando está colapsado
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-900 text-white font-bold text-2xl">
                    D
                  </div>
                ) : (
                  // Logo completo cuando está expandido
                  <div className="w-full max-w-[300px]">
                    {/* Logo para tema claro */}
                    <Image
                      src="/images/logo-daem.svg"
                      alt="Logo DAEM"
                      width={340}
                      height={340}
                      priority
                      className="block dark:hidden w-full h-auto object-contain"
                      style={{ maxHeight: '60px' }}
                    />
                    {/* Logo para tema oscuro */}
                    <Image
                      src="/images/logo-daem-dark.svg"
                      alt="Logo DAEM"
                      width={340}
                      height={340}
                      priority
                      className="hidden dark:block w-full h-auto object-contain"
                      style={{ maxHeight: '60px' }}
                    />
                  </div>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarItems} userRole={user?.role} />
        {/* <NavDocuments items={data.documents} /> */}
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        {user && <NavUser user={user} />}
      </SidebarFooter>
    </Sidebar>
  );
}
