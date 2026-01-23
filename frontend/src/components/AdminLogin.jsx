import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { setAuthToken, setUser } from '../utils/storage';
import './Login.css';

function AdminLogin() {
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
      
      // Check if user is actually an admin
      if (data.user.role !== 'admin') {
        setError('Access denied. Admin credentials required.');
        setLoading(false);
        return;
      }
      
      setAuthToken(data.token);
      setUser(data.user);
      navigate('/admin/dashboard');
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
          <h1 className="login-title">🛡️ Admin Portal</h1>
          <h2 className="login-subtitle">LearnQuest</h2>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Admin Email</label>
              <input
                id="email"
                type="email"
                placeholder="Enter admin email"
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
              {loading ? 'Logging in...' : 'Login as Admin'}
            </button>
          </form>

          <div className="login-footer">
            <p>Other portals:</p>
            <div className="portal-links">
              <a href="/student/login">Student Login</a>
              <a href="/instructor/login">Instructor Login</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
