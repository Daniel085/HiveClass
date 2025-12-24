/**
 * Teacher Application
 *
 * Main teacher app with classroom creation and student management.
 * Migrated from Montage.js teacher app.
 */

import { useState, useEffect } from 'react';
import { useTeacherStore } from '@/store/teacherStore';
import { CreateClassroom } from './components/CreateClassroom';
import { TeacherDashboard } from './components/TeacherDashboard';

type TeacherAppState = 'loading' | 'create' | 'dashboard';

export function TeacherApp() {
  const [appState, setAppState] = useState<TeacherAppState>('loading');
  const { isInClassroom, listClassrooms } = useTeacherStore();

  // Initialize: Load saved classrooms
  useEffect(() => {
    const initialize = async () => {
      await listClassrooms();
      // Decide initial state
      setAppState('loading');
    };

    initialize();
  }, [listClassrooms]);

  // Determine initial state
  useEffect(() => {
    if (appState === 'loading') {
      if (isInClassroom) {
        setAppState('dashboard');
      } else {
        setAppState('create');
      }
    }
  }, [appState, isInClassroom]);

  // Handle classroom created/entered
  const handleEntered = () => {
    setAppState('dashboard');
  };

  // Handle classroom closed
  const handleClose = () => {
    setAppState('create');
    listClassrooms();
  };

  // Loading state
  if (appState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Render current state
  return (
    <>
      {appState === 'create' && <CreateClassroom onEntered={handleEntered} />}

      {appState === 'dashboard' && <TeacherDashboard onClose={handleClose} />}
    </>
  );
}
