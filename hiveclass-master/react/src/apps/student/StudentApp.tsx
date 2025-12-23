/**
 * Student Application
 *
 * Main student app with classroom joining and video streaming.
 * Migrated from Montage.js student app.
 */

import { useState, useEffect } from 'react';
import { useClassroomStore } from '@/store/classroomStore';
import { JoinClass } from './components/JoinClass';
import { EnterClass } from './components/EnterClass';
import { StudentDashboard } from './components/StudentDashboard';

type StudentAppState = 'loading' | 'enterClass' | 'joinClass' | 'dashboard';

export function StudentApp() {
  const [appState, setAppState] = useState<StudentAppState>('loading');
  const { isInClassroom, openClassrooms, listOpenClassrooms } = useClassroomStore();

  // Initialize: Check for open classrooms on mount
  useEffect(() => {
    const initialize = async () => {
      await listOpenClassrooms();
      // After loading classrooms, decide initial state
      setAppState('loading');
    };

    initialize();
  }, [listOpenClassrooms]);

  // Determine initial state based on classroom availability
  useEffect(() => {
    if (appState === 'loading') {
      if (isInClassroom) {
        setAppState('dashboard');
      } else if (openClassrooms.length > 0) {
        setAppState('enterClass');
      } else {
        setAppState('joinClass');
      }
    }
  }, [appState, isInClassroom, openClassrooms]);

  // Handle successful join
  const handleJoined = () => {
    setAppState('dashboard');
  };

  // Handle exit from classroom
  const handleExit = () => {
    setAppState('enterClass');
    listOpenClassrooms();
  };

  // Loading state
  if (appState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Render current state
  return (
    <>
      {appState === 'joinClass' && (
        <JoinClass
          onJoined={handleJoined}
          onCancel={() => setAppState('enterClass')}
          hasOpenClassrooms={openClassrooms.length > 0}
        />
      )}

      {appState === 'enterClass' && (
        <EnterClass
          onJoined={handleJoined}
          onJoinWithCode={() => setAppState('joinClass')}
        />
      )}

      {appState === 'dashboard' && <StudentDashboard onExit={handleExit} />}
    </>
  );
}
