import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './InstructorDashboard.css';

function InstructorDashboard() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('my-courses');
  const [courses, setCourses] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [showStatsTooltip, setShowStatsTooltip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state for creating course
  const [formData, setFormData] = useState({
    title: '',
    short_description: '',
    description: '',
    category: '',
    difficulty: 'beginner',
    thumbnail: '',
    is_published: false,
  });

  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    loadMyCourses();
  }, []);

  const loadMyCourses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:8000/api/instructor/courses', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setCourses(data.courses || []);
    } catch (err) {
      setError('Failed to load courses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('auth_token');
      const url = editingCourse 
        ? `http://localhost:8000/api/instructor/courses/${editingCourse.id}`
        : 'http://localhost:8000/api/instructor/courses';
      
      const response = await fetch(url, {
        method: editingCourse ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(editingCourse ? 'Course updated successfully!' : 'Course created successfully!');
        setShowCreateModal(false);
        setEditingCourse(null);
        setFormData({
          title: '',
          short_description: '',
          description: '',
          category: '',
          difficulty: 'beginner',
          thumbnail: '',
          is_published: false,
        });
        loadMyCourses();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || `Failed to ${editingCourse ? 'update' : 'create'} course`);
      }
    } catch (err) {
      setError(`Failed to ${editingCourse ? 'update' : 'create'} course`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:8000/api/instructor/courses/${courseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Course deleted successfully!');
        loadMyCourses();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to delete course');
    }
  };

  const togglePublish = async (courseId, currentStatus) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:8000/api/instructor/courses/${courseId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_published: !currentStatus }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        loadMyCourses();
      }
    } catch (err) {
      setError('Failed to update course');
    }
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      short_description: course.short_description,
      description: course.description,
      category: course.category,
      difficulty: course.difficulty,
      thumbnail: course.thumbnail || '',
      is_published: course.is_published,
    });
    setShowCreateModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>LearnQuest</h1>
          <div className="header-right">
            <span className="user-name">{user.name}</span>
            <span className="user-role">{user.role}</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="dashboard-nav">
        <button 
          className={activeTab === 'my-courses' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('my-courses')}
        >
          My Courses
        </button>
        <button 
          className={activeTab === 'analytics' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
      </nav>

      {/* Main Content */}
      <main className="dashboard-main">
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {/* My Courses Tab */}
        {activeTab === 'my-courses' && (
          <div className="content-section">
            <div className="section-header">
              <h2>My Courses</h2>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="create-btn"
              >
                + Create New Course
              </button>
            </div>

            {loading ? (
              <p>Loading courses...</p>
            ) : courses.length === 0 ? (
              <div className="empty-state">
                <p>You haven't created any courses yet.</p>
                <button onClick={() => setShowCreateModal(true)} className="create-btn">
                  Create Your First Course
                </button>
              </div>
            ) : (
              <div className="courses-grid">
                {courses.map((course) => (
                  <div key={course.id} className="course-card instructor">
                    <div className="course-thumbnail">
                      {course.thumbnail ? (
                        <img src={course.thumbnail} alt={course.title} />
                      ) : (
                        <div className="placeholder-thumbnail">📚</div>
                      )}
                      <div className="course-status">
                        {course.is_published ? (
                          <span className="status-badge published">Published</span>
                        ) : (
                          <span className="status-badge draft">Draft</span>
                        )}
                      </div>
                    </div>
                    <div className="course-info">
                      <div className="course-header-row">
                        <div>
                          <h3>{course.title}</h3>
                          <p className="course-category">{course.category}</p>
                        </div>
                        <div className="info-icon-wrapper">
                          <button 
                            className="info-icon-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowStatsTooltip(showStatsTooltip === course.id ? null : course.id);
                            }}
                          >
                            ℹ️
                          </button>
                          {showStatsTooltip === course.id && (
                            <div className="stats-tooltip">
                              <div className="tooltip-item">
                                <span className="tooltip-label">👥 Students:</span>
                                <span className="tooltip-value">{course.enrollments_count || 0}</span>
                              </div>
                              <div className="tooltip-item">
                                <span className="tooltip-label">📚 Lessons:</span>
                                <span className="tooltip-value">{course.lessons_count || 0}</span>
                              </div>
                              <div className="tooltip-item">
                                <span className="tooltip-label">📝 Quizzes:</span>
                                <span className="tooltip-value">{course.quizzes_count || 0}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="course-description">{course.short_description}</p>

                      <div className="course-actions">
                        <button 
                          className="action-btn edit"
                          onClick={() => handleEditCourse(course)}
                        >
                          Edit
                        </button>
                        <button 
                          className="action-btn lessons"
                          onClick={() => navigate(`/courses/${course.id}/lessons`)}
                        >
                          Manage Lessons
                        </button>
                        <button 
                          className="action-btn quizzes"
                          onClick={() => navigate(`/courses/${course.id}/quizzes`)}
                        >
                          Manage Quizzes
                        </button>
                        <button 
                          className="action-btn publish"
                          onClick={() => togglePublish(course.id, course.is_published)}
                        >
                          {course.is_published ? 'Unpublish' : 'Publish'}
                        </button>
                        <button 
                          className="action-btn delete"
                          onClick={() => handleDeleteCourse(course.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="content-section">
            <h2>Analytics</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{courses.length}</div>
                <div className="stat-label">Total Courses</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">
                  {courses.reduce((sum, c) => sum + (c.enrollments_count || 0), 0)}
                </div>
                <div className="stat-label">Total Students</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">
                  {courses.filter(c => c.is_published).length}
                </div>
                <div className="stat-label">Published Courses</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">
                  {courses.reduce((sum, c) => sum + (c.lessons_count || 0), 0)}
                </div>
                <div className="stat-label">Total Lessons</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => { setShowCreateModal(false); setEditingCourse(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCourse ? 'Edit Course' : 'Create New Course'}</h2>
              <button className="close-btn" onClick={() => { setShowCreateModal(false); setEditingCourse(null); }}>×</button>
            </div>
            
            <form onSubmit={handleCreateCourse} className="course-form">
              <div className="form-group">
                <label htmlFor="title">Course Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="e.g., Web Development, Data Science"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="difficulty">Difficulty *</label>
                <select
                  id="difficulty"
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleInputChange}
                  required
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="short_description">Short Description *</label>
                <input
                  type="text"
                  id="short_description"
                  name="short_description"
                  value={formData.short_description}
                  onChange={handleInputChange}
                  maxLength="500"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Full Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="5"
                  required
                ></textarea>
              </div>

              <div className="form-group">
                <label htmlFor="thumbnail">Thumbnail URL</label>
                <input
                  type="url"
                  id="thumbnail"
                  name="thumbnail"
                  value={formData.thumbnail}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    name="is_published"
                    checked={formData.is_published}
                    onChange={handleInputChange}
                  />
                  <span>Publish immediately</span>
                </label>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => { setShowCreateModal(false); setEditingCourse(null); }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={loading}
                >
                  {loading ? (editingCourse ? 'Updating...' : 'Creating...') : (editingCourse ? 'Update Course' : 'Create Course')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default InstructorDashboard;
