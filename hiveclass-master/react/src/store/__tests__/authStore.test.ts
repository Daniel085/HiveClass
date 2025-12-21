import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuthStore } from '../authStore';
import { AuthService } from '@/services/auth';

// Mock AuthService
vi.mock('@/services/auth', () => ({
  AuthService: {
    loginWithGoogle: vi.fn(),
    checkAuth: vi.fn(),
    getCurrentUser: vi.fn(),
    logout: vi.fn(),
  },
}));

describe('authStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it('should have initial state', () => {
    const { result } = renderHook(() => useAuthStore());

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should call AuthService.loginWithGoogle with default nextUrl', () => {
    const { result } = renderHook(() => useAuthStore());

    act(() => {
      result.current.loginWithGoogle();
    });

    expect(AuthService.loginWithGoogle).toHaveBeenCalledWith('/student');
  });

  it('should call AuthService.loginWithGoogle with custom nextUrl', () => {
    const { result } = renderHook(() => useAuthStore());

    act(() => {
      result.current.loginWithGoogle('/teacher');
    });

    expect(AuthService.loginWithGoogle).toHaveBeenCalledWith('/teacher');
  });

  it('should check auth and load user on successful auth', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      firstname: 'Test',
      lastname: 'User',
    };

    vi.mocked(AuthService.checkAuth).mockResolvedValue(true);
    vi.mocked(AuthService.getCurrentUser).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.checkAuth();
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  it('should set isAuthenticated to false when auth check fails', async () => {
    vi.mocked(AuthService.checkAuth).mockResolvedValue(false);

    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.checkAuth();
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should load user profile', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      firstname: 'Test',
      lastname: 'User',
    };

    vi.mocked(AuthService.getCurrentUser).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.loadUser();
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  it('should handle loadUser error', async () => {
    vi.mocked(AuthService.getCurrentUser).mockResolvedValue(null);

    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.loadUser();
    });

    await waitFor(() => {
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  it('should logout and clear user state', async () => {
    // Set initial authenticated state
    useAuthStore.setState({
      user: { id: '123', email: 'test@example.com', firstname: 'Test', lastname: 'User' },
      isAuthenticated: true,
    });

    vi.mocked(AuthService.logout).mockResolvedValue();

    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.logout();
    });

    await waitFor(() => {
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  it('should clear error', () => {
    const testError = new Error('Test error');
    useAuthStore.setState({ error: testError });

    const { result } = renderHook(() => useAuthStore());

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should set error on checkAuth failure', async () => {
    const testError = new Error('Auth failed');
    vi.mocked(AuthService.checkAuth).mockRejectedValue(testError);

    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.checkAuth();
    });

    await waitFor(() => {
      expect(result.current.error).toEqual(testError);
      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});
