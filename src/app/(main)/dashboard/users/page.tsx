"use client";

import { useEffect, useState } from "react";

import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { getUsers } from "@/services/users.service";
import type { User } from "@/types/user";

import { UserDialog } from "./components/user-dialog";
import { UsersTable } from "./components/users-table";

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showCreateDialog, setShowCreateDialog] = useState(false);

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const result = await getUsers({
                page: currentPage,
                perPage: 10,
                search,
            });
            setUsers(result.items);
            setTotalPages(result.totalPages);
        } catch (error) {
            console.error("Error loading users:", error);
            toast.error("Error al cargar usuarios");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, [currentPage, search]);

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setCurrentPage(1); // Reset to first page on search
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
                    <p className="text-muted-foreground">
                        Gestiona los usuarios del sistema
                    </p>
                </div>
                <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Usuario
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre o email..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
            ) : (
                <>
                    <UsersTable users={users} onUserUpdated={loadUsers} />

                    {totalPages > 1 && (
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                    // Show first page, last page, current page, and pages around current
                                    if (
                                        page === 1 ||
                                        page === totalPages ||
                                        (page >= currentPage - 1 && page <= currentPage + 1)
                                    ) {
                                        return (
                                            <PaginationItem key={page}>
                                                <PaginationLink
                                                    onClick={() => setCurrentPage(page)}
                                                    isActive={currentPage === page}
                                                    className="cursor-pointer"
                                                >
                                                    {page}
                                                </PaginationLink>
                                            </PaginationItem>
                                        );
                                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                                        return (
                                            <PaginationItem key={page}>
                                                <PaginationEllipsis />
                                            </PaginationItem>
                                        );
                                    }
                                    return null;
                                })}

                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        className={
                                            currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
                                        }
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    )}
                </>
            )}

            <UserDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                onSuccess={() => {
                    setShowCreateDialog(false);
                    loadUsers();
                }}
            />
        </div>
    );
}
