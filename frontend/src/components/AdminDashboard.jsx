import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthToken, logout } from '../utils/storage';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    totalQuizAttempts: 0
  });
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const [statsRes, usersRes, coursesRes] = await Promise.all([
        fetch('http://localhost:8000/api/admin/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:8000/api/admin/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:8000/api/admin/courses', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      
      setStats(await statsRes.json());
      setUsers(await usersRes.json());
      setCourses(await coursesRes.json());
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const token = getAuthToken();
      await fetch(`http://localhost:8000/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });
      alert('User role updated successfully!');
      loadAdminData();
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const token = getAuthToken();
      await fetch(`http://localhost:8000/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      alert('User deleted successfully!');
      loadAdminData();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    
    try {
      const token = getAuthToken();
      await fetch(`http://localhost:8000/api/admin/courses/${courseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      alert('Course deleted successfully!');
      loadAdminData();
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Failed to delete course');
    }
  };

  const handleApproveCourse = async (courseId) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`http://localhost:8000/api/admin/courses/${courseId}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        alert('Course approved successfully!');
        loadAdminData();
      }
    } catch (error) {
      console.error('Error approving course:', error);
      alert('Failed to approve course');
    }
  };

  const handleRejectCourse = async (courseId) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    
    try {
      const token = getAuthToken();
      const response = await fetch(`http://localhost:8000/api/admin/courses/${courseId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rejection_reason: reason })
      });
      
      if (response.ok) {
        alert('Course rejected');
        loadAdminData();
      }
    } catch (error) {
      console.error('Error rejecting course:', error);
      alert('Failed to reject course');
    }
  };

  const handleLogout = () => {
    logout();
    ;
    navigate('/login');
  };

  if (loading) {
    return <div className="loading">Loading admin dashboard...</div>;
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-content">
          <h1>🛡️ Admin Dashboard</h1>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button 
          className={`tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          Courses
        </button>
        <button 
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Approval
          {courses.filter(c => c.approval_status === 'pending').length > 0 && (
            <span className="badge">{courses.filter(c => c.approval_status === 'pending').length}</span>
          )}
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>{stats.totalUsers}</h3>
                  <p>Total Users</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📚</div>
                <div className="stat-info">
                  <h3>{stats.totalCourses}</h3>
                  <p>Total Courses</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <h3>{stats.totalEnrollments}</h3>
                  <p>Total Enrollments</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⏳</div>
                <div className="stat-info">
                  <h3>{stats.pendingApproval || 0}</h3>
                  <p>Pending Approval</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📝</div>
                <div className="stat-info">
                  <h3>{stats.totalQuizAttempts}</h3>
                  <p>Quiz Attempts</p>
                </div>
              </div>
            </div>

            <div className="recent-activity">
              <h2>Platform Summary</h2>
              <div className="summary-cards">
                <div className="summary-card">
                  <h4>User Breakdown</h4>
                  <p>Students: {users.filter(u => u.role === 'student').length}</p>
                  <p>Instructors: {users.filter(u => u.role === 'instructor').length}</p>
                  <p>Admins: {users.filter(u => u.role === 'admin').length}</p>
                </div>
                <div className="summary-card">
                  <h4>Course Stats</h4>
                  <p>Published: {courses.filter(c => c.is_published).length}</p>
                  <p>Drafts: {courses.filter(c => !c.is_published).length}</p>
                  <p>Pending: {courses.filter(c => c.approval_status === 'pending').length}</p>
                  <p>Approved: {courses.filter(c => c.approval_status === 'approved').length}</p>
                  <p>Rejected: {courses.filter(c => c.approval_status === 'rejected').length}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-tab">
            <h2>Manage Users</h2>
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <select 
                          value={user.role} 
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="role-select"
                        >
                          <option value="student">Student</option>
                          <option value="instructor">Instructor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td>
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className="delete-btn"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="courses-tab">
            <h2>Manage Courses</h2>
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Instructor</th>
                    <th>Status</th>
                    <th>Enrollments</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map(course => (
                    <tr key={course.id}>
                      <td>{course.id}</td>
                      <td>{course.title}</td>
                      <td>{course.instructor_name}</td>
                      <td>
                        <span className={`status-badge ${course.is_published ? 'published' : 'draft'}`}>
                          {course.is_published ? 'Published' : 'Draft'}
                        </span>
                        <span className={`status-badge ${course.approval_status}`}>
                          {course.approval_status}
                        </span>
                      </td>
                      <td>{course.enrollments_count || 0}</td>
                      <td>{new Date(course.created_at).toLocaleDateString()}</td>
                      <td>
                        <button 
                          onClick={() => handleDeleteCourse(course.id)}
                          className="delete-btn"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="pending-tab">
            <h2>Courses Pending Approval</h2>
            <div className="courses-grid">
              {courses.filter(c => c.approval_status === 'pending').length === 0 ? (
                <p className="empty-state">No courses pending approval</p>
              ) : (
                courses.filter(c => c.approval_status === 'pending').map(course => (
                  <div key={course.id} className="pending-course-card">
                    <h3>{course.title}</h3>
                    <p className="course-description">{course.description}</p>
                    <div className="course-meta">
                      <span>👨‍🏫 {course.instructor_name}</span>
                      <span>📅 {new Date(course.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="approval-actions">
                      <button 
                        onClick={() => handleApproveCourse(course.id)}
                        className="approve-btn"
                      >
                        ✓ Approve
                      </button>
                      <button 
                        onClick={() => handleRejectCourse(course.id)}
                        className="reject-btn"
                      >
                        ✗ Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
