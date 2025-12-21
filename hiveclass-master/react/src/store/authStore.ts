/**
 * Authentication State Store (Zustand)
 *
 * Manages global authentication state for the HiveClass React app.
 * Stores user profile, auth status, and provides auth actions.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile } from '@/services/api-endpoints';
import { AuthService } from '@/services/auth';

interface AuthState {
  /** Current authenticated user profile */
  user: UserProfile | null;

  /** Whether the user is authenticated */
  isAuthenticated: boolean;

  /** Whether auth check is in progress */
  isLoading: boolean;

  /** Current auth error, if any */
  error: Error | null;

  /** Login with Google OAuth */
  loginWithGoogle: (nextUrl?: string) => void;

  /** Check if user is authenticated and load profile */
  checkAuth: () => Promise<void>;

  /** Get current user profile */
  loadUser: () => Promise<void>;

  /** Logout current user */
  logout: () => Promise<void>;

  /** Clear auth error */
  clearError: () => void;
}

/**
 * Global authentication store
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, isAuthenticated, loginWithGoogle, logout } = useAuthStore();
 *
 *   if (!isAuthenticated) {
 *     return <button onClick={() => loginWithGoogle()}>Login</button>;
 *   }
 *
 *   return <div>Welcome {user?.firstname}! <button onClick={logout}>Logout</button></div>;
 * }
 * ```
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      loginWithGoogle: (nextUrl = '/student') => {
        AuthService.loginWithGoogle(nextUrl);
      },

      checkAuth: async () => {
        set({ isLoading: true, error: null });
        try {
          const isAuth = await AuthService.checkAuth();
          if (isAuth) {
            await get().loadUser();
          } else {
            set({ isAuthenticated: false, user: null });
          }
        } catch (error) {
          set({ error: error as Error, isAuthenticated: false, user: null });
        } finally {
          set({ isLoading: false });
        }
      },

      loadUser: async () => {
        set({ isLoading: true, error: null });
        try {
          const user = await AuthService.getCurrentUser();
          if (user) {
            set({ user, isAuthenticated: true });
          } else {
            set({ user: null, isAuthenticated: false });
          }
        } catch (error) {
          set({ error: error as Error, user: null, isAuthenticated: false });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        set({ isLoading: true, error: null });
        try {
          await AuthService.logout();
          set({ user: null, isAuthenticated: false });
        } catch (error) {
          set({ error: error as Error });
        } finally {
          set({ isLoading: false });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'hiveclass-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
