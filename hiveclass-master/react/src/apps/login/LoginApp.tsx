/**
 * Login Application
 *
 * Handles user authentication via Google OAuth.
 * Redirects authenticated users to their respective dashboards.
 */

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { LoginForm } from '@/components/Auth/LoginForm';

export function LoginApp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  // Get next URL from query params (e.g., /login?next=/teacher)
  const nextUrl = searchParams.get('next') || '/student';

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate(nextUrl, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, nextUrl]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 font-medium">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4 py-12">
      <LoginForm nextUrl={nextUrl} mode="student" />
    </div>
  );
}
