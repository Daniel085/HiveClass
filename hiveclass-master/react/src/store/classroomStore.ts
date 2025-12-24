/**
 * Classroom State Store (Zustand)
 *
 * Manages student classroom state, including joining, connection, and WebRTC.
 * Migrated from Montage.js ClassroomService.
 */

import { create } from 'zustand';
import { CLASSROOM_API } from '@/services/api-endpoints';

export interface Classroom {
  id: string;
  name: string;
  teacherName: string;
  accessCode?: string;
  isOpen: boolean;
  studentCount?: number;
}

export interface ClassroomState {
  /** Current classroom, if joined */
  classroom: Classroom | null;

  /** List of available/open classrooms */
  openClassrooms: Classroom[];

  /** Whether currently in a classroom */
  isInClassroom: boolean;

  /** Whether join/connection is in progress */
  isJoining: boolean;

  /** Whether connected to teacher via WebRTC */
  isConnectedToTeacher: boolean;

  /** Current error, if any */
  error: Error | null;

  /** Teacher's video stream (from WebRTC) */
  teacherStream: MediaStream | null;

  /** Follow-me mode (teacher screen sharing) */
  isFollowMeMode: boolean;
  followMeUrl: string | null;

  /** Join classroom with access code */
  joinWithAccessCode: (accessCode: string) => Promise<void>;

  /** Join classroom by ID (from list) */
  joinWithId: (classroomId: string) => Promise<void>;

  /** List open classrooms */
  listOpenClassrooms: () => Promise<void>;

  /** Exit current classroom */
  exitClassroom: () => Promise<void>;

  /** Set teacher stream (called by WebRTC hook) */
  setTeacherStream: (stream: MediaStream | null) => void;

  /** Set follow-me mode */
  setFollowMeMode: (enabled: boolean, url?: string) => void;

  /** Set WebRTC connection status */
  setConnectedToTeacher: (connected: boolean) => void;

  /** Clear error */
  clearError: () => void;
}

/**
 * Global classroom store for student app
 *
 * @example
 * ```tsx
 * function JoinClass() {
 *   const { joinWithAccessCode, isJoining, error } = useClassroomStore();
 *
 *   const handleJoin = async () => {
 *     await joinWithAccessCode('ABC123');
 *   };
 *
 *   return <button onClick={handleJoin} disabled={isJoining}>Join</button>;
 * }
 * ```
 */
export const useClassroomStore = create<ClassroomState>((set, get) => ({
  classroom: null,
  openClassrooms: [],
  isInClassroom: false,
  isJoining: false,
  isConnectedToTeacher: false,
  error: null,
  teacherStream: null,
  isFollowMeMode: false,
  followMeUrl: null,

  joinWithAccessCode: async (accessCode: string) => {
    set({ isJoining: true, error: null });
    try {
      const response = await fetch(CLASSROOM_API.JOIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: accessCode }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to join classroom');
      }

      const classroom: Classroom = await response.json();

      set({
        classroom,
        isInClassroom: true,
        isJoining: false,
      });
    } catch (error) {
      set({
        error: error as Error,
        isJoining: false,
      });
      throw error;
    }
  },

  joinWithId: async (classroomId: string) => {
    set({ isJoining: true, error: null });
    try {
      const response = await fetch(CLASSROOM_API.JOIN_BY_ID(classroomId), {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to join classroom');
      }

      const classroom: Classroom = await response.json();

      set({
        classroom,
        isInClassroom: true,
        isJoining: false,
      });
    } catch (error) {
      set({
        error: error as Error,
        isJoining: false,
      });
      throw error;
    }
  },

  listOpenClassrooms: async () => {
    try {
      const response = await fetch(CLASSROOM_API.LIST, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to list classrooms');
      }

      const classrooms: Classroom[] = await response.json();

      set({
        openClassrooms: classrooms,
        error: null,
      });
    } catch (error) {
      set({
        error: error as Error,
        openClassrooms: [],
      });
    }
  },

  exitClassroom: async () => {
    try {
      const { classroom } = get();
      if (!classroom) return;

      await fetch(CLASSROOM_API.EXIT(classroom.id), {
        method: 'POST',
        credentials: 'include',
      });

      set({
        classroom: null,
        isInClassroom: false,
        isConnectedToTeacher: false,
        teacherStream: null,
        isFollowMeMode: false,
        followMeUrl: null,
      });
    } catch (error) {
      set({ error: error as Error });
    }
  },

  setTeacherStream: (stream: MediaStream | null) => {
    set({ teacherStream: stream });
  },

  setFollowMeMode: (enabled: boolean, url?: string) => {
    set({
      isFollowMeMode: enabled,
      followMeUrl: enabled ? url || null : null,
    });
  },

  setConnectedToTeacher: (connected: boolean) => {
    set({ isConnectedToTeacher: connected });
  },

  clearError: () => {
    set({ error: null });
  },
}));
