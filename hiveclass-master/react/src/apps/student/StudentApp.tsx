export function StudentApp() {
  return (
    <div className="min-h-screen bg-blue-50">
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-4xl font-bold text-blue-900 mb-4">Student App</h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-700 mb-4">
            Phase 10.2: Student app will be built in Weeks 7-15
          </p>
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <h2 className="font-semibold text-green-800 mb-2">Features to build:</h2>
            <ul className="list-disc list-inside text-sm text-green-700 space-y-1">
              <li>Join classroom with code</li>
              <li>WebRTC video/audio streams</li>
              <li>Screen sharing</li>
              <li>Chat with teacher</li>
              <li>File sharing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
