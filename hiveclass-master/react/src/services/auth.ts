/**
 * Authentication Service
 *
 * Handles Google OAuth authentication with the backend auth server.
 * Uses modernized Hapi v21 + MongoDB v6 backend (Phase 7).
 */

import type { UserProfile } from './api-endpoints';
import { AUTH_API } from './api-endpoints';

export class AuthService {
  /**
   * Redirect to Google OAuth login
   * @param nextUrl - URL to redirect to after successful login
   */
  static loginWithGoogle(nextUrl: string = '/student'): void {
    const loginUrl = `${AUTH_API.GOOGLE_AUTH}?next=${encodeURIComponent(nextUrl)}`;
    window.location.href = loginUrl;
  }

  /**
   * Check if user is authenticated
   * @returns Promise<boolean> - true if authenticated, false otherwise
   */
  static async checkAuth(): Promise<boolean> {
    try {
      const response = await fetch(AUTH_API.CHECK_AUTH, {
        method: 'GET',
        credentials: 'include', // Include cookies
      });
      return response.status === 204; // 204 = authenticated, 402 = not authenticated
    } catch (error) {
      console.error('Auth check failed:', error);
      return false;
    }
  }

  /**
   * Get current user profile
   * @returns Promise<UserProfile | null> - User profile or null if not authenticated
   */
  static async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const response = await fetch(AUTH_API.ME, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Get user failed:', error);
      return null;
    }
  }

  /**
   * Logout current user
   * Invalidates session and revokes Google OAuth token
   */
  static async logout(): Promise<void> {
    try {
      await fetch(AUTH_API.LOGOUT, {
        method: 'GET',
        credentials: 'include',
      });
      // Redirect to login after logout
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }
}
