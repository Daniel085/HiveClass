import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoogleOAuthButton } from '../GoogleOAuthButton';
import { useAuthStore } from '@/store/authStore';

// Mock the auth store
vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

describe('GoogleOAuthButton', () => {
  const mockLoginWithGoogle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      loginWithGoogle: mockLoginWithGoogle,
    });
  });

  it('should render with default text', () => {
    render(<GoogleOAuthButton />);
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
  });

  it('should render with custom text', () => {
    render(<GoogleOAuthButton text="Sign in with Google" />);
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
  });

  it('should call loginWithGoogle when clicked', async () => {
    const user = userEvent.setup();
    render(<GoogleOAuthButton nextUrl="/teacher" />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(mockLoginWithGoogle).toHaveBeenCalledWith('/teacher');
  });

  it('should use default nextUrl when not provided', async () => {
    const user = userEvent.setup();
    render(<GoogleOAuthButton />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(mockLoginWithGoogle).toHaveBeenCalledWith('/student');
  });

  it('should render Google logo SVG', () => {
    const { container } = render(<GoogleOAuthButton />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should apply fullWidth class when specified', () => {
    render(<GoogleOAuthButton fullWidth />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('w-full');
  });

  it('should not apply fullWidth class by default', () => {
    render(<GoogleOAuthButton />);
    const button = screen.getByRole('button');
    expect(button).not.toHaveClass('w-full');
  });
});
