import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginApp } from '../LoginApp';
import { useAuthStore } from '@/store/authStore';

// Mock the auth store
vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

describe('LoginApp', () => {
  const mockCheckAuth = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login form when not authenticated', async () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      checkAuth: mockCheckAuth,
    });

    render(
      <MemoryRouter>
        <LoginApp />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Welcome to HiveClass')).toBeInTheDocument();
    });
  });

  it('should call checkAuth on mount', () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      checkAuth: mockCheckAuth,
    });

    render(
      <MemoryRouter>
        <LoginApp />
      </MemoryRouter>
    );

    expect(mockCheckAuth).toHaveBeenCalled();
  });

  it('should show loading state while checking auth', () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      checkAuth: mockCheckAuth,
    });

    render(
      <MemoryRouter>
        <LoginApp />
      </MemoryRouter>
    );

    expect(screen.getByText('Checking authentication...')).toBeInTheDocument();
  });

  it('should render Google OAuth button', async () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      checkAuth: mockCheckAuth,
    });

    render(
      <MemoryRouter>
        <LoginApp />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    });
  });
});
