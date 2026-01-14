import type { RecordModel } from "pocketbase";

/**
 * Available user roles in the system
 */
export const USER_ROLES = ["Comprador", "Observador", "SEP", "Bodega", "Encargado compras", "Admin"] as const;
export type UserRole = typeof USER_ROLES[number];

/**
 * User type based on PocketBase schema
 */
export interface User extends RecordModel {
    email: string;
    emailVisibility: boolean;
    verified: boolean;
    name: string;
    avatar?: string;
    dependencia?: string; // Relation ID
    role: UserRole[];
}

/**
 * Form data for creating a new user
 */
export interface CreateUserData {
    email: string;
    password: string;
    passwordConfirm: string;
    name: string;
    role: UserRole[];
    dependencia?: string;
    emailVisibility?: boolean;
    avatar?: File;
}

/**
 * Form data for updating an existing user
 */
export interface UpdateUserData {
    name?: string;
    email?: string;
    role?: UserRole[];
    dependencia?: string;
    emailVisibility?: boolean;
    avatar?: File;
    password?: string;
    passwordConfirm?: string;
    oldPassword?: string;
}

/**
 * Query parameters for fetching users
 */
export interface GetUsersParams {
    page?: number;
    perPage?: number;
    search?: string;
    sort?: string;
}
