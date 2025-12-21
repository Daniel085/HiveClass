import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginApp } from '@/apps/login/LoginApp';
import { StudentApp } from '@/apps/student/StudentApp';
import { TeacherApp } from '@/apps/teacher/TeacherApp';
import { NotFound } from '@/apps/NotFound/NotFound';
import { Header } from '@/components/Layout/Header';
import { Footer } from '@/components/Layout/Footer';
import { RouteTransition } from '@/components/RouteTransition';
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          <RouteTransition>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<LoginApp />} />
              <Route
                path="/student"
                element={
                  <ProtectedRoute>
                    <StudentApp />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher"
                element={
                  <ProtectedRoute>
                    <TeacherApp />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </RouteTransition>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
