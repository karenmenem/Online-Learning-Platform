import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import StudentDashboard from './components/StudentDashboard';
import InstructorDashboard from './components/InstructorDashboard';
import ManageLessons from './components/ManageLessons';
import ManageQuizzes from './components/ManageQuizzes';
import ManageQuestions from './components/ManageQuestions';
import CourseLearning from './components/CourseLearning';
import TakeQuiz from './components/TakeQuiz';

function App() {
  const isAuthenticated = () => {
    return localStorage.getItem('auth_token') !== null;
  };

  const getUserRole = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.role;
  };

  const ProtectedRoute = ({ children }) => {
    return isAuthenticated() ? children : <Navigate to="/" />;
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          isAuthenticated() ? <Navigate to="/dashboard" /> : <Login />
        } />
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
                <div style={{padding: '40px', textAlign: 'center'}}>
                  <h1>Admin Dashboard</h1>
                  <p>Coming soon...</p>
                </div>
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
      </Routes>
    </Router>
  );
}

export default App;
