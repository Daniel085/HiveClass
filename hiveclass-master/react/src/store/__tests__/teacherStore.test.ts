import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTeacherStore } from '../teacherStore';
import type { Classroom, Student } from '../teacherStore';

// Mock fetch
globalThis.fetch = vi.fn();

describe('teacherStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useTeacherStore.setState({
      classroom: null,
      savedClassrooms: [],
      students: [],
      isInClassroom: false,
      isLoading: false,
      isServerConnected: false,
      error: null,
      isSharingScreen: false,
      screenShareUrl: null,
      isFollowMeMode: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should have initial state', () => {
    const { result } = renderHook(() => useTeacherStore());

    expect(result.current.classroom).toBeNull();
    expect(result.current.savedClassrooms).toEqual([]);
    expect(result.current.students).toEqual([]);
    expect(result.current.isInClassroom).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isServerConnected).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isSharingScreen).toBe(false);
    expect(result.current.screenShareUrl).toBeNull();
    expect(result.current.isFollowMeMode).toBe(false);
  });

  describe('createClassroom', () => {
    it('should create classroom successfully', async () => {
      const mockClassroom: Classroom = {
        id: 'classroom-1',
        name: 'Math 101',
        code: 'ABC123',
        teacherEmail: 'teacher@example.com',
        createdAt: new Date(),
        isOpen: true,
      };

      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockClassroom,
      } as Response);

      const { result } = renderHook(() => useTeacherStore());

      await act(async () => {
        await result.current.createClassroom('teacher@example.com', 'Math 101');
      });

      await waitFor(() => {
        expect(result.current.classroom).toEqual(mockClassroom);
        expect(result.current.isInClassroom).toBe(true);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.students).toEqual([]);
        expect(result.current.error).toBeNull();
      });

      expect(globalThis.fetch).toHaveBeenCalledWith('/api/classroom/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ teacherEmail: 'teacher@example.com', name: 'Math 101' }),
      });
    });

    it('should handle createClassroom error', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: false,
      } as Response);

      const { result } = renderHook(() => useTeacherStore());

      await expect(
        act(async () => {
          await result.current.createClassroom('teacher@example.com', 'Math 101');
        })
      ).rejects.toThrow('Failed to create classroom');

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeTruthy();
      });
    });
  });

  describe('enterClassroom', () => {
    it('should enter classroom successfully', async () => {
      const mockClassroom: Classroom = {
        id: 'classroom-1',
        name: 'Math 101',
        code: 'ABC123',
        teacherEmail: 'teacher@example.com',
        createdAt: new Date(),
        isOpen: true,
      };

      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockClassroom,
      } as Response);

      const { result } = renderHook(() => useTeacherStore());

      await act(async () => {
        await result.current.enterClassroom('classroom-1');
      });

      await waitFor(() => {
        expect(result.current.classroom).toEqual(mockClassroom);
        expect(result.current.isInClassroom).toBe(true);
        expect(result.current.isLoading).toBe(false);
      });

      expect(globalThis.fetch).toHaveBeenCalledWith('/api/classroom/classroom-1', {
        method: 'GET',
        credentials: 'include',
      });
    });

    it('should handle enterClassroom error', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: false,
      } as Response);

      const { result } = renderHook(() => useTeacherStore());

      await expect(
        act(async () => {
          await result.current.enterClassroom('classroom-1');
        })
      ).rejects.toThrow('Failed to enter classroom');

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeTruthy();
      });
    });
  });

  describe('listClassrooms', () => {
    it('should list classrooms successfully', async () => {
      const mockClassrooms: Classroom[] = [
        {
          id: 'classroom-1',
          name: 'Math 101',
          code: 'ABC123',
          teacherEmail: 'teacher@example.com',
          createdAt: new Date(),
          isOpen: true,
        },
        {
          id: 'classroom-2',
          name: 'Science 201',
          code: 'DEF456',
          teacherEmail: 'teacher@example.com',
          createdAt: new Date(),
          isOpen: false,
        },
      ];

      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockClassrooms,
      } as Response);

      const { result } = renderHook(() => useTeacherStore());

      await act(async () => {
        await result.current.listClassrooms();
      });

      await waitFor(() => {
        expect(result.current.savedClassrooms).toEqual(mockClassrooms);
        expect(result.current.error).toBeNull();
      });

      expect(globalThis.fetch).toHaveBeenCalledWith('/api/classroom/teacher/list', {
        method: 'GET',
        credentials: 'include',
      });
    });

    it('should handle listClassrooms error', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: false,
      } as Response);

      const { result } = renderHook(() => useTeacherStore());

      await act(async () => {
        await result.current.listClassrooms();
      });

      await waitFor(() => {
        expect(result.current.savedClassrooms).toEqual([]);
        expect(result.current.error).toBeTruthy();
      });
    });
  });

  describe('closeClassroom', () => {
    it('should close classroom and reset state', async () => {
      const mockClassroom: Classroom = {
        id: 'classroom-1',
        name: 'Math 101',
        code: 'ABC123',
        teacherEmail: 'teacher@example.com',
        createdAt: new Date(),
        isOpen: true,
      };

      // Set initial state
      useTeacherStore.setState({
        classroom: mockClassroom,
        isInClassroom: true,
        students: [
          {
            id: 'student-1',
            name: 'Student One',
            email: 'student1@example.com',
            connectedAt: new Date(),
            isHandRaised: false,
            isActive: true,
          },
        ],
        isServerConnected: true,
        isSharingScreen: true,
        screenShareUrl: 'http://example.com/screen',
        isFollowMeMode: true,
      });

      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
      } as Response);

      const { result } = renderHook(() => useTeacherStore());

      await act(async () => {
        await result.current.closeClassroom();
      });

      await waitFor(() => {
        expect(result.current.classroom).toBeNull();
        expect(result.current.isInClassroom).toBe(false);
        expect(result.current.students).toEqual([]);
        expect(result.current.isServerConnected).toBe(false);
        expect(result.current.isSharingScreen).toBe(false);
        expect(result.current.screenShareUrl).toBeNull();
        expect(result.current.isFollowMeMode).toBe(false);
      });

      expect(globalThis.fetch).toHaveBeenCalledWith('/api/classroom/classroom-1/close', {
        method: 'POST',
        credentials: 'include',
      });
    });

    it('should do nothing if no classroom is active', async () => {
      const { result } = renderHook(() => useTeacherStore());

      await act(async () => {
        await result.current.closeClassroom();
      });

      expect(globalThis.fetch).not.toHaveBeenCalled();
    });
  });

  describe('student management', () => {
    it('should add student', () => {
      const { result } = renderHook(() => useTeacherStore());

      const newStudent: Student = {
        id: 'student-1',
        name: 'Student One',
        email: 'student1@example.com',
        connectedAt: new Date(),
        isHandRaised: false,
        isActive: true,
      };

      act(() => {
        result.current.addStudent(newStudent);
      });

      expect(result.current.students).toHaveLength(1);
      expect(result.current.students[0]).toEqual(newStudent);
    });

    it('should remove student', () => {
      const student1: Student = {
        id: 'student-1',
        name: 'Student One',
        email: 'student1@example.com',
        connectedAt: new Date(),
        isHandRaised: false,
        isActive: true,
      };

      const student2: Student = {
        id: 'student-2',
        name: 'Student Two',
        email: 'student2@example.com',
        connectedAt: new Date(),
        isHandRaised: false,
        isActive: true,
      };

      useTeacherStore.setState({
        students: [student1, student2],
      });

      const { result } = renderHook(() => useTeacherStore());

      act(() => {
        result.current.removeStudent('student-1');
      });

      expect(result.current.students).toHaveLength(1);
      expect(result.current.students[0].id).toBe('student-2');
    });

    it('should update student', () => {
      const student: Student = {
        id: 'student-1',
        name: 'Student One',
        email: 'student1@example.com',
        connectedAt: new Date(),
        isHandRaised: false,
        isActive: true,
      };

      useTeacherStore.setState({
        students: [student],
      });

      const { result } = renderHook(() => useTeacherStore());

      act(() => {
        result.current.updateStudent('student-1', { isHandRaised: true });
      });

      expect(result.current.students[0].isHandRaised).toBe(true);
      expect(result.current.students[0].name).toBe('Student One');
    });
  });

  describe('screen sharing', () => {
    it('should start screen share', () => {
      const { result } = renderHook(() => useTeacherStore());

      act(() => {
        result.current.startScreenShare('http://example.com/screen');
      });

      expect(result.current.isSharingScreen).toBe(true);
      expect(result.current.screenShareUrl).toBe('http://example.com/screen');
    });

    it('should stop screen share', () => {
      useTeacherStore.setState({
        isSharingScreen: true,
        screenShareUrl: 'http://example.com/screen',
      });

      const { result } = renderHook(() => useTeacherStore());

      act(() => {
        result.current.stopScreenShare();
      });

      expect(result.current.isSharingScreen).toBe(false);
      expect(result.current.screenShareUrl).toBeNull();
    });
  });

  describe('follow-me mode', () => {
    it('should enable follow-me mode', () => {
      const { result } = renderHook(() => useTeacherStore());

      act(() => {
        result.current.enableFollowMe();
      });

      expect(result.current.isFollowMeMode).toBe(true);
    });

    it('should disable follow-me mode', () => {
      useTeacherStore.setState({
        isFollowMeMode: true,
      });

      const { result } = renderHook(() => useTeacherStore());

      act(() => {
        result.current.disableFollowMe();
      });

      expect(result.current.isFollowMeMode).toBe(false);
    });
  });

  describe('server connection', () => {
    it('should set server connected', () => {
      const { result } = renderHook(() => useTeacherStore());

      act(() => {
        result.current.setServerConnected(true);
      });

      expect(result.current.isServerConnected).toBe(true);
    });

    it('should set server disconnected', () => {
      useTeacherStore.setState({
        isServerConnected: true,
      });

      const { result } = renderHook(() => useTeacherStore());

      act(() => {
        result.current.setServerConnected(false);
      });

      expect(result.current.isServerConnected).toBe(false);
    });
  });

  it('should clear error', () => {
    const testError = new Error('Test error');
    useTeacherStore.setState({ error: testError });

    const { result } = renderHook(() => useTeacherStore());

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});
