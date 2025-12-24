import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TeacherDashboard } from '../TeacherDashboard';
import { useTeacherStore } from '@/store/teacherStore';
import { useWebRTCServer } from '@/hooks/useWebRTCServer';
import type { Classroom, Student } from '@/store/teacherStore';

// Mock stores and hooks
vi.mock('@/store/teacherStore', () => ({
  useTeacherStore: vi.fn(),
}));

vi.mock('@/hooks/useWebRTCServer', () => ({
  useWebRTCServer: vi.fn(),
}));

describe('TeacherDashboard', () => {
  const mockCloseClassroom = vi.fn();
  const mockAddStudent = vi.fn();
  const mockRemoveStudent = vi.fn();
  const mockSetServerConnected = vi.fn();

  const mockClassroom: Classroom = {
    id: 'classroom-1',
    name: 'Math 101',
    code: 'ABC123',
    teacherEmail: 'teacher@example.com',
    createdAt: new Date('2024-01-01'),
    isOpen: true,
  };

  const mockStudent: Student = {
    id: 'student-1',
    name: 'Student One',
    email: 'student1@example.com',
    connectedAt: new Date('2024-01-01T10:00:00Z'),
    isHandRaised: false,
    isActive: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    (useTeacherStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      classroom: mockClassroom,
      students: [],
      closeClassroom: mockCloseClassroom,
      addStudent: mockAddStudent,
      removeStudent: mockRemoveStudent,
      setServerConnected: mockSetServerConnected,
      isSharingScreen: false,
      screenShareUrl: null,
    });

    (useWebRTCServer as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      connected: true,
      error: null,
      server: {},
      peers: new Map(),
    });
  });

  it('should render classroom name and code', () => {
    render(<TeacherDashboard />);

    expect(screen.getByText('Math 101')).toBeInTheDocument();
    const codes = screen.getAllByText('ABC123');
    expect(codes.length).toBeGreaterThan(0);
  });

  it('should render server connection status', () => {
    render(<TeacherDashboard />);

    expect(screen.getByText('Server Connected')).toBeInTheDocument();
  });

  it('should render disconnected status when server is not connected', () => {
    (useWebRTCServer as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      connected: false,
      error: null,
      server: {},
      peers: new Map(),
    });

    render(<TeacherDashboard />);

    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  it('should render close classroom button', () => {
    render(<TeacherDashboard />);

    const closeButton = screen.getByRole('button', { name: /Close Classroom/i });
    expect(closeButton).toBeInTheDocument();
  });

  it('should show empty state when no students connected', () => {
    render(<TeacherDashboard />);

    expect(screen.getByText('Waiting for students...')).toBeInTheDocument();
    expect(screen.getByText(/Share the access code/i)).toBeInTheDocument();
  });

  it('should render student count', () => {
    (useTeacherStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      classroom: mockClassroom,
      students: [mockStudent],
      closeClassroom: mockCloseClassroom,
      addStudent: mockAddStudent,
      removeStudent: mockRemoveStudent,
      setServerConnected: mockSetServerConnected,
      isSharingScreen: false,
      screenShareUrl: null,
    });

    render(<TeacherDashboard />);

    expect(screen.getByText('Connected Students (1)')).toBeInTheDocument();
  });

  it('should render student cards', () => {
    (useTeacherStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      classroom: mockClassroom,
      students: [mockStudent],
      closeClassroom: mockCloseClassroom,
      addStudent: mockAddStudent,
      removeStudent: mockRemoveStudent,
      setServerConnected: mockSetServerConnected,
      isSharingScreen: false,
      screenShareUrl: null,
    });

    render(<TeacherDashboard />);

    expect(screen.getByText('Student One')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should render hand raised indicator', () => {
    const studentWithHandRaised: Student = {
      ...mockStudent,
      isHandRaised: true,
    };

    (useTeacherStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      classroom: mockClassroom,
      students: [studentWithHandRaised],
      closeClassroom: mockCloseClassroom,
      addStudent: mockAddStudent,
      removeStudent: mockRemoveStudent,
      setServerConnected: mockSetServerConnected,
      isSharingScreen: false,
      screenShareUrl: null,
    });

    render(<TeacherDashboard />);

    const handIcon = screen.getByTitle('Hand raised');
    expect(handIcon).toBeInTheDocument();
  });

  it('should show close confirmation modal when close button clicked', async () => {
    const user = userEvent.setup();
    render(<TeacherDashboard />);

    const closeButton = screen.getByRole('button', { name: /Close Classroom/i });
    await user.click(closeButton);

    expect(screen.getByText('Close Classroom?')).toBeInTheDocument();
    expect(screen.getByText(/This will disconnect all/i)).toBeInTheDocument();
  });

  it('should close classroom when confirmed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    mockCloseClassroom.mockResolvedValueOnce(undefined);

    render(<TeacherDashboard onClose={onClose} />);

    // Open modal
    const buttons = screen.getAllByRole('button', { name: /Close Classroom/i });
    await user.click(buttons[0]);

    // Confirm close - get all buttons again and click the one in the modal
    const confirmButtons = screen.getAllByRole('button', { name: /Close Classroom/i });
    await user.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => {
      expect(mockCloseClassroom).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('should cancel close classroom', async () => {
    const user = userEvent.setup();
    render(<TeacherDashboard />);

    // Open modal
    const closeButton = screen.getByRole('button', { name: /Close Classroom/i });
    await user.click(closeButton);

    // Cancel
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Close Classroom?')).not.toBeInTheDocument();
    });

    expect(mockCloseClassroom).not.toHaveBeenCalled();
  });

  it('should copy access code to clipboard', async () => {
    const user = userEvent.setup();

    // Mock clipboard API
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: writeTextMock,
      },
      writable: true,
      configurable: true,
    });

    render(<TeacherDashboard />);

    const copyButton = screen.getByRole('button', { name: /Copy/i });
    await user.click(copyButton);

    expect(writeTextMock).toHaveBeenCalledWith('ABC123');

    await waitFor(() => {
      expect(screen.getByText('✓ Copied!')).toBeInTheDocument();
    });
  });

  it('should show screen sharing status when active', () => {
    (useTeacherStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      classroom: mockClassroom,
      students: [mockStudent],
      closeClassroom: mockCloseClassroom,
      addStudent: mockAddStudent,
      removeStudent: mockRemoveStudent,
      setServerConnected: mockSetServerConnected,
      isSharingScreen: true,
      screenShareUrl: 'http://example.com/screen',
    });

    render(<TeacherDashboard />);

    expect(screen.getByText('Screen Sharing Active')).toBeInTheDocument();
    expect(screen.getByText('Broadcasting to 1 student')).toBeInTheDocument();
  });

  it('should show WebRTC error when present', () => {
    (useWebRTCServer as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      connected: false,
      error: new Error('Connection failed'),
      server: {},
      peers: new Map(),
    });

    render(<TeacherDashboard />);

    expect(screen.getByText('Server Error')).toBeInTheDocument();
    expect(screen.getByText('Connection failed')).toBeInTheDocument();
  });

  it('should render no classroom active when classroom is null', () => {
    (useTeacherStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      classroom: null,
      students: [],
      closeClassroom: mockCloseClassroom,
      addStudent: mockAddStudent,
      removeStudent: mockRemoveStudent,
      setServerConnected: mockSetServerConnected,
      isSharingScreen: false,
      screenShareUrl: null,
    });

    render(<TeacherDashboard />);

    expect(screen.getByText('No classroom active')).toBeInTheDocument();
  });

  it('should render multiple students', () => {
    const students: Student[] = [
      {
        id: 'student-1',
        name: 'Student One',
        email: 'student1@example.com',
        connectedAt: new Date('2024-01-01T10:00:00Z'),
        isHandRaised: false,
        isActive: true,
      },
      {
        id: 'student-2',
        name: 'Student Two',
        email: 'student2@example.com',
        connectedAt: new Date('2024-01-01T10:05:00Z'),
        isHandRaised: true,
        isActive: true,
      },
      {
        id: 'student-3',
        name: 'Student Three',
        email: 'student3@example.com',
        connectedAt: new Date('2024-01-01T10:10:00Z'),
        isHandRaised: false,
        isActive: false,
      },
    ];

    (useTeacherStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      classroom: mockClassroom,
      students,
      closeClassroom: mockCloseClassroom,
      addStudent: mockAddStudent,
      removeStudent: mockRemoveStudent,
      setServerConnected: mockSetServerConnected,
      isSharingScreen: false,
      screenShareUrl: null,
    });

    render(<TeacherDashboard />);

    expect(screen.getByText('Connected Students (3)')).toBeInTheDocument();
    expect(screen.getByText('Student One')).toBeInTheDocument();
    expect(screen.getByText('Student Two')).toBeInTheDocument();
    expect(screen.getByText('Student Three')).toBeInTheDocument();
  });
});
