import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { setAuthToken, setUser } from '../utils/storage';
import './Login.css';

function InstructorLogin() {
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
      
      // Check if user is actually an instructor
      if (data.user.role !== 'instructor') {
        setError('Access denied. Instructor credentials required.');
        setLoading(false);
        return;
      }
      
      setAuthToken(data.token);
      setUser(data.user);
      navigate('/instructor/dashboard');
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
          <h1 className="login-title">👨‍🏫 Instructor Portal</h1>
          <h2 className="login-subtitle">LearnQuest</h2>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Instructor Email</label>
              <input
                id="email"
                type="email"
                placeholder="Enter instructor email"
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
              {loading ? 'Logging in...' : 'Login as Instructor'}
            </button>
          </form>

          <div className="login-footer">
            <p>Not an instructor? <a href="/register">Register as Instructor</a></p>
            <div className="portal-links">
              <a href="/student/login">Student Login</a>
              <a href="/admin/login">Admin Login</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InstructorLogin;
