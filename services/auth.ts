
import { AuthUser } from '../types';
import * as db from './db';

const STORAGE_KEY_USER = 'geohunt_auth_user';

export const authService = {
    login: async (email: string): Promise<AuthUser | null> => {
        try {
            const users = await db.fetchAccountUsers();
            // Case insensitive match
            const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
            
            if (user) {
                const authUser: AuthUser = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role.split(' - ')[0] as any // Extract Role from "Owner - full access"
                };
                localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(authUser));
                return authUser;
            }
            return null;
        } catch (e) {
            console.error("Login failed", e);
            return null;
        }
    },

    logout: () => {
        localStorage.removeItem(STORAGE_KEY_USER);
    },

    getCurrentUser: (): AuthUser | null => {
        const stored = localStorage.getItem(STORAGE_KEY_USER);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch {
                return null;
            }
        }
        return null;
    }
};
