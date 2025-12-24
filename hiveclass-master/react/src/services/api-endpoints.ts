/**
 * HiveClass Backend API Endpoints
 *
 * These endpoints are available from the modernized backend servers (Phase 7).
 * All requests are proxied through the router server (localhost:8088).
 */

export const API_BASE = '/api';

/**
 * Authentication API (Port 8081)
 * Google OAuth-based authentication
 */
export const AUTH_API = {
  /** Google OAuth login/callback */
  GOOGLE_AUTH: `${API_BASE}/google`,

  /** Check if user is authenticated (returns 204 if yes, 402 if no) */
  CHECK_AUTH: `${API_BASE}/check`,

  /** Invalidate session and logout */
  LOGOUT: `${API_BASE}/invalidate`,

  /** Get current user profile */
  ME: `${API_BASE}/me`,
} as const;

/**
 * Whitelist API (Port 8081)
 * Domain whitelist management (requires bearer token)
 */
export const WHITELIST_API = {
  /** Get all clients */
  GET_CLIENTS: `${API_BASE}/whitelist`,

  /** Get specific client */
  GET_CLIENT: (clientName: string) => `${API_BASE}/whitelist/${clientName}`,

  /** Create new client */
  CREATE_CLIENT: (clientName: string) => `${API_BASE}/whitelist/${clientName}`,

  /** Add domains to client */
  ADD_DOMAINS: (clientName: string) => `${API_BASE}/whitelist/${clientName}/domains`,

  /** Set client active status */
  SET_ACTIVE: (clientName: string) => `${API_BASE}/whitelist/${clientName}/active`,
} as const;

/**
 * Classroom API (Apps Server - Port 8082)
 * Classroom CRUD operations for teachers and students
 */
export const CLASSROOM_API = {
  /** Create new classroom (Teacher) */
  CREATE: '/apps/api/classroom/create',

  /** Get classroom by ID */
  GET: (classroomId: string) => `/apps/api/classroom/${classroomId}`,

  /** List all teacher's classrooms (Teacher) */
  LIST_TEACHER: '/apps/api/classroom/teacher/list',

  /** Close classroom (Teacher) */
  CLOSE: (classroomId: string) => `/apps/api/classroom/${classroomId}/close`,

  /** Join classroom via access code (Student) */
  JOIN: '/apps/api/classroom/join',

  /** Join classroom from list (Student) */
  JOIN_BY_ID: (classroomId: string) => `/apps/api/classroom/${classroomId}/join`,

  /** List all open classrooms (Student) */
  LIST: '/apps/api/classroom/list',

  /** Exit classroom (Student) */
  EXIT: (classroomId: string) => `/apps/api/classroom/${classroomId}/exit`,
} as const;

/**
 * WebRTC Rendezvous API (Port 19090)
 * Classroom and WebRTC signaling management
 */
export const RENDEZVOUS_API = {
  /** WebSocket endpoint for WebRTC signaling */
  WEBSOCKET: 'ws://localhost:9090',

  /** HTTP API base (for REST calls if needed) */
  HTTP: 'http://localhost:19090',
} as const;

/**
 * User Profile Type
 */
export interface UserProfile {
  id: string;
  email: string;
  gender?: string;
  firstname: string;
  lastname: string;
  avatar?: string;
}

/**
 * OAuth Tokens Type
 */
export interface OAuthTokens {
  access: string;
  refresh: string;
  expires: number;
}
