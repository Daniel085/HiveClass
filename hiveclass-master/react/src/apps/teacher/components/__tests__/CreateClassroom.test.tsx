import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateClassroom } from '../CreateClassroom';
import { useTeacherStore } from '@/store/teacherStore';
import { useAuthStore } from '@/store/authStore';

// Mock stores
vi.mock('@/store/teacherStore', () => ({
  useTeacherStore: vi.fn(),
}));

vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

describe('CreateClassroom', () => {
  const mockCreateClassroom = vi.fn();
  const mockEnterClassroom = vi.fn();
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

    (useTeacherStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      createClassroom: mockCreateClassroom,
      enterClassroom: mockEnterClassroom,
      listClassrooms: mockListClassrooms,
      savedClassrooms: [],
      isLoading: false,
      error: null,
    });
  });

  it('should render welcome message with user name', () => {
    render(<CreateClassroom />);
    expect(screen.getByText('Welcome, John!')).toBeInTheDocument();
  });

  it('should render new classroom mode by default', () => {
    render(<CreateClassroom />);
    expect(screen.getByText('New Classroom')).toBeInTheDocument();
    expect(screen.getByText('Existing Classroom')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Math 101, English Literature/i)).toBeInTheDocument();
  });

  it('should allow typing in classroom name input', async () => {
    const user = userEvent.setup();
    render(<CreateClassroom />);

    const input = screen.getByPlaceholderText(/Math 101, English Literature/i) as HTMLInputElement;
    await user.type(input, 'Science 101');

    expect(input.value).toBe('Science 101');
  });

  it('should call createClassroom on form submit with valid input', async () => {
    const user = userEvent.setup();
    const onEntered = vi.fn();

    mockCreateClassroom.mockResolvedValueOnce(undefined);

    render(<CreateClassroom onEntered={onEntered} />);

    const input = screen.getByPlaceholderText(/Math 101, English Literature/i);
    await user.type(input, 'Math 101');

    const submitButton = screen.getByRole('button', { name: /Create Classroom/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreateClassroom).toHaveBeenCalledWith('teacher@example.com', 'Math 101');
      expect(onEntered).toHaveBeenCalled();
    });
  });

  it('should not submit with empty classroom name', async () => {
    const user = userEvent.setup();
    render(<CreateClassroom />);

    const submitButton = screen.getByRole('button', { name: /Create Classroom/i });
    expect(submitButton).toBeDisabled();

    await user.click(submitButton);
    expect(mockCreateClassroom).not.toHaveBeenCalled();
  });

  it('should switch to existing classroom mode', async () => {
    const user = userEvent.setup();

    (useTeacherStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      createClassroom: mockCreateClassroom,
      enterClassroom: mockEnterClassroom,
      listClassrooms: mockListClassrooms,
      savedClassrooms: [
        {
          id: 'classroom-1',
          name: 'Math 101',
          code: 'ABC123',
          teacherEmail: 'teacher@example.com',
          createdAt: new Date('2024-01-01'),
          isOpen: true,
        },
      ],
      isLoading: false,
      error: null,
    });

    render(<CreateClassroom />);

    const existingButton = screen.getByRole('button', { name: 'Existing Classroom' });
    await user.click(existingButton);

    expect(screen.getByText('Select Classroom')).toBeInTheDocument();
    expect(screen.getByText('Math 101')).toBeInTheDocument();
    expect(screen.getByText(/Code: ABC123/i)).toBeInTheDocument();
  });

  it('should select and enter existing classroom', async () => {
    const user = userEvent.setup();
    const onEntered = vi.fn();

    mockEnterClassroom.mockResolvedValueOnce(undefined);

    (useTeacherStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      createClassroom: mockCreateClassroom,
      enterClassroom: mockEnterClassroom,
      listClassrooms: mockListClassrooms,
      savedClassrooms: [
        {
          id: 'classroom-1',
          name: 'Math 101',
          code: 'ABC123',
          teacherEmail: 'teacher@example.com',
          createdAt: new Date('2024-01-01'),
          isOpen: true,
        },
      ],
      isLoading: false,
      error: null,
    });

    render(<CreateClassroom onEntered={onEntered} />);

    // Switch to existing mode
    const existingButton = screen.getByRole('button', { name: 'Existing Classroom' });
    await user.click(existingButton);

    // Select classroom
    const classroomButton = screen.getByText('Math 101');
    await user.click(classroomButton);

    // Submit
    const submitButton = screen.getByRole('button', { name: /Enter Classroom/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockEnterClassroom).toHaveBeenCalledWith('classroom-1');
      expect(onEntered).toHaveBeenCalled();
    });
  });

  it('should disable existing classroom button when no saved classrooms', () => {
    render(<CreateClassroom />);

    const existingButton = screen.getByRole('button', { name: 'Existing Classroom' });
    expect(existingButton).toBeDisabled();
  });

  it('should show loading state', () => {
    (useTeacherStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      createClassroom: mockCreateClassroom,
      enterClassroom: mockEnterClassroom,
      listClassrooms: mockListClassrooms,
      savedClassrooms: [],
      isLoading: true,
      error: null,
    });

    render(<CreateClassroom />);

    const loadingElements = screen.getAllByText(/Creating.../i);
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('should show error message when error occurs', () => {
    (useTeacherStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      createClassroom: mockCreateClassroom,
      enterClassroom: mockEnterClassroom,
      listClassrooms: mockListClassrooms,
      savedClassrooms: [],
      isLoading: false,
      error: new Error('Failed to create classroom'),
    });

    render(<CreateClassroom />);

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Failed to create classroom')).toBeInTheDocument();
  });

  it('should call listClassrooms on mount', () => {
    render(<CreateClassroom />);
    expect(mockListClassrooms).toHaveBeenCalled();
  });

  it('should show info section about what happens next', () => {
    render(<CreateClassroom />);
    expect(screen.getByText('What happens next?')).toBeInTheDocument();
    expect(
      screen.getByText(/After creating or entering a classroom, you'll get an access code/i)
    ).toBeInTheDocument();
  });
});
