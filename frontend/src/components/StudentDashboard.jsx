import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCourses, enrollCourse, getEnrolledCourses } from '../api/courses';
import './StudentDashboard.css';

function StudentDashboard() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('browse');
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    loadCourses();
    loadEnrolledCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await getCourses();
      setCourses(data.courses || []);
    } catch (err) {
      setError('Failed to load courses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadEnrolledCourses = async () => {
    try {
      const data = await getEnrolledCourses();
      setEnrolledCourses(data.courses || []);
    } catch (err) {
      console.error('Failed to load enrolled courses:', err);
    }
  };

  const handleEnroll = async (courseId) => {
    try {
      await enrollCourse(courseId);
      loadCourses();
      loadEnrolledCourses();
      setError('');
      alert('Successfully enrolled in course!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enroll in course');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const isEnrolled = (courseId) => {
    return enrolledCourses.some(course => course.id === courseId);
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
          className={activeTab === 'browse' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('browse')}
        >
          Browse Courses
        </button>
        <button 
          className={activeTab === 'my-courses' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('my-courses')}
        >
          My Courses
        </button>
        <button 
          className={activeTab === 'progress' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('progress')}
        >
          My Progress
        </button>
      </nav>

      {/* Main Content */}
      <main className="dashboard-main">
        {error && <div className="error-message">{error}</div>}

        {/* Browse Courses Tab */}
        {activeTab === 'browse' && (
          <div className="content-section">
            <h2>Available Courses</h2>
            {loading ? (
              <p>Loading courses...</p>
            ) : courses.length === 0 ? (
              <div className="empty-state">
                <p>No courses available yet.</p>
              </div>
            ) : (
              <div className="courses-grid">
                {courses.map((course) => (
                  <div key={course.id} className="course-card">
                    <div className="course-thumbnail">
                      {course.thumbnail ? (
                        <img src={course.thumbnail} alt={course.title} />
                      ) : (
                        <div className="placeholder-thumbnail">📚</div>
                      )}
                    </div>
                    <div className="course-info">
                      <h3>{course.title}</h3>
                      <p className="course-category">{course.category}</p>
                      <p className="course-description">{course.short_description}</p>
                      <div className="course-meta">
                        <span className="difficulty">{course.difficulty}</span>
                        <span className="instructor">By: {course.instructor?.name || 'Instructor'}</span>
                      </div>
                      {isEnrolled(course.id) ? (
                        <button className="enrolled-btn" disabled>Already Enrolled</button>
                      ) : (
                        <button 
                          className="enroll-btn"
                          onClick={() => handleEnroll(course.id)}
                        >
                          Enroll Now
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Courses Tab */}
        {activeTab === 'my-courses' && (
          <div className="content-section">
            <h2>My Enrolled Courses</h2>
            {enrolledCourses.length === 0 ? (
              <div className="empty-state">
                <p>You haven't enrolled in any courses yet.</p>
                <button onClick={() => setActiveTab('browse')} className="browse-btn">
                  Browse Courses
                </button>
              </div>
            ) : (
              <div className="courses-grid">
                {enrolledCourses.map((course) => (
                  <div key={course.id} className="course-card enrolled">
                    <div className="course-thumbnail">
                      {course.thumbnail ? (
                        <img src={course.thumbnail} alt={course.title} />
                      ) : (
                        <div className="placeholder-thumbnail">📚</div>
                      )}
                    </div>
                    <div className="course-info">
                      <h3>{course.title}</h3>
                      <p className="course-category">{course.category}</p>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{width: `${course.progress || 0}%`}}
                        ></div>
                      </div>
                      <p className="progress-text">{course.progress || 0}% Complete</p>
                      <button 
                        className="continue-btn"
                        onClick={() => navigate(`/courses/${course.id}/learn`)}
                      >
                        Continue Learning
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Progress Tab */}
        {activeTab === 'progress' && (
          <div className="content-section">
            <h2>My Learning Progress</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{enrolledCourses.length}</div>
                <div className="stat-label">Courses Enrolled</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">0</div>
                <div className="stat-label">Lessons Completed</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">0</div>
                <div className="stat-label">Quizzes Taken</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">0</div>
                <div className="stat-label">Certificates Earned</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default StudentDashboard;
