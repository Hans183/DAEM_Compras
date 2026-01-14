import type { ListResult } from "pocketbase";

import pb from "@/lib/pocketbase";
import type { CreateUserData, GetUsersParams, UpdateUserData, User } from "@/types/user";

const USERS_COLLECTION = "users";

/**
 * Update profile data for current user
 */
export interface UpdateProfileData {
    name?: string;
    email?: string;
    avatar?: File;
    password?: string;
    passwordConfirm?: string;
    oldPassword?: string;
}

/**
 * Get paginated list of users
 */
export async function getUsers(params: GetUsersParams = {}): Promise<ListResult<User>> {
    const { page = 1, perPage = 30, search = "", sort = "-created" } = params;

    try {
        const filter = search ? `name ~ "${search}" || email ~ "${search}"` : "";

        return await pb.collection(USERS_COLLECTION).getList<User>(page, perPage, {
            filter,
            sort,
            expand: "dependencia", // Expand relation if needed
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
    }
}

/**
 * Get a single user by ID
 */
export async function getUserById(id: string): Promise<User> {
    try {
        return await pb.collection(USERS_COLLECTION).getOne<User>(id, {
            expand: "dependencia",
        });
    } catch (error) {
        console.error(`Error fetching user ${id}:`, error);
        throw error;
    }
}

export async function createUser(data: CreateUserData): Promise<User> {
    try {
        const formData = new FormData();

        formData.append("email", data.email);
        formData.append("password", data.password);
        formData.append("passwordConfirm", data.passwordConfirm);
        formData.append("name", data.name);
        data.role.forEach(r => formData.append("role", r));
        formData.append("emailVisibility", String(data.emailVisibility ?? true));

        if (data.dependencia) {
            formData.append("dependencia", data.dependencia);
        }

        if (data.avatar) {
            formData.append("avatar", data.avatar);
        }

        return await pb.collection(USERS_COLLECTION).create<User>(formData);
    } catch (error: any) {
        // console.error("Error creating user:", error);
        throw error;
    }
}

/**
 * Update an existing user
 */
export async function updateUser(id: string, data: UpdateUserData): Promise<User> {
    try {
        const formData = new FormData();

        if (data.name) formData.append("name", data.name);
        if (data.email) formData.append("email", data.email);
        if (data.role && data.role.length > 0) {
            data.role.forEach(r => formData.append("role", r));
        }
        if (data.dependencia) formData.append("dependencia", data.dependencia);
        if (data.emailVisibility !== undefined) {
            formData.append("emailVisibility", String(data.emailVisibility));
        }

        if (data.avatar) {
            formData.append("avatar", data.avatar);
        }

        // Handle password update if provided
        if (data.password && data.passwordConfirm) {
            formData.append("password", data.password);
            formData.append("passwordConfirm", data.passwordConfirm);
            if (data.oldPassword) {
                formData.append("oldPassword", data.oldPassword);
            }
        }

        return await pb.collection(USERS_COLLECTION).update<User>(id, formData);
    } catch (error) {
        console.error(`Error updating user ${id}:`, error);
        throw error;
    }
}

/**
 * Delete a user
 */
export async function deleteUser(id: string): Promise<boolean> {
    try {
        await pb.collection(USERS_COLLECTION).delete(id);
        return true;
    } catch (error) {
        console.error(`Error deleting user ${id}:`, error);
        throw error;
    }
}

/**
 * Update current user's profile
 */
export async function updateCurrentUserProfile(data: UpdateProfileData): Promise<User> {
    try {
        const currentUser = pb.authStore.model;
        if (!currentUser) {
            throw new Error("No hay usuario autenticado");
        }

        const formData = new FormData();

        if (data.name) formData.append("name", data.name);
        if (data.email) formData.append("email", data.email);
        if (data.avatar) formData.append("avatar", data.avatar);

        // Handle password update if provided
        if (data.password && data.passwordConfirm) {
            formData.append("password", data.password);
            formData.append("passwordConfirm", data.passwordConfirm);
            if (data.oldPassword) {
                formData.append("oldPassword", data.oldPassword);
            }
        }

        const updatedUser = await pb.collection(USERS_COLLECTION).update<User>(currentUser.id, formData);

        // Update auth store with new user data
        pb.authStore.save(pb.authStore.token, updatedUser);

        return updatedUser;
    } catch (error) {
        console.error("Error updating profile:", error);
        throw error;
    }
}

/**
 * Get avatar URL for a user
 */
export function getUserAvatarUrl(user: User): string | undefined {
    if (!user.avatar) return undefined;

    return pb.files.getURL(user, user.avatar, {
        thumb: "100x100",
    });
}
