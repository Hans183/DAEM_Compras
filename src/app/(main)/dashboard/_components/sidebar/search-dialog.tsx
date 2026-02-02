"use client";
import * as React from "react";

import { LayoutDashboard, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

const searchItems = [
  { group: "Dashboards", icon: LayoutDashboard, label: "Default" },
];

import { useRouter, useSearchParams } from "next/navigation";

// ... (existing imports)

export function SearchDialog() {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSearch = (term: string) => {
    setOpen(false);
    // Always navigate to the compras page with the search term
    const params = new URLSearchParams();
    if (term) {
      params.set("search", term);
      router.push(`/dashboard/compras?${params.toString()}`);
    } else {
      // If empty? Maybe just stay or go to compras without params
      router.push(`/dashboard/compras`);
    }
  };

  return (
    <>
      <Button
        variant="link"
        className="!px-0 font-normal text-muted-foreground hover:no-underline"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
        Search
        <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium text-[10px]">
          <span className="text-xs">⌘</span>J
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search dashboards, users, and more…"
          value={searchValue}
          onValueChange={setSearchValue}
        />
        <CommandList>
          <CommandEmpty>
            {searchValue ? (
              <div
                className="py-6 text-center text-sm cursor-pointer hover:bg-accent"
                onClick={() => handleSearch(searchValue)}
              >
                Buscar: <span className="font-bold">"{searchValue}"</span>
              </div>
            ) : (
              "No results found."
            )}
          </CommandEmpty>

          {searchValue && (
            <CommandGroup heading="Búsqueda Global">
              <CommandItem onSelect={() => handleSearch(searchValue)}>
                <Search className="mr-2 h-4 w-4" />
                <span>Buscar "{searchValue}"</span>
              </CommandItem>
            </CommandGroup>
          )}

          {[...new Set(searchItems.map((item) => item.group))].map((group, i) => (
            <React.Fragment key={group}>
              {i !== 0 && <CommandSeparator />}
              <CommandGroup heading={group} key={group}>
                {searchItems
                  .filter((item) => item.group === group)
                  .map((item) => (
                    <CommandItem className="!py-1.5" key={item.label} onSelect={() => setOpen(false)}>
                      {item.icon && <item.icon />}
                      <span>{item.label}</span>
                    </CommandItem>
                  ))}
              </CommandGroup>
            </React.Fragment>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
