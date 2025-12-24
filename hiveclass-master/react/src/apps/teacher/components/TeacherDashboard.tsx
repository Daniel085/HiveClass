/**
 * Teacher Dashboard Component
 *
 * Main classroom view for teachers.
 * Shows access code, connected students, and classroom controls.
 * Migrated from Montage.js teacher/ui/teacher-dashboard.reel
 */

import { useEffect, useState } from 'react';
import { useTeacherStore } from '@/store/teacherStore';
import { useWebRTCServer } from '@/hooks/useWebRTCServer';
import { RENDEZVOUS_API } from '@/services/api-endpoints';
import type { Student } from '@/store/teacherStore';

interface TeacherDashboardProps {
  /** Callback when teacher closes classroom */
  onClose?: () => void;
}

/**
 * TeacherDashboard Component
 *
 * Main teacher interface with:
 * - Access code display
 * - Connected students list
 * - WebRTC server for broadcasting
 * - Classroom controls
 */
export function TeacherDashboard({ onClose }: TeacherDashboardProps) {
  const {
    classroom,
    students,
    closeClassroom,
    addStudent,
    removeStudent,
    setServerConnected,
    isSharingScreen,
    screenShareUrl,
  } = useTeacherStore();

  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // WebRTC Server Hook (integrated from Week 3)
  const {
    connected,
    error: webrtcError,
  } = useWebRTCServer({
    rendezvousEndpoint: RENDEZVOUS_API.WEBSOCKET,
    onOpen: () => {
      console.log('WebRTC server opened');
      setServerConnected(true);
    },
    onClose: () => {
      console.log('WebRTC server closed');
      setServerConnected(false);
    },
    onError: (err) => {
      console.error('WebRTC server error:', err);
    },
    onPeerConnected: (peerId) => {
      console.log('Student connected:', peerId);
      // Create student object from peer
      const newStudent: Student = {
        id: peerId,
        name: `Student ${peerId.slice(0, 6)}`, // TODO: Get actual name from peer
        email: '',
        connectedAt: new Date(),
        isHandRaised: false,
        isActive: true,
      };
      addStudent(newStudent);
    },
    onPeerDisconnected: (peerId) => {
      console.log('Student disconnected:', peerId);
      removeStudent(peerId);
    },
    onMessage: (peerId, message) => {
      console.log(`Message from student ${peerId}:`, message);
      // Handle student messages (hand raise, etc.)
    },
  });

  // Update server connection status
  useEffect(() => {
    setServerConnected(connected);
  }, [connected, setServerConnected]);

  const handleClose = async () => {
    await closeClassroom();
    onClose?.();
  };

  const handleCopyCode = () => {
    if (classroom?.code) {
      navigator.clipboard.writeText(classroom.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  if (!classroom) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No classroom active</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Classroom Info */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{classroom.name}</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Access Code:</span>
                <code className="text-lg font-mono font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded">
                  {classroom.code}
                </code>
                <button
                  onClick={handleCopyCode}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  {copiedCode ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    connected ? 'bg-green-500' : 'bg-red-500'
                  } animate-pulse`}
                ></div>
                <span className="text-sm text-gray-600">
                  {connected ? 'Server Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={() => setShowCloseConfirm(true)}
            className="
              bg-red-600 text-white font-medium
              px-4 py-2 rounded-lg
              hover:bg-red-700 active:bg-red-800
              transition-colors duration-200
              text-sm
            "
          >
            Close Classroom
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Student Count */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Connected Students ({students.length})
            </h2>
            <p className="text-sm text-gray-600">
              Students who have joined your classroom
            </p>
          </div>

          {/* Students Grid */}
          {students.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="bg-white rounded-lg border-2 border-gray-200 p-4 hover:border-purple-300 transition-colors"
                >
                  {/* Student Avatar */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 font-bold text-lg">
                        {student.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{student.name}</h3>
                      <p className="text-xs text-gray-500">
                        {new Date(student.connectedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {/* Student Status */}
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        student.isActive ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    ></div>
                    <span className="text-xs text-gray-600">
                      {student.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {student.isHandRaised && (
                      <span className="ml-auto text-yellow-500 text-lg" title="Hand raised">
                        ✋
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* No Students */
            <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
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
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Waiting for students...
              </h3>
              <p className="text-gray-600 mb-4">
                Share the access code <strong>{classroom.code}</strong> with your students
              </p>
              <p className="text-sm text-gray-500">
                Students will appear here as they join
              </p>
            </div>
          )}

          {/* Screen Sharing Status */}
          {isSharingScreen && screenShareUrl && (
            <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="font-medium text-purple-900">Screen Sharing Active</p>
                  <p className="text-sm text-purple-700">
                    Broadcasting to {students.length} student{students.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* WebRTC Error */}
          {webrtcError && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="font-medium text-red-900">Server Error</p>
              <p className="text-sm text-red-700">{webrtcError.message}</p>
            </div>
          )}
        </div>
      </main>

      {/* Close Confirmation Modal */}
      {showCloseConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Close Classroom?</h2>
            <p className="text-gray-600 mb-2">
              This will disconnect all {students.length} student{students.length !== 1 ? 's' : ''}{' '}
              and close the classroom.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              You can create a new classroom or enter this one again later.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCloseConfirm(false)}
                className="flex-1 bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleClose}
                className="flex-1 bg-red-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-red-700"
              >
                Close Classroom
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
