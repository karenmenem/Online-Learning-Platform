import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { setAuthToken, setUser } from '../utils/storage';
import './Login.css';

function StudentLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const data = await login(email, password);
      
      // Check if user is actually a student
      if (data.user.role !== 'student') {
        setError('Access denied. Student credentials required.');
        setLoading(false);
        return;
      }
      
      setAuthToken(data.token);
      setUser(data.user);
      navigate('/student/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-box">
          <h1 className="login-title">📚 Student Portal</h1>
          <h2 className="login-subtitle">LearnQuest</h2>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Student Email</label>
              <input
                id="email"
                type="email"
                placeholder="Enter student email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="login-button"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login as Student'}
            </button>
          </form>

          <div className="login-footer">
            <p>Don't have an account? <a href="/register">Sign up</a></p>
            <div className="portal-links">
              <a href="/instructor/login">Instructor Login</a>
              <a href="/admin/login">Admin Login</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentLogin;
