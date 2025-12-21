import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full mx-auto flex items-center justify-center">
            <span className="text-4xl">🔍</span>
          </div>
        </div>

        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>

        <p className="text-gray-600 mb-8">
          Sorry, the page you're looking for doesn't exist in the HiveClass React app.
        </p>

        <div className="space-y-3">
          <Link
            to="/login"
            className="block w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </Link>

          <div className="flex gap-3">
            <Link
              to="/student"
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Student App
            </Link>
            <Link
              to="/teacher"
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Teacher App
            </Link>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-8">
          Phase 10.0 Week 2: Enhanced Navigation
        </p>
      </div>
    </div>
  );
}
