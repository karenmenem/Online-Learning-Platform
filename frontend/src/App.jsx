import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import StudentLogin from './components/StudentLogin';
import InstructorLogin from './components/InstructorLogin';
import AdminLogin from './components/AdminLogin';
import Register from './components/Register';
import StudentDashboard from './components/StudentDashboard';
import InstructorDashboard from './components/InstructorDashboard';
import AdminDashboard from './components/AdminDashboard';
import ManageLessons from './components/ManageLessons';
import ManageQuizzes from './components/ManageQuizzes';
import ManageQuestions from './components/ManageQuestions';
import CourseLearning from './components/CourseLearning';
import TakeQuiz from './components/TakeQuiz';
import Certificate from './components/Certificate';
import { getAuthToken, getUser } from './utils/storage';

function App() {
  const isAuthenticated = () => {
    return getAuthToken() !== null;
  };

  const getUserRole = () => {
    const user = getUser();
    return user.role;
  };

  const ProtectedRoute = ({ children }) => {
    return isAuthenticated() ? children : <Navigate to="/" />;
  };

  return (
    <Router>
      <Routes>
        {/* Default route redirects to student login */}
        <Route path="/" element={<Navigate to="/student/login" />} />
        
        {/* Separate login pages for each role */}
        <Route path="/student/login" element={<StudentLogin />} />
        <Route path="/instructor/login" element={<InstructorLogin />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        
        {/* General login (legacy) */}
        <Route path="/login" element={<Login />} />
        
        <Route path="/register" element={
          isAuthenticated() ? <Navigate to="/dashboard" /> : <Register />
        } />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              {getUserRole() === 'student' ? (
                <Navigate to="/student/dashboard" replace />
              ) : getUserRole() === 'instructor' ? (
                <Navigate to="/instructor/dashboard" replace />
              ) : (
                <Navigate to="/admin/dashboard" replace />
              )}
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/student/dashboard" 
          element={
            <ProtectedRoute>
              <StudentDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/instructor/dashboard" 
          element={
            <ProtectedRoute>
              <InstructorDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/courses/:courseId/lessons" 
          element={
            <ProtectedRoute>
              <ManageLessons />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/courses/:courseId/quizzes" 
          element={
            <ProtectedRoute>
              <ManageQuizzes />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/courses/:courseId/quizzes/:quizId/questions" 
          element={
            <ProtectedRoute>
              <ManageQuestions />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/courses/:courseId/learn" 
          element={
            <ProtectedRoute>
              <CourseLearning />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/courses/:courseId/quizzes/:quizId/take" 
          element={
            <ProtectedRoute>
              <TakeQuiz />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/certificates/:certificateId" 
          element={
            <ProtectedRoute>
              <Certificate />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
