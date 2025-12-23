/**
 * Join Class Component
 *
 * Allows student to join a classroom using an access code.
 * Migrated from Montage.js student/ui/join-class.reel
 */

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useClassroomStore } from '@/store/classroomStore';

interface JoinClassProps {
  /** Callback when successfully joined */
  onJoined?: () => void;

  /** Callback when user cancels (to show classroom list) */
  onCancel?: () => void;

  /** Whether there are open classrooms to go back to */
  hasOpenClassrooms?: boolean;
}

/**
 * JoinClass Component
 *
 * UI for entering an access code to join a classroom.
 * Validates code format and handles join errors.
 */
export function JoinClass({ onJoined, onCancel, hasOpenClassrooms = false }: JoinClassProps) {
  const [accessCode, setAccessCode] = useState('');
  const [isInvalid, setIsInvalid] = useState(false);
  const { joinWithAccessCode, isJoining } = useClassroomStore();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!accessCode.trim()) {
      setIsInvalid(true);
      return;
    }

    setIsInvalid(false);

    try {
      await joinWithAccessCode(accessCode.toUpperCase());
      onJoined?.();
    } catch (err) {
      // Error is stored in store, but also show local validation
      setIsInvalid(true);
    }
  };

  const handleCancel = () => {
    setAccessCode('');
    setIsInvalid(false);
    onCancel?.();
  };

  const handleInputChange = (value: string) => {
    setAccessCode(value);
    if (isInvalid) {
      setIsInvalid(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
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
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Classroom</h1>
          <p className="text-gray-600">
            Enter the access code provided by your teacher
          </p>
        </div>

        {/* Join Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Access Code Input */}
            <div>
              <label
                htmlFor="accessCode"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Access Code
              </label>
              <input
                id="accessCode"
                type="text"
                value={accessCode}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="ABC123"
                maxLength={10}
                className={`
                  w-full px-4 py-3 text-lg font-mono uppercase text-center
                  border-2 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${
                    isInvalid
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 bg-white'
                  }
                  transition-colors
                `}
                disabled={isJoining}
                autoFocus
              />
              {isInvalid && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Invalid access code. Please try again.
                </p>
              )}
            </div>

            {/* Join Button */}
            <button
              type="submit"
              disabled={isJoining || !accessCode.trim()}
              className="
                w-full bg-blue-600 text-white font-medium
                py-3 px-6 rounded-lg
                hover:bg-blue-700 active:bg-blue-800
                disabled:bg-gray-300 disabled:cursor-not-allowed
                transition-colors duration-200
                flex items-center justify-center gap-2
              "
            >
              {isJoining ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Joining...</span>
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
                  <span>Join Classroom</span>
                </>
              )}
            </button>

            {/* Cancel Button */}
            {hasOpenClassrooms && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={isJoining}
                className="
                  w-full bg-gray-100 text-gray-700 font-medium
                  py-3 px-6 rounded-lg
                  hover:bg-gray-200 active:bg-gray-300
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors duration-200
                "
              >
                Back to Classrooms
              </button>
            )}
          </form>

          {/* Help Text */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex gap-3 text-sm text-gray-600">
              <svg
                className="w-5 h-5 text-blue-600 flex-shrink-0"
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
                <p className="font-medium mb-1">Need help?</p>
                <p className="text-gray-500">
                  Ask your teacher for the classroom access code. It's usually displayed on
                  their screen or shared via chat.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
