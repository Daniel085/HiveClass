# Phase 10: React Migration Implementation Plan

**Project**: HiveClass Frontend Modernization - Montage.js → React
**Duration**: 24-30 weeks (6-7.5 months)
**Priority**: High (technical debt resolution)
**Dependencies**: Phases 5 & 7 complete ✅
**Status**: Planning

---

## Executive Summary

This plan details the migration from Montage.js (2012-2015, abandoned) to React (2025, actively maintained). The migration will be **incremental**, allowing the application to remain functional throughout the process.

**Key Strategy**: Build new React app alongside Montage, migrate page-by-page, remove Montage when complete.

---

## Why React? (Decision Matrix)

| Factor | React | Vue 3 | Svelte | Weight | Winner |
|--------|-------|-------|--------|--------|--------|
| **Ecosystem Size** | ⭐⭐⭐⭐⭐ (Huge) | ⭐⭐⭐⭐ (Large) | ⭐⭐⭐ (Growing) | 25% | React |
| **WebRTC Libraries** | ⭐⭐⭐⭐⭐ (Excellent) | ⭐⭐⭐ (Good) | ⭐⭐ (Limited) | 20% | React |
| **State Management** | ⭐⭐⭐⭐⭐ (Redux, Zustand, etc.) | ⭐⭐⭐⭐ (Pinia) | ⭐⭐⭐ (Stores) | 15% | React |
| **Real-time Updates** | ⭐⭐⭐⭐⭐ (Concurrent Mode) | ⭐⭐⭐⭐ (Reactivity) | ⭐⭐⭐⭐⭐ (Compiled) | 15% | React/Svelte |
| **Developer Hiring** | ⭐⭐⭐⭐⭐ (Millions) | ⭐⭐⭐⭐ (Growing) | ⭐⭐⭐ (Smaller) | 15% | React |
| **Learning Curve** | ⭐⭐⭐ (Moderate) | ⭐⭐⭐⭐ (Easier) | ⭐⭐⭐⭐⭐ (Easiest) | 5% | Svelte |
| **TypeScript Support** | ⭐⭐⭐⭐⭐ (Excellent) | ⭐⭐⭐⭐⭐ (Excellent) | ⭐⭐⭐⭐ (Good) | 5% | React/Vue |

**Total Score**: React wins for HiveClass use case (complex state, real-time, WebRTC-heavy)

---

## Migration Architecture

### Hybrid Coexistence Strategy

```
/hiveclass-master/
├── legacy/                  # Existing Montage apps (Phase 0-6 months)
│   ├── login/              # Montage login app
│   ├── student/            # Montage student app
│   ├── teacher/            # Montage teacher app
│   └── ...
├── react/                   # New React app (Phase 1+)
│   ├── src/
│   │   ├── apps/
│   │   │   ├── login/      # React login (replaces legacy/login)
│   │   │   ├── student/    # React student (replaces legacy/student)
│   │   │   └── teacher/    # React teacher (replaces legacy/teacher)
│   │   ├── components/     # Shared React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # Business logic (WebRTC, API)
│   │   ├── store/          # State management (Zustand)
│   │   └── utils/          # Utilities
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts      # Vite build tool
│   └── tsconfig.json       # TypeScript config
└── scripts/
    └── migrate.sh          # Migration automation
```

---

## Technology Stack

### Core Framework
- **React 18.3+**: UI framework with Concurrent Mode
- **TypeScript 5.3+**: Type safety and developer experience
- **Vite 5.0+**: Fast build tool and dev server

### State Management
- **Zustand**: Lightweight state management (simpler than Redux)
  - Global state for classroom, students, teacher
  - Persisted state for user preferences

### Routing
- **React Router 6.20+**: Client-side routing
  - `/login` → Login app
  - `/student` → Student app
  - `/teacher` → Teacher app

### UI Components
- **Tailwind CSS 3.4+**: Utility-first CSS framework
- **Headless UI**: Accessible component primitives
- **React Icons**: Icon library

### WebRTC Integration
- **Native Integration**: Use existing modernized WebRTC code (already done ✅)
- **Custom Hooks**: Wrap WebRTC logic in React hooks
  - `useWebRTCClient()` - Student-side
  - `useWebRTCServer()` - Teacher-side

### Testing
- **Vitest**: Unit testing (Vite-native, Jest-compatible)
- **React Testing Library**: Component testing
- **Playwright**: E2E testing (cross-browser)

### Developer Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Husky**: Git hooks for pre-commit checks

---

## Phase-by-Phase Implementation

### PHASE 10.0: Setup & Infrastructure (Weeks 1-3)

**Objective**: Set up React development environment with zero impact on existing Montage app

#### Week 1: Project Setup

**Tasks**:
1. Create React project structure
   ```bash
   cd /Users/danielororke/GitHub/HiveClass/hiveclass-master
   npm create vite@latest react -- --template react-ts
   cd react
   npm install
   ```

2. Install dependencies
   ```bash
   npm install react-router-dom zustand
   npm install tailwindcss postcss autoprefixer
   npm install -D @types/node vitest @testing-library/react @testing-library/jest-dom
   npm install -D eslint prettier husky
   ```

3. Configure TypeScript
   - Strict mode enabled
   - Path aliases (`@/components`, `@/services`, etc.)

4. Configure Tailwind CSS
   ```bash
   npx tailwindcss init -p
   ```

5. Set up ESLint + Prettier
   - React-specific rules
   - Auto-format on save

**Deliverables**:
- ✅ React project initialized
- ✅ TypeScript configured
- ✅ Tailwind CSS configured
- ✅ Development server running on port 5173

**Files Created**:
- `react/package.json`
- `react/vite.config.ts`
- `react/tsconfig.json`
- `react/tailwind.config.js`
- `react/.eslintrc.js`
- `react/.prettierrc`

---

#### Week 2: Routing & Layout

**Tasks**:
1. Set up React Router
   ```tsx
   // src/App.tsx
   import { BrowserRouter, Routes, Route } from 'react-router-dom';

   function App() {
     return (
       <BrowserRouter>
         <Routes>
           <Route path="/login" element={<LoginApp />} />
           <Route path="/student" element={<StudentApp />} />
           <Route path="/teacher" element={<TeacherApp />} />
         </Routes>
       </BrowserRouter>
     );
   }
   ```

2. Create app shells (empty components)
   - `src/apps/login/LoginApp.tsx`
   - `src/apps/student/StudentApp.tsx`
   - `src/apps/teacher/TeacherApp.tsx`

3. Create shared layout components
   - `src/components/Layout/Header.tsx`
   - `src/components/Layout/Footer.tsx`
   - `src/components/Layout/Sidebar.tsx`

**Deliverables**:
- ✅ Routing working for all 3 apps
- ✅ Basic layout components
- ✅ Navigation between apps

---

#### Week 3: WebRTC Integration (Hooks)

**Objective**: Wrap existing modernized WebRTC code in React hooks

**Tasks**:
1. Copy modernized WebRTC files
   ```bash
   cp -r ../student/webrtc react/src/services/webrtc-client
   cp -r ../teacher/webrtc react/src/services/webrtc-server
   ```

2. Create custom React hooks
   ```tsx
   // src/hooks/useWebRTCClient.ts
   import { useState, useEffect, useCallback } from 'react';
   import { RTCClient } from '@/services/webrtc-client/client';

   export function useWebRTCClient(rendezvousEndpoint: string) {
     const [client, setClient] = useState<RTCClient | null>(null);
     const [connected, setConnected] = useState(false);
     const [error, setError] = useState<Error | null>(null);

     useEffect(() => {
       const rtcClient = new RTCClient(rendezvousEndpoint, {
         onopen: () => setConnected(true),
         onerror: (err) => setError(err)
       });

       rtcClient.start();
       setClient(rtcClient);

       return () => {
         rtcClient.stop();
       };
     }, [rendezvousEndpoint]);

     const sendMessage = useCallback((message: string) => {
       client?.send(message);
     }, [client]);

     return { client, connected, error, sendMessage };
   }
   ```

3. Create teacher-side hook
   ```tsx
   // src/hooks/useWebRTCServer.ts
   export function useWebRTCServer(rendezvousEndpoint: string) {
     // Similar to client hook but for multi-peer management
   }
   ```

**Deliverables**:
- ✅ `useWebRTCClient()` hook working
- ✅ `useWebRTCServer()` hook working
- ✅ Unit tests for hooks

**Files Created**:
- `react/src/hooks/useWebRTCClient.ts`
- `react/src/hooks/useWebRTCServer.ts`
- `react/src/hooks/__tests__/useWebRTCClient.test.tsx`

---

### PHASE 10.1: Login App Migration (Weeks 4-6)

**Objective**: Migrate login page from Montage to React (simplest page, proof of concept)

#### Week 4: UI Components

**Tasks**:
1. Analyze existing Montage login UI
   ```bash
   ls -la legacy/login/ui/
   # Understand component structure
   ```

2. Create React components
   - `LoginForm.tsx` - Email/password form
   - `GoogleOAuthButton.tsx` - Google OAuth integration
   - `LoadingSpinner.tsx` - Loading state

3. Style with Tailwind
   ```tsx
   // src/apps/login/components/LoginForm.tsx
   export function LoginForm() {
     return (
       <form className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
         <h1 className="text-2xl font-bold mb-4">HiveClass Login</h1>
         <input
           type="email"
           placeholder="Email"
           className="w-full px-4 py-2 border rounded-md mb-4"
         />
         <button
           type="submit"
           className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
         >
           Sign In
         </button>
       </form>
     );
   }
   ```

**Deliverables**:
- ✅ Login form UI complete
- ✅ Google OAuth button
- ✅ Responsive design (mobile + desktop)

---

#### Week 5: Authentication Logic

**Tasks**:
1. Create auth service
   ```tsx
   // src/services/auth.ts
   export class AuthService {
     async login(email: string, password: string) {
       // Call existing auth server (already modernized ✅)
       const response = await fetch('http://localhost:8081/api/login', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ email, password })
       });
       return response.json();
     }

     async loginWithGoogle(token: string) {
       // Google OAuth flow
     }
   }
   ```

2. Create auth state management
   ```tsx
   // src/store/authStore.ts
   import { create } from 'zustand';
   import { persist } from 'zustand/middleware';

   interface AuthState {
     user: User | null;
     isAuthenticated: boolean;
     login: (email: string, password: string) => Promise<void>;
     logout: () => void;
   }

   export const useAuthStore = create<AuthState>()(
     persist(
       (set) => ({
         user: null,
         isAuthenticated: false,
         login: async (email, password) => {
           const user = await authService.login(email, password);
           set({ user, isAuthenticated: true });
         },
         logout: () => set({ user: null, isAuthenticated: false })
       }),
       { name: 'auth-storage' }
     )
   );
   ```

3. Connect UI to state
   ```tsx
   // src/apps/login/LoginApp.tsx
   import { useAuthStore } from '@/store/authStore';

   export function LoginApp() {
     const { login, isAuthenticated } = useAuthStore();

     if (isAuthenticated) {
       return <Navigate to="/teacher" />;
     }

     return <LoginForm onSubmit={login} />;
   }
   ```

**Deliverables**:
- ✅ Login logic working
- ✅ Session persistence (Zustand)
- ✅ Redirects after login

---

#### Week 6: Testing & Deployment

**Tasks**:
1. Unit tests
   ```tsx
   // src/apps/login/components/__tests__/LoginForm.test.tsx
   import { render, screen, fireEvent } from '@testing-library/react';
   import { LoginForm } from '../LoginForm';

   describe('LoginForm', () => {
     it('should render email and password inputs', () => {
       render(<LoginForm />);
       expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
       expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
     });

     it('should call onSubmit when form submitted', () => {
       const onSubmit = vi.fn();
       render(<LoginForm onSubmit={onSubmit} />);

       fireEvent.change(screen.getByPlaceholderText('Email'), {
         target: { value: 'test@example.com' }
       });
       fireEvent.click(screen.getByText('Sign In'));

       expect(onSubmit).toHaveBeenCalledWith('test@example.com', expect.any(String));
     });
   });
   ```

2. Integration tests
   - Test full login flow with mocked auth server

3. Update router configuration
   ```javascript
   // hiveclass-server-master/router/app.js
   // Add route to serve React app for /login
   server.route({
     method: 'GET',
     path: '/apps/login-react/{param*}',
     handler: {
       directory: {
         path: '../hiveclass-master/react/dist',
         redirectToSlash: true,
         index: true
       }
     }
   });
   ```

4. Feature flag (gradual rollout)
   ```javascript
   // Toggle between Montage and React login
   const USE_REACT_LOGIN = process.env.USE_REACT_LOGIN === 'true';

   if (USE_REACT_LOGIN) {
     // Serve React login
   } else {
     // Serve Montage login
   }
   ```

**Deliverables**:
- ✅ Login app fully tested (unit + integration)
- ✅ Feature flag for gradual rollout
- ✅ React login deployed alongside Montage login
- ✅ Performance comparison (React should be faster)

**Success Criteria**:
- Login works identically to Montage version
- No regressions in functionality
- Faster load time (<500ms vs Montage's 2-3s)

---

### PHASE 10.2: Student App Migration (Weeks 7-15)

**Objective**: Migrate student interface (more complex, WebRTC-heavy)

#### Week 7-8: UI Shell & Layout

**Tasks**:
1. Analyze Montage student UI structure
   ```bash
   ls -la legacy/student/ui/
   # Map all .reel components
   ```

2. Create React component tree
   ```
   StudentApp.tsx
   ├── ClassroomView.tsx
   │   ├── VideoGrid.tsx
   │   │   ├── VideoTile.tsx (for each student)
   │   │   └── ScreenShareView.tsx
   │   ├── ControlBar.tsx
   │   │   ├── MicButton.tsx
   │   │   ├── CameraButton.tsx
   │   │   ├── ScreenShareButton.tsx
   │   │   └── LeaveButton.tsx
   │   └── ChatPanel.tsx
   │       ├── MessageList.tsx
   │       └── MessageInput.tsx
   └── JoinClassroom.tsx
       └── ClassCodeInput.tsx
   ```

3. Implement base components
   - Layout and responsive design
   - Empty states (no data yet)

**Deliverables**:
- ✅ Student UI shell complete
- ✅ Responsive layout (mobile, tablet, desktop)
- ✅ Navigation within student app

---

#### Week 9-10: WebRTC Integration

**Tasks**:
1. Integrate `useWebRTCClient()` hook
   ```tsx
   // src/apps/student/StudentApp.tsx
   import { useWebRTCClient } from '@/hooks/useWebRTCClient';

   export function StudentApp() {
     const [classCode, setClassCode] = useState('');
     const { client, connected, sendMessage } = useWebRTCClient(
       'ws://localhost:9090'
     );

     const joinClassroom = useCallback(() => {
       sendMessage(JSON.stringify({
         type: 'join',
         code: classCode
       }));
     }, [classCode, sendMessage]);

     return (
       <ClassroomView
         connected={connected}
         onJoin={joinClassroom}
       />
     );
   }
   ```

2. Implement video/audio streams
   ```tsx
   // src/components/VideoTile.tsx
   import { useEffect, useRef } from 'react';

   export function VideoTile({ stream }: { stream: MediaStream }) {
     const videoRef = useRef<HTMLVideoElement>(null);

     useEffect(() => {
       if (videoRef.current && stream) {
         videoRef.current.srcObject = stream;
       }
     }, [stream]);

     return (
       <video
         ref={videoRef}
         autoPlay
         playsInline
         className="w-full h-full object-cover"
       />
     );
   }
   ```

3. Implement screen sharing
   - Use `useWebRTCClient()` to attach screen stream
   - Display in full-screen mode

**Deliverables**:
- ✅ WebRTC connection working
- ✅ Video/audio streams rendering
- ✅ Screen sharing working

---

#### Week 11-12: Data Channel & Messaging

**Tasks**:
1. Implement chat functionality
   ```tsx
   // src/apps/student/components/ChatPanel.tsx
   import { useWebRTCClient } from '@/hooks/useWebRTCClient';

   export function ChatPanel() {
     const [messages, setMessages] = useState<Message[]>([]);
     const { sendMessage } = useWebRTCClient();

     const handleSendMessage = (text: string) => {
       sendMessage(JSON.stringify({
         type: 'chat',
         text,
         timestamp: Date.now()
       }));
     };

     return (
       <div className="flex flex-col h-full">
         <MessageList messages={messages} />
         <MessageInput onSend={handleSendMessage} />
       </div>
     );
   }
   ```

2. Implement file sharing (via data channel)
   - Send files as base64-encoded chunks
   - Progress indicators

3. Handle connection states
   - Reconnection logic
   - Error messages

**Deliverables**:
- ✅ Chat working with teacher
- ✅ File sharing working
- ✅ Robust error handling

---

#### Week 13-14: State Management & Persistence

**Tasks**:
1. Create classroom state store
   ```tsx
   // src/store/classroomStore.ts
   import { create } from 'zustand';

   interface ClassroomState {
     classCode: string | null;
     teacher: Peer | null;
     students: Map<string, Peer>;
     messages: Message[];
     addStudent: (student: Peer) => void;
     removeStudent: (id: string) => void;
     addMessage: (message: Message) => void;
   }

   export const useClassroomStore = create<ClassroomState>((set) => ({
     classCode: null,
     teacher: null,
     students: new Map(),
     messages: [],
     addStudent: (student) => set((state) => ({
       students: new Map(state.students).set(student.id, student)
     })),
     removeStudent: (id) => set((state) => {
       const students = new Map(state.students);
       students.delete(id);
       return { students };
     }),
     addMessage: (message) => set((state) => ({
       messages: [...state.messages, message]
     }))
   }));
   ```

2. Persist user preferences
   - Video/audio defaults
   - UI preferences (chat open/closed, etc.)

**Deliverables**:
- ✅ Centralized state management
- ✅ Persisted preferences

---

#### Week 15: Testing & Polish

**Tasks**:
1. Unit tests for all components
   ```tsx
   // src/apps/student/components/__tests__/VideoTile.test.tsx
   describe('VideoTile', () => {
     it('should render video element with stream');
     it('should autoplay video');
     it('should handle stream change');
   });
   ```

2. Integration tests
   - Join classroom flow
   - WebRTC connection establishment
   - Message sending/receiving

3. E2E tests (Playwright)
   ```typescript
   // e2e/student.spec.ts
   import { test, expect } from '@playwright/test';

   test('student can join classroom', async ({ page }) => {
     await page.goto('http://localhost:8088/apps/student-react');
     await page.fill('input[name="classCode"]', '1234');
     await page.click('button:has-text("Join")');

     await expect(page.locator('.classroom-view')).toBeVisible();
   });
   ```

4. Performance optimization
   - Code splitting (lazy load components)
   - Memoization (React.memo, useMemo)
   - Virtual scrolling for message list

**Deliverables**:
- ✅ Student app fully tested
- ✅ Performance benchmarks (should be 2-3x faster than Montage)
- ✅ Zero console errors/warnings

---

### PHASE 10.3: Teacher App Migration (Weeks 16-24)

**Objective**: Migrate teacher interface (most complex, multi-peer WebRTC)

#### Week 16-17: UI Shell & Layout

**Tasks**:
1. Create teacher component tree
   ```
   TeacherApp.tsx
   ├── Dashboard.tsx
   │   ├── ClassroomList.tsx
   │   └── CreateClassroomButton.tsx
   ├── ClassroomView.tsx
   │   ├── StudentGrid.tsx
   │   │   ├── StudentTile.tsx (for each student)
   │   │   │   ├── VideoStream.tsx
   │   │   │   ├── StudentControls.tsx
   │   │   │   └── StudentStatus.tsx
   │   │   └── GridLayout.tsx (2x2, 3x3, etc.)
   │   ├── TeacherControls.tsx
   │   │   ├── BroadcastControls.tsx
   │   │   ├── FollowMeButton.tsx
   │   │   ├── LockClassButton.tsx
   │   │   └── EndClassButton.tsx
   │   ├── ChatPanel.tsx
   │   └── ScreenShareView.tsx
   └── ClassroomSettings.tsx
   ```

2. Implement dashboard
   - List active classrooms
   - Create new classroom
   - View classroom code

**Deliverables**:
- ✅ Teacher UI shell complete
- ✅ Dashboard with classroom management
- ✅ Responsive layout

---

#### Week 18-20: Multi-Peer WebRTC

**Tasks**:
1. Integrate `useWebRTCServer()` hook
   ```tsx
   // src/apps/teacher/TeacherApp.tsx
   import { useWebRTCServer } from '@/hooks/useWebRTCServer';

   export function TeacherApp() {
     const [classroomCode, setClassroomCode] = useState<string | null>(null);
     const { server, students, broadcastMessage } = useWebRTCServer(
       'ws://localhost:9090'
     );

     const createClassroom = useCallback(async () => {
       const code = await server.createRoom();
       setClassroomCode(code);
     }, [server]);

     return (
       <ClassroomView
         code={classroomCode}
         students={Array.from(students.values())}
         onBroadcast={broadcastMessage}
       />
     );
   }
   ```

2. Implement student grid
   ```tsx
   // src/apps/teacher/components/StudentGrid.tsx
   export function StudentGrid({ students }: { students: Student[] }) {
     const gridSize = Math.ceil(Math.sqrt(students.length));

     return (
       <div
         className={`grid gap-4`}
         style={{
           gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
           gridTemplateRows: `repeat(${gridSize}, 1fr)`
         }}
       >
         {students.map((student) => (
           <StudentTile key={student.id} student={student} />
         ))}
       </div>
     );
   }
   ```

3. Handle dynamic student list
   - Add students as they join
   - Remove students when they leave
   - Update grid layout dynamically

**Deliverables**:
- ✅ Multi-peer WebRTC working
- ✅ Student grid with all video streams
- ✅ Dynamic grid resizing

---

#### Week 21-22: Advanced Features

**Tasks**:
1. Follow Me mode
   ```tsx
   // src/apps/teacher/components/FollowMeButton.tsx
   export function FollowMeButton({ onActivate }: { onActivate: () => void }) {
     const [active, setActive] = useState(false);
     const { broadcastMessage } = useWebRTCServer();

     const handleToggle = () => {
       setActive(!active);
       broadcastMessage({
         type: 'follow-me',
         active: !active
       });
       onActivate();
     };

     return (
       <button
         onClick={handleToggle}
         className={`px-4 py-2 rounded ${active ? 'bg-green-600' : 'bg-gray-600'}`}
       >
         {active ? 'Stop Follow Me' : 'Start Follow Me'}
       </button>
     );
   }
   ```

2. Individual student controls
   - Mute student
   - Kick student
   - Private message

3. Classroom locking
   - Lock classroom (no new students)
   - Unlock classroom

**Deliverables**:
- ✅ Follow Me mode working
- ✅ Individual student controls
- ✅ Classroom locking

---

#### Week 23-24: Testing & Optimization

**Tasks**:
1. Unit tests for all components
   - StudentGrid, StudentTile, TeacherControls

2. Integration tests
   - Create classroom flow
   - Student join/leave handling
   - Broadcast messaging

3. E2E tests (multi-browser)
   ```typescript
   // e2e/classroom.spec.ts
   test('teacher can manage 10 students simultaneously', async ({ page }) => {
     // Create classroom as teacher
     await page.goto('http://localhost:8088/apps/teacher-react');
     await page.click('button:has-text("Create Classroom")');

     const code = await page.locator('.classroom-code').textContent();

     // Open 10 student tabs
     const students = await Promise.all(
       Array(10).fill(0).map(() => page.context().newPage())
     );

     // Each student joins
     for (const student of students) {
       await student.goto('http://localhost:8088/apps/student-react');
       await student.fill('input[name="classCode"]', code);
       await student.click('button:has-text("Join")');
     }

     // Verify teacher sees all 10 students
     await expect(page.locator('.student-tile')).toHaveCount(10);
   });
   ```

4. Performance optimization
   - Virtual scrolling for large student lists
   - Throttle/debounce state updates
   - WebRTC stats monitoring

**Deliverables**:
- ✅ Teacher app fully tested
- ✅ Handles 30+ students without performance degradation
- ✅ Memory usage stable

---

### PHASE 10.4: Cutover & Legacy Removal (Weeks 25-26)

**Objective**: Remove Montage framework entirely

#### Week 25: Gradual Rollout

**Tasks**:
1. Feature flag rollout strategy
   ```javascript
   // hiveclass-server-master/router/app.js
   const REACT_ROLLOUT_PERCENTAGE = parseFloat(process.env.REACT_ROLLOUT || '0');

   server.route({
     method: 'GET',
     path: '/apps/{app}/{param*}',
     handler: (request, h) => {
       const useReact = Math.random() < (REACT_ROLLOUT_PERCENTAGE / 100);

       if (useReact) {
         return h.redirect(`/apps/${request.params.app}-react/${request.params.param || ''}`);
       } else {
         return h.file(`legacy/${request.params.app}/index.html`);
       }
     }
   });
   ```

2. Staged rollout
   - Day 1: 10% traffic to React
   - Day 3: 25% traffic to React
   - Day 7: 50% traffic to React
   - Day 14: 100% traffic to React

3. Monitor metrics
   - Error rates (should be lower)
   - Load times (should be faster)
   - User feedback (should be positive)

**Deliverables**:
- ✅ Gradual rollout mechanism
- ✅ Monitoring dashboard
- ✅ Rollback plan tested

---

#### Week 26: Legacy Removal

**Tasks**:
1. Verify 100% React traffic
   - No issues reported
   - All features working

2. Remove Montage code
   ```bash
   cd /Users/danielororke/GitHub/HiveClass/hiveclass-master

   # Backup first
   tar -czf montage-backup-$(date +%Y%m%d).tar.gz legacy/

   # Remove Montage apps
   rm -rf legacy/login
   rm -rf legacy/student
   rm -rf legacy/teacher

   # Remove Montage dependencies
   cd react
   npm uninstall montage montage-webrtc bluebird q mr

   # Update .gitignore
   echo "legacy/" >> .gitignore
   ```

3. Update documentation
   - Remove Montage references
   - Add React developer guide

4. Clean up router configuration
   - Remove Montage routes
   - Simplify to only React routes

**Deliverables**:
- ✅ Montage code completely removed
- ✅ Bundle size reduced (Montage framework was ~2MB)
- ✅ Documentation updated

---

### PHASE 10.5: Polish & Documentation (Weeks 27-30)

**Objective**: Final polish, performance optimization, comprehensive documentation

#### Week 27-28: Performance Optimization

**Tasks**:
1. Bundle size optimization
   ```bash
   # Analyze bundle
   npm run build -- --mode production
   npx vite-bundle-visualizer

   # Expected results:
   # - Main bundle: <500KB gzipped
   # - Code splitting: 5-10 chunks
   # - Lazy loading: All routes lazy-loaded
   ```

2. Lighthouse audit
   - Performance: 90+
   - Accessibility: 100
   - Best Practices: 100
   - SEO: 90+

3. Memory profiling
   - No memory leaks
   - Stable memory usage with 30 students

**Deliverables**:
- ✅ Bundle optimized
- ✅ Lighthouse score 90+
- ✅ No performance regressions

---

#### Week 29-30: Documentation

**Tasks**:
1. Developer Guide
   ```markdown
   # HiveClass React Developer Guide

   ## Getting Started

   ### Prerequisites
   - Node.js 20+
   - npm 10+

   ### Installation
   ```bash
   cd hiveclass-master/react
   npm install
   npm run dev
   ```

   ## Architecture

   ### Component Structure
   - Apps: `/src/apps/`
   - Components: `/src/components/`
   - Hooks: `/src/hooks/`
   - Services: `/src/services/`

   ### State Management
   We use Zustand for global state...
   ```

2. Migration Summary
   - Before/after comparison
   - Performance improvements
   - New features added

3. API Documentation
   - WebRTC hooks
   - State stores
   - Utility functions

**Deliverables**:
- ✅ `REACT_DEVELOPER_GUIDE.md`
- ✅ `MIGRATION_SUMMARY.md`
- ✅ Inline JSDoc comments

---

## Success Metrics

### Technical Metrics

| Metric | Montage (Before) | React (Target) | Status |
|--------|------------------|----------------|--------|
| **Initial Load Time** | 2-3 seconds | <500ms | TBD |
| **Time to Interactive** | 4-5 seconds | <1 second | TBD |
| **Bundle Size** | ~2.5MB | <500KB gzipped | TBD |
| **Memory Usage (30 students)** | ~500MB | <300MB | TBD |
| **Test Coverage** | 0% | >80% | TBD |
| **Lighthouse Performance** | 40-50 | 90+ | TBD |
| **Browser Support** | Chrome only | Chrome, Edge, Safari, Firefox | TBD |

### Developer Experience Metrics

| Metric | Montage | React | Improvement |
|--------|---------|-------|-------------|
| **Build Time** | ~60 seconds | <5 seconds | 12x faster |
| **Hot Reload** | No | Yes (<100ms) | ∞ faster |
| **TypeScript** | No | Yes | Type safety |
| **Developer Onboarding** | 6+ months | 2-4 weeks | 6-12x faster |
| **Hiring Pool** | ~0 | Millions | ∞ larger |

---

## Risk Management

### Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **WebRTC integration issues** | Medium | High | Early testing (Phase 10.0 Week 3) |
| **Performance regression** | Low | High | Continuous benchmarking |
| **Feature parity not achieved** | Medium | High | Comprehensive E2E tests |
| **User resistance to new UI** | Low | Medium | Gradual rollout, user testing |
| **Timeline overrun** | Medium | Medium | Incremental delivery, feature flags |

### Rollback Plan

At any phase, we can rollback:

```javascript
// Set rollout to 0%
export REACT_ROLLOUT=0

// Restart router
pm2 restart router

// 100% traffic back to Montage
```

Rollback time: **<5 minutes**

---

## Budget Estimate

### Development Hours

| Phase | Weeks | Hours (1 dev) | Hours (2 devs) |
|-------|-------|---------------|----------------|
| 10.0 Setup | 3 | 120 | 60 |
| 10.1 Login | 3 | 120 | 60 |
| 10.2 Student | 9 | 360 | 180 |
| 10.3 Teacher | 9 | 360 | 180 |
| 10.4 Cutover | 2 | 80 | 40 |
| 10.5 Polish | 4 | 160 | 80 |
| **Total** | **30 weeks** | **1,200 hours** | **600 hours** |

### Cost Estimate (Rough)

Assuming $100/hour developer rate:
- 1 developer: $120,000 (30 weeks)
- 2 developers: $60,000 each = $120,000 (15 weeks)

**Recommendation**: 2 developers for 15 weeks = faster delivery, same cost

---

## Conclusion

This plan provides a **comprehensive, incremental migration** from Montage.js to React. The approach minimizes risk by:

1. ✅ Building alongside existing system (no downtime)
2. ✅ Testing thoroughly at each phase
3. ✅ Gradual rollout with feature flags
4. ✅ Preserving WebRTC modernization work (already done ✅)

**Expected Outcome**: Modern, maintainable React application with 2-3x better performance, 10x better developer experience, and 5-10 year support runway.

---

## Next Steps

1. **Secure approval & budget** for Phase 10
2. **Hire/assign 2 React developers**
3. **Week 1**: Kick off Phase 10.0 (Setup & Infrastructure)
4. **Week 3**: Proof of concept (WebRTC hooks working)
5. **Week 6**: First deliverable (React login working)

---

**Document Created By**: WebRTC Modernization Team
**Date**: December 10, 2025
**Status**: Planning - Awaiting Approval
**Estimated Start**: Q1 2026
**Estimated Completion**: Q3 2026 (6-7.5 months)
