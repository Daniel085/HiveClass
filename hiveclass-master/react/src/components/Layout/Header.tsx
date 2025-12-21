import { NavLink } from 'react-router-dom';

export function Header() {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'text-blue-600 font-semibold border-b-2 border-blue-600 pb-1 transition-all'
      : 'text-gray-600 hover:text-blue-600 font-medium transition-colors pb-1';

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-xl">H</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">HiveClass</h1>
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
            React
          </span>
        </div>
        <nav className="flex gap-6">
          <NavLink to="/login" className={navLinkClass}>
            Login
          </NavLink>
          <NavLink to="/student" className={navLinkClass}>
            Student
          </NavLink>
          <NavLink to="/teacher" className={navLinkClass}>
            Teacher
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
