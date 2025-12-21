/**
 * Login Form Component
 *
 * Main login interface for HiveClass.
 * Currently supports Google OAuth authentication.
 */

import { GoogleOAuthButton } from './GoogleOAuthButton';

interface LoginFormProps {
  /** URL to redirect to after successful login */
  nextUrl?: string;

  /** Whether to show student login (default) or teacher login */
  mode?: 'student' | 'teacher';
}

/**
 * Login Form Component
 *
 * Provides Google OAuth authentication interface.
 * Styled with Tailwind CSS for a modern, clean look.
 *
 * @example
 * ```tsx
 * <LoginForm nextUrl="/student" mode="student" />
 * <LoginForm nextUrl="/teacher" mode="teacher" />
 * ```
 */
export function LoginForm({ nextUrl = '/student', mode = 'student' }: LoginFormProps) {
  const isTeacher = mode === 'teacher';

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-4 shadow-lg">
            <span className="text-white text-3xl font-bold">H</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to HiveClass
          </h2>
          <p className="text-gray-600">
            {isTeacher
              ? 'Sign in to manage your classroom'
              : 'Sign in to join your classroom'}
          </p>
        </div>

        {/* Google OAuth Section */}
        <div className="space-y-4">
          <GoogleOAuthButton nextUrl={nextUrl} fullWidth />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">
                Secure authentication
              </span>
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <div className="flex gap-3">
              <svg
                className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
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
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Secure Sign-In</p>
                <p className="text-blue-700">
                  We use Google OAuth for secure, passwordless authentication.
                  Your credentials are never stored on our servers.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            By signing in, you agree to our{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>

      {/* Mode Toggle Hint */}
      <div className="mt-6 text-center">
        <p className="text-gray-600 text-sm">
          {isTeacher ? (
            <>
              Not a teacher?{' '}
              <a href="/student" className="text-blue-600 hover:text-blue-700 font-medium">
                Student login
              </a>
            </>
          ) : (
            <>
              Are you a teacher?{' '}
              <a href="/teacher" className="text-blue-600 hover:text-blue-700 font-medium">
                Teacher login
              </a>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
