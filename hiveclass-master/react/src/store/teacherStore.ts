/**
 * Teacher State Store (Zustand)
 *
 * Manages teacher classroom state, including classroom creation,
 * student management, and broadcasting.
 * Migrated from Montage.js ClassroomService (teacher side).
 */

import { create } from 'zustand';
import { CLASSROOM_API } from '@/services/api-endpoints';

export interface Student {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  connectedAt: Date;
  isHandRaised: boolean;
  isActive: boolean;
}

export interface Classroom {
  id: string;
  name: string;
  code: string;  // Access code for students
  teacherEmail: string;
  createdAt: Date;
  isOpen: boolean;
}

export interface TeacherState {
  /** Current classroom, if created/entered */
  classroom: Classroom | null;

  /** List of saved classrooms */
  savedClassrooms: Classroom[];

  /** Connected students */
  students: Student[];

  /** Whether in a classroom */
  isInClassroom: boolean;

  /** Whether creating/entering classroom */
  isLoading: boolean;

  /** Whether connected to WebRTC server */
  isServerConnected: boolean;

  /** Current error, if any */
  error: Error | null;

  /** Screen sharing state */
  isSharingScreen: boolean;
  screenShareUrl: string | null;

  /** Follow-me mode state */
  isFollowMeMode: boolean;

  /** Create new classroom */
  createClassroom: (teacherEmail: string, name: string) => Promise<void>;

  /** Enter existing classroom */
  enterClassroom: (classroomId: string) => Promise<void>;

  /** List saved classrooms */
  listClassrooms: () => Promise<void>;

  /** Close current classroom */
  closeClassroom: () => Promise<void>;

  /** Add student to classroom */
  addStudent: (student: Student) => void;

  /** Remove student from classroom */
  removeStudent: (studentId: string) => void;

  /** Update student status */
  updateStudent: (studentId: string, updates: Partial<Student>) => void;

  /** Broadcast message to all students */
  broadcastMessage: (message: string) => void;

  /** Send message to specific student */
  sendToStudent: (studentId: string, message: string) => void;

  /** Start screen sharing */
  startScreenShare: (url: string) => void;

  /** Stop screen sharing */
  stopScreenShare: () => void;

  /** Enable follow-me mode */
  enableFollowMe: () => void;

  /** Disable follow-me mode */
  disableFollowMe: () => void;

  /** Set server connection status */
  setServerConnected: (connected: boolean) => void;

  /** Clear error */
  clearError: () => void;
}

/**
 * Global teacher store
 *
 * @example
 * ```tsx
 * function CreateClassroom() {
 *   const { createClassroom, isLoading } = useTeacherStore();
 *
 *   const handleCreate = async () => {
 *     await createClassroom('teacher@example.com', 'Math 101');
 *   };
 *
 *   return <button onClick={handleCreate} disabled={isLoading}>Create</button>;
 * }
 * ```
 */
export const useTeacherStore = create<TeacherState>((set, get) => ({
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

  createClassroom: async (teacherEmail: string, name: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(CLASSROOM_API.CREATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ teacherEmail, name }),
      });

      if (!response.ok) {
        throw new Error('Failed to create classroom');
      }

      const classroom: Classroom = await response.json();

      set({
        classroom,
        isInClassroom: true,
        isLoading: false,
        students: [],
      });
    } catch (error) {
      set({
        error: error as Error,
        isLoading: false,
      });
      throw error;
    }
  },

  enterClassroom: async (classroomId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(CLASSROOM_API.GET(classroomId), {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to enter classroom');
      }

      const classroom: Classroom = await response.json();

      set({
        classroom,
        isInClassroom: true,
        isLoading: false,
        students: [],
      });
    } catch (error) {
      set({
        error: error as Error,
        isLoading: false,
      });
      throw error;
    }
  },

  listClassrooms: async () => {
    try {
      const response = await fetch(CLASSROOM_API.LIST_TEACHER, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to list classrooms');
      }

      const classrooms: Classroom[] = await response.json();

      set({
        savedClassrooms: classrooms,
        error: null,
      });
    } catch (error) {
      set({
        error: error as Error,
        savedClassrooms: [],
      });
    }
  },

  closeClassroom: async () => {
    try {
      const { classroom } = get();
      if (!classroom) return;

      await fetch(CLASSROOM_API.CLOSE(classroom.id), {
        method: 'POST',
        credentials: 'include',
      });

      set({
        classroom: null,
        isInClassroom: false,
        students: [],
        isServerConnected: false,
        isSharingScreen: false,
        screenShareUrl: null,
        isFollowMeMode: false,
      });
    } catch (error) {
      set({ error: error as Error });
    }
  },

  addStudent: (student: Student) => {
    set((state) => ({
      students: [...state.students, student],
    }));
  },

  removeStudent: (studentId: string) => {
    set((state) => ({
      students: state.students.filter((s) => s.id !== studentId),
    }));
  },

  updateStudent: (studentId: string, updates: Partial<Student>) => {
    set((state) => ({
      students: state.students.map((s) =>
        s.id === studentId ? { ...s, ...updates } : s
      ),
    }));
  },

  broadcastMessage: (message: string) => {
    // This will be called by components, actual WebRTC send happens in useWebRTCServer
    console.log('Broadcasting message to all students:', message);
  },

  sendToStudent: (studentId: string, message: string) => {
    // This will be called by components, actual WebRTC send happens in useWebRTCServer
    console.log(`Sending message to student ${studentId}:`, message);
  },

  startScreenShare: (url: string) => {
    set({
      isSharingScreen: true,
      screenShareUrl: url,
    });
  },

  stopScreenShare: () => {
    set({
      isSharingScreen: false,
      screenShareUrl: null,
    });
  },

  enableFollowMe: () => {
    set({ isFollowMeMode: true });
  },

  disableFollowMe: () => {
    set({ isFollowMeMode: false });
  },

  setServerConnected: (connected: boolean) => {
    set({ isServerConnected: connected });
  },

  clearError: () => {
    set({ error: null });
  },
}));
