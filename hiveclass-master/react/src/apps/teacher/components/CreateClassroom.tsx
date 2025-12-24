/**
 * Create Classroom Component
 *
 * Allows teacher to create a new classroom or enter an existing one.
 * Migrated from Montage.js teacher/ui/initialization-classroom.reel
 */

import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useTeacherStore } from '@/store/teacherStore';
import { useAuthStore } from '@/store/authStore';

interface CreateClassroomProps {
  /** Callback when classroom is created/entered */
  onEntered?: () => void;
}

/**
 * CreateClassroom Component
 *
 * UI for creating new classroom or selecting existing one.
 * Generates access code automatically on creation.
 */
export function CreateClassroom({ onEntered }: CreateClassroomProps) {
  const { user } = useAuthStore();
  const {
    createClassroom,
    enterClassroom,
    listClassrooms,
    savedClassrooms,
    isLoading,
    error,
  } = useTeacherStore();

  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [newClassName, setNewClassName] = useState('');
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);

  // Load saved classrooms on mount
  useEffect(() => {
    listClassrooms();
  }, [listClassrooms]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!user) {
      console.error('No user logged in');
      return;
    }

    try {
      if (mode === 'new' && newClassName.trim()) {
        await createClassroom(user.email, newClassName.trim());
        onEntered?.();
      } else if (mode === 'existing' && selectedClassroomId) {
        await enterClassroom(selectedClassroomId);
        onEntered?.();
      }
    } catch (err) {
      console.error('Failed to create/enter classroom:', err);
    }
  };

  const canSubmit =
    (mode === 'new' && newClassName.trim().length > 0) ||
    (mode === 'existing' && selectedClassroomId !== null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-600 rounded-2xl mb-4 shadow-lg">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {user?.firstname}!
          </h1>
          <p className="text-gray-600">Create a new classroom or continue with an existing one</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mode Selection */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setMode('new')}
                className={`
                  flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200
                  ${
                    mode === 'new'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                New Classroom
              </button>
              <button
                type="button"
                onClick={() => setMode('existing')}
                disabled={savedClassrooms.length === 0}
                className={`
                  flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200
                  ${
                    mode === 'existing'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                Existing Classroom
              </button>
            </div>

            {/* New Classroom Input */}
            {mode === 'new' && (
              <div className="animate-fadeIn">
                <label
                  htmlFor="className"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Classroom Name
                </label>
                <input
                  id="className"
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="e.g., Math 101, English Literature, Science Lab"
                  maxLength={100}
                  className="
                    w-full px-4 py-3 text-lg
                    border-2 border-gray-300 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                    transition-colors
                  "
                  autoFocus
                />
                <p className="mt-2 text-sm text-gray-500">
                  Choose a descriptive name for your classroom
                </p>
              </div>
            )}

            {/* Existing Classrooms List */}
            {mode === 'existing' && (
              <div className="animate-fadeIn">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Classroom
                </label>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {savedClassrooms.map((classroom) => (
                    <button
                      key={classroom.id}
                      type="button"
                      onClick={() => setSelectedClassroomId(classroom.id)}
                      className={`
                        w-full flex items-center justify-between
                        p-4 rounded-lg border-2 transition-all duration-200
                        ${
                          selectedClassroomId === classroom.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">{classroom.name}</p>
                        <p className="text-sm text-gray-600">
                          Code: {classroom.code} •{' '}
                          {new Date(classroom.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {selectedClassroomId === classroom.id && (
                        <svg
                          className="w-6 h-6 text-purple-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
                {savedClassrooms.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    No saved classrooms. Create a new one to get started.
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !canSubmit}
              className="
                w-full bg-purple-600 text-white font-medium
                py-3 px-6 rounded-lg
                hover:bg-purple-700 active:bg-purple-800
                disabled:bg-gray-300 disabled:cursor-not-allowed
                transition-colors duration-200
                flex items-center justify-center gap-2
              "
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{mode === 'new' ? 'Creating...' : 'Entering...'}</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                  <span>{mode === 'new' ? 'Create Classroom' : 'Enter Classroom'}</span>
                </>
              )}
            </button>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="font-medium text-red-900">Error</p>
                  <p className="text-sm text-red-700">{error.message}</p>
                </div>
              </div>
            )}
          </form>

          {/* Info Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex gap-3 text-sm text-gray-600">
              <svg
                className="w-5 h-5 text-purple-600 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="font-medium mb-1">What happens next?</p>
                <p className="text-gray-500">
                  After creating or entering a classroom, you'll get an access code that
                  students can use to join. You'll see all connected students in real-time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
