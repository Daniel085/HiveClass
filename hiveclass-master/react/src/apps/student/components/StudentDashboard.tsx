/**
 * Student Dashboard Component
 *
 * Main classroom view for students.
 * Shows teacher's video stream, controls, and classroom information.
 * Migrated from Montage.js student/ui/student-dashboard.reel
 */

import { useEffect, useRef, useState } from 'react';
import { useClassroomStore } from '@/store/classroomStore';
import { useWebRTCClient } from '@/hooks/useWebRTCClient';
import { useAuthStore } from '@/store/authStore';
import { RENDEZVOUS_API } from '@/services/api-endpoints';

interface StudentDashboardProps {
  /** Callback when student exits classroom */
  onExit?: () => void;
}

/**
 * StudentDashboard Component
 *
 * Main classroom interface with:
 * - Teacher video stream (WebRTC)
 * - Connection status
 * - Exit classroom button
 * - Follow-me mode support
 */
export function StudentDashboard({ onExit }: StudentDashboardProps) {
  const { user } = useAuthStore();
  const {
    classroom,
    exitClassroom,
    setTeacherStream,
    setConnectedToTeacher,
    isFollowMeMode,
    followMeUrl,
  } = useClassroomStore();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // WebRTC Client Hook (integrated from Week 3)
  const {
    connected,
    error: webrtcError,
  } = useWebRTCClient({
    rendezvousEndpoint: RENDEZVOUS_API.WEBSOCKET,
    onOpen: () => {
      console.log('WebRTC connection opened');
      setConnectedToTeacher(true);
    },
    onClose: () => {
      console.log('WebRTC connection closed');
      setConnectedToTeacher(false);
    },
    onError: (err) => {
      console.error('WebRTC error:', err);
    },
    onRemoteStream: (stream) => {
      console.log('Received teacher stream');
      setTeacherStream(stream);

      // Attach stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    },
    onMessage: (message) => {
      console.log('Message from teacher:', message);
      // Handle teacher messages (follow-me, etc.)
    },
  });

  // Update connection status
  useEffect(() => {
    setConnectedToTeacher(connected);
  }, [connected, setConnectedToTeacher]);

  const handleExit = async () => {
    await exitClassroom();
    onExit?.();
  };

  const handleToggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  if (!classroom) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No classroom selected</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Classroom Info */}
          <div>
            <h1 className="text-xl font-bold text-white mb-1">{classroom.name}</h1>
            <p className="text-sm text-gray-400">
              Teacher: {classroom.teacherName}
            </p>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  connected ? 'bg-green-500' : 'bg-red-500'
                } animate-pulse`}
              ></div>
              <span className="text-sm text-gray-300">
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* Exit Button */}
            <button
              onClick={() => setShowExitConfirm(true)}
              className="
                bg-red-600 text-white font-medium
                px-4 py-2 rounded-lg
                hover:bg-red-700 active:bg-red-800
                transition-colors duration-200
                text-sm
              "
            >
              Exit Classroom
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Video Feed */}
          <div className="bg-black rounded-lg overflow-hidden shadow-2xl aspect-video">
            {connected ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isMuted}
                className="w-full h-full object-contain"
              />
            ) : (
              /* Connecting State */
              <div className="w-full h-full flex flex-col items-center justify-center text-white">
                <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-lg font-medium">Connecting to teacher...</p>
                <p className="text-sm text-gray-400 mt-2">Please wait</p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="mt-4 flex items-center justify-center gap-4">
            {/* Mute Button */}
            <button
              onClick={handleToggleMute}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium
                ${
                  isMuted
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }
                transition-colors duration-200
              `}
            >
              {isMuted ? (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Unmute</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Mute</span>
                </>
              )}
            </button>
          </div>

          {/* Welcome Message */}
          {user && (
            <div className="mt-6 bg-blue-600 rounded-lg p-4 text-white text-center">
              <p className="text-lg font-medium">
                Welcome, {user.firstname}! You have successfully joined {classroom.teacherName}'s class.
              </p>
            </div>
          )}

          {/* WebRTC Error */}
          {webrtcError && (
            <div className="mt-4 bg-red-600 rounded-lg p-4 text-white">
              <p className="font-medium">Connection Error</p>
              <p className="text-sm mt-1">{webrtcError.message}</p>
            </div>
          )}

          {/* Follow-Me Mode */}
          {isFollowMeMode && followMeUrl && (
            <div className="mt-4 bg-purple-600 rounded-lg p-4 text-white">
              <p className="font-medium mb-2">Follow-Me Mode Active</p>
              <p className="text-sm">
                Your teacher is sharing a screen. Click to open:
              </p>
              <a
                href={followMeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-purple-50"
              >
                Open Shared Screen
              </a>
            </div>
          )}
        </div>
      </main>

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Exit Classroom?
            </h2>
            <p className="text-gray-600 mb-6">
              Leaving this page will exit the classroom. Are you sure?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleExit}
                className="flex-1 bg-red-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-red-700"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
