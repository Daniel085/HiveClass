/**
 * Enter Class Component
 *
 * Shows list of open classrooms that the student can join.
 * Migrated from Montage.js student/ui/enter-class.reel
 */

import { useEffect } from 'react';
import { useClassroomStore } from '@/store/classroomStore';
import type { Classroom } from '@/store/classroomStore';

interface EnterClassProps {
  /** Callback when classroom is selected and joined */
  onJoined?: () => void;

  /** Callback to switch to "join with code" view */
  onJoinWithCode?: () => void;
}

/**
 * EnterClass Component
 *
 * Displays a list of open classrooms to join.
 * Allows switching to manual code entry.
 */
export function EnterClass({ onJoined, onJoinWithCode }: EnterClassProps) {
  const {
    openClassrooms,
    listOpenClassrooms,
    joinWithId,
    isJoining,
    error,
  } = useClassroomStore();

  useEffect(() => {
    listOpenClassrooms();
  }, [listOpenClassrooms]);

  const handleJoinClassroom = async (classroom: Classroom) => {
    try {
      await joinWithId(classroom.id);
      onJoined?.();
    } catch (err) {
      console.error('Failed to join classroom:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl mb-4 shadow-lg">
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
            Available Classrooms
          </h1>
          <p className="text-gray-600">
            Select a classroom to join or enter an access code
          </p>
        </div>

        {/* Classrooms List */}
        {openClassrooms.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 mb-6">
            <div className="space-y-3">
              {openClassrooms.map((classroom) => (
                <button
                  key={classroom.id}
                  onClick={() => handleJoinClassroom(classroom)}
                  disabled={isJoining}
                  className="
                    w-full flex items-center justify-between
                    p-4 rounded-lg border-2 border-gray-200
                    hover:border-blue-500 hover:bg-blue-50
                    active:bg-blue-100
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-200
                    group
                  "
                >
                  <div className="flex items-center gap-4">
                    {/* Classroom Icon */}
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <svg
                        className="w-6 h-6 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                    </div>

                    {/* Classroom Info */}
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {classroom.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Teacher: {classroom.teacherName}
                      </p>
                      {classroom.studentCount !== undefined && (
                        <p className="text-xs text-gray-500 mt-1">
                          {classroom.studentCount}{' '}
                          {classroom.studentCount === 1 ? 'student' : 'students'}{' '}
                          online
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Join Arrow */}
                  <svg
                    className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-colors"
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
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* No Classrooms */
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-6 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No classrooms available
            </h3>
            <p className="text-gray-600 mb-4">
              There are no open classrooms at the moment. Please use an access code to
              join.
            </p>
          </div>
        )}

        {/* Join with Code Button */}
        <button
          onClick={onJoinWithCode}
          className="
            w-full bg-white border-2 border-blue-600 text-blue-600
            font-medium py-3 px-6 rounded-lg
            hover:bg-blue-50 active:bg-blue-100
            transition-colors duration-200
            flex items-center justify-center gap-2
          "
        >
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
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
          <span>Join with Access Code</span>
        </button>

        {/* Error Display */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
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
      </div>
    </div>
  );
}
