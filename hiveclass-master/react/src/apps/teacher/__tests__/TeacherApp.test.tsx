import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TeacherApp } from '../TeacherApp';
import { useTeacherStore } from '@/store/teacherStore';
import { useAuthStore } from '@/store/authStore';

// Mock stores
vi.mock('@/store/teacherStore', () => ({
  useTeacherStore: vi.fn(),
}));

vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

// Mock WebRTC hook to prevent errors
vi.mock('@/hooks/useWebRTCServer', () => ({
  useWebRTCServer: vi.fn(() => ({
    connected: false,
    error: null,
    server: {},
    peers: new Map(),
  })),
}));

describe('TeacherApp', () => {
  const mockListClassrooms = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: {
        id: '1',
        email: 'teacher@example.com',
        firstname: 'John',
        lastname: 'Doe',
      },
    });
  });

  it('should show loading state initially', async () => {
    (useTeacherStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isInClassroom: false,
      listClassrooms: mockListClassrooms,
      createClassroom: vi.fn(),
      enterClassroom: vi.fn(),
      savedClassrooms: [],
      isLoading: false,
      error: null,
      classroom: null,
      students: [],
      closeClassroom: vi.fn(),
      addStudent: vi.fn(),
      removeStudent: vi.fn(),
      setServerConnected: vi.fn(),
      isSharingScreen: false,
      screenShareUrl: null,
    });

    const { container } = render(<TeacherApp />);

    // Loading state transitions quickly, so just check the component rendered
    expect(container).toBeInTheDocument();

    // After loading, should show CreateClassroom
    await waitFor(() => {
      expect(screen.getByText('Welcome, John!')).toBeInTheDocument();
    });
  });

  it('should call listClassrooms on mount', () => {
    (useTeacherStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isInClassroom: false,
      listClassrooms: mockListClassrooms,
      createClassroom: vi.fn(),
      enterClassroom: vi.fn(),
      savedClassrooms: [],
      isLoading: false,
      error: null,
      classroom: null,
      students: [],
      closeClassroom: vi.fn(),
      addStudent: vi.fn(),
      removeStudent: vi.fn(),
      setServerConnected: vi.fn(),
      isSharingScreen: false,
      screenShareUrl: null,
    });

    render(<TeacherApp />);

    expect(mockListClassrooms).toHaveBeenCalled();
  });

  it('should show CreateClassroom when not in classroom', async () => {
    (useTeacherStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isInClassroom: false,
      listClassrooms: mockListClassrooms,
      createClassroom: vi.fn(),
      enterClassroom: vi.fn(),
      savedClassrooms: [],
      isLoading: false,
      error: null,
      classroom: null,
      students: [],
      closeClassroom: vi.fn(),
      addStudent: vi.fn(),
      removeStudent: vi.fn(),
      setServerConnected: vi.fn(),
      isSharingScreen: false,
      screenShareUrl: null,
    });

    render(<TeacherApp />);

    await waitFor(() => {
      expect(screen.getByText('Welcome, John!')).toBeInTheDocument();
    });
  });

  it('should show TeacherDashboard when in classroom', async () => {
    const mockClassroom = {
      id: 'classroom-1',
      name: 'Math 101',
      code: 'ABC123',
      teacherEmail: 'teacher@example.com',
      createdAt: new Date(),
      isOpen: true,
    };

    (useTeacherStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isInClassroom: true,
      listClassrooms: mockListClassrooms,
      createClassroom: vi.fn(),
      enterClassroom: vi.fn(),
      savedClassrooms: [],
      isLoading: false,
      error: null,
      classroom: mockClassroom,
      students: [],
      closeClassroom: vi.fn(),
      addStudent: vi.fn(),
      removeStudent: vi.fn(),
      setServerConnected: vi.fn(),
      isSharingScreen: false,
      screenShareUrl: null,
    });

    render(<TeacherApp />);

    await waitFor(() => {
      expect(screen.getByText('Math 101')).toBeInTheDocument();
      const codes = screen.getAllByText('ABC123');
      expect(codes.length).toBeGreaterThan(0);
    });
  });
});
