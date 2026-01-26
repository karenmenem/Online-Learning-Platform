import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCourses, enrollCourse, getEnrolledCourses, getStudentStats } from '../api/courses';
import { getMyCertificates, downloadCertificate } from '../api/certificates';
import { getOverallAnalytics } from '../api/progress';
import { getUser, logout } from '../utils/storage';
import './StudentDashboard.css';

function StudentDashboard() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('browse');
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    lessonsCompleted: 0,
    quizzesTaken: 0,
    certificatesEarned: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    difficulty: '',
    instructor: '',
  });
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const userData = getUser();
    setUser(userData);
    loadCourses();
    loadEnrolledCourses();
    loadCertificates();
    loadStats();
    loadAnalytics();
  }, []);

  const loadCourses = async (searchFilters = {}) => {
    try {
      setLoading(true);
      const data = await getCourses(searchFilters);
      setCourses(data.courses || []);
    } catch (err) {
      setError('Failed to load courses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const searchFilters = {
      search: searchTerm,
      ...filters,
    };
    loadCourses(searchFilters);
  };

  const handleFilterChange = (filterName, value) => {
    const newFilters = { ...filters, [filterName]: value };
    setFilters(newFilters);
    loadCourses({ search: searchTerm, ...newFilters });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilters({ category: '', difficulty: '', instructor: '' });
    loadCourses();
  };

  const loadEnrolledCourses = async () => {
    try {
      const data = await getEnrolledCourses();
      setEnrolledCourses(data.courses || []);
    } catch (err) {
      console.error('Failed to load enrolled courses:', err);
    }
  };

  const loadCertificates = async () => {
    try {
      const data = await getMyCertificates();
      setCertificates(data.certificates || []);
    } catch (err) {
      console.error('Failed to load certificates:', err);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getStudentStats();
      setStats(data.stats || {
        enrolledCourses: 0,
        lessonsCompleted: 0,
        quizzesTaken: 0,
        certificatesEarned: 0,
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const loadAnalytics = async () => {
    try {
      const data = await getOverallAnalytics();
      setAnalytics(data.analytics || null);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  };

  const handleDownloadCertificate = async (certificateId) => {
    try {
      await downloadCertificate(certificateId);
    } catch (err) {
      alert('Failed to download certificate');
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
    logout();
    window.location.href = '/student/login';
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
        <button 
          className={activeTab === 'certificates' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('certificates')}
        >
          Certificates
        </button>
      </nav>

      {/* Main Content */}
      <main className="dashboard-main">
        {error && <div className="error-message">{error}</div>}

        {/* Browse Courses Tab */}
        {activeTab === 'browse' && (
          <div className="content-section">
            <h2>Available Courses</h2>
            
            {/* Search and Filters */}
            <div className="search-filter-container">
              <div className="search-filters-row">
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="search-input"
                />
                <button onClick={handleSearch} className="search-btn">🔍</button>
                <select 
                  value={filters.category} 
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Categories</option>
                  <option value="Programming">Programming</option>
                  <option value="Design">Design</option>
                  <option value="Business">Business</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Other">Other</option>
                </select>

                <select 
                  value={filters.difficulty} 
                  onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Levels</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>

                {(searchTerm || filters.category || filters.difficulty) && (
                  <button onClick={handleClearFilters} className="clear-filters-btn">
                    ✕ Clear
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <p>Loading courses...</p>
            ) : courses.length === 0 ? (
              <div className="empty-state">
                <p>No courses found matching your criteria.</p>
                <button onClick={handleClearFilters} className="browse-btn">
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="courses-grid">
                {courses.map((course) => (
                  <div key={course.id} className="course-card">
                    <div className="course-thumbnail">
                      {course.thumbnail ? (
                        <img 
                          src={course.thumbnail.startsWith('http') 
                            ? course.thumbnail 
                            : `http://localhost:8000${course.thumbnail}`
                          } 
                          alt={course.title} 
                        />
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
                        <img 
                          src={course.thumbnail.startsWith('http') 
                            ? course.thumbnail 
                            : `http://localhost:8000${course.thumbnail}`
                          } 
                          alt={course.title} 
                        />
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
            
            {/* Overall Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{stats.enrolledCourses}</div>
                <div className="stat-label">Courses Enrolled</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.lessonsCompleted}</div>
                <div className="stat-label">Lessons Completed</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.quizzesTaken}</div>
                <div className="stat-label">Quizzes Taken</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.certificatesEarned}</div>
                <div className="stat-label">Certificates Earned</div>
              </div>
            </div>

            {/* Enhanced Analytics */}
            {analytics && (
              <>
                {/* Learning Streak */}
                <div className="analytics-section">
                  <h3>Learning Streak</h3>
                  <div className="streak-container">
                    <div className="streak-card">
                      <div className="streak-number">{analytics.overall.learning_streak.current}</div>
                      <div className="streak-label">Current Streak (days)</div>
                    </div>
                    <div className="streak-card">
                      <div className="streak-number">{analytics.overall.learning_streak.longest}</div>
                      <div className="streak-label">Longest Streak</div>
                    </div>
                    <div className="streak-info">
                      <p>Last activity: {analytics.overall.learning_streak.last_activity || 'N/A'}</p>
                      {analytics.overall.learning_streak.current > 0 && (
                        <p className="streak-message"> Keep it up! You're on a roll!</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Time Spent */}
                <div className="analytics-section">
                  <h3> Time Investment</h3>
                  <div className="time-stats">
                    <div className="time-card">
                      <div className="time-number">{analytics.overall.total_time_hours}</div>
                      <div className="time-label">Total Hours</div>
                    </div>
                    <div className="time-card">
                      <div className="time-number">{analytics.overall.avg_quiz_score}%</div>
                      <div className="time-label">Avg Quiz Score</div>
                    </div>
                  </div>
                </div>

                {/* Course Progress Details */}
                <div className="analytics-section">
                  <h3> Course Progress Details</h3>
                  {analytics.courses && analytics.courses.length > 0 ? (
                    <div className="course-progress-list">
                      {analytics.courses.map((course) => (
                        <div key={course.id} className="course-progress-item">
                          <div className="course-progress-header">
                            <h4>{course.title}</h4>
                            <span className="progress-percentage">{course.progress}%</span>
                          </div>
                          <div className="progress-bar-large">
                            <div 
                              className="progress-fill-large" 
                              style={{width: `${course.progress}%`}}
                            >
                              <span className="progress-text-inside">
                                {course.completed_lessons}/{course.total_lessons} lessons
                              </span>
                            </div>
                          </div>
                          <div className="course-progress-meta">
                            <span>Enrolled: {new Date(course.enrolled_at).toLocaleDateString()}</span>
                            {course.progress === 100 && <span className="completed-badge">✓ Completed</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-data">No enrolled courses yet.</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Certificates Tab */}
        {activeTab === 'certificates' && (
          <div className="content-section">
            <h2>My Certificates</h2>
            {certificates.length === 0 ? (
              <div className="empty-state">
                <p>You haven't earned any certificates yet.</p>
                <p>Complete all lessons and pass all quizzes in a course to earn a certificate!</p>
              </div>
            ) : (
              <div className="certificates-grid">
                {certificates.map((cert) => (
                  <div key={cert.id} className="certificate-card">
                    <div className="certificate-icon">🎓</div>
                    <h3>{cert.course.title}</h3>
                    <p className="cert-date">
                      Issued: {new Date(cert.issued_at).toLocaleDateString()}
                    </p>
                    <p className="cert-code">Code: {cert.certificate_code || cert.certificate_number}</p>
                    <button 
                      className="download-cert-btn"
                      onClick={() => handleDownloadCertificate(cert.id)}
                    >
                      Download PDF
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default StudentDashboard;
