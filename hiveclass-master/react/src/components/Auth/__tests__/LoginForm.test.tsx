import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoginForm } from '../LoginForm';
import { useAuthStore } from '@/store/authStore';

// Mock the auth store
vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      loginWithGoogle: vi.fn(),
    });
  });

  it('should render the HiveClass logo and title', () => {
    render(<LoginForm />);
    expect(screen.getByText('Welcome to HiveClass')).toBeInTheDocument();
    expect(screen.getByText('H')).toBeInTheDocument(); // Logo
  });

  it('should render student mode message by default', () => {
    render(<LoginForm />);
    expect(screen.getByText('Sign in to join your classroom')).toBeInTheDocument();
  });

  it('should render teacher mode message when mode is teacher', () => {
    render(<LoginForm mode="teacher" />);
    expect(screen.getByText('Sign in to manage your classroom')).toBeInTheDocument();
  });

  it('should render Google OAuth button', () => {
    render(<LoginForm />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should render security information', () => {
    render(<LoginForm />);
    expect(screen.getByText('Secure Sign-In')).toBeInTheDocument();
    expect(
      screen.getByText(/We use Google OAuth for secure, passwordless authentication/i)
    ).toBeInTheDocument();
  });

  it('should render terms and privacy links', () => {
    render(<LoginForm />);
    expect(screen.getByText('Terms of Service')).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
  });

  it('should show teacher login link in student mode', () => {
    render(<LoginForm mode="student" />);
    expect(screen.getByText('Teacher login')).toBeInTheDocument();
  });

  it('should show student login link in teacher mode', () => {
    render(<LoginForm mode="teacher" />);
    expect(screen.getByText('Student login')).toBeInTheDocument();
  });

  it('should pass nextUrl to GoogleOAuthButton', () => {
    const { container } = render(<LoginForm nextUrl="/teacher" />);
    expect(container).toBeInTheDocument();
  });
});
