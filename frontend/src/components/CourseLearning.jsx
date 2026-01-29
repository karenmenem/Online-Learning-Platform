import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAuthToken } from '../utils/storage';
import { checkCertificateEligibility, downloadCertificate } from '../api/certificates';
import './CourseLearning.css';

function CourseLearning() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [certificate, setCertificate] = useState(null);
  const [certificateEligible, setCertificateEligible] = useState(false);

  useEffect(() => {
    loadCourse();
    loadLessons();
    loadQuizzes();
    checkCertificate();
  }, [courseId]);

  useEffect(() => {
    if (lessons.length > 0 && !currentLesson) {
      // Auto-select first incomplete lesson or first lesson
      const firstIncomplete = lessons.find(l => !l.is_completed);
      setCurrentLesson(firstIncomplete || lessons[0]);
    }
  }, [lessons]);

  const loadCourse = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`http://localhost:8000/api/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setCourse(data.course);
    } catch (err) {
      setError('Failed to load course');
    }
  };

  const loadLessons = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await fetch(`http://localhost:8000/api/courses/${courseId}/lessons`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setLessons(data.lessons || []);
    } catch (err) {
      setError('Failed to load lessons');
    } finally {
      setLoading(false);
    }
  };

  const loadQuizzes = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`http://localhost:8000/api/courses/${courseId}/quizzes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setQuizzes(data.quizzes || []);
    } catch (err) {
      console.error('Failed to load quizzes:', err);
    }
  };

  const checkCertificate = async () => {
    try {
      const data = await checkCertificateEligibility(courseId);
      if (data.success) {
        setCertificateEligible(true);
        setCertificate(data.certificate);
      }
    } catch (err) {
      console.log('Certificate not yet available');
    }
  };

  const handleDownloadCertificate = async () => {
    if (certificate) {
      try {
        await downloadCertificate(certificate.id);
      } catch (err) {
        alert('Failed to download certificate');
      }
    }
  };

  const markComplete = async (lessonId) => {
    try {
      const token = getAuthToken();
      const response = await fetch(
        `http://localhost:8000/api/courses/${courseId}/lessons/${lessonId}/complete`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        loadLessons();
        checkCertificate();
      }
    } catch (err) {
      console.error('Failed to mark complete:', err);
    }
  };

  const markIncomplete = async (lessonId) => {
    try {
      const token = getAuthToken();
      const response = await fetch(
        `http://localhost:8000/api/courses/${courseId}/lessons/${lessonId}/complete`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        loadLessons();
      }
    } catch (err) {
      console.error('Failed to mark incomplete:', err);
    }
  };

  const toggleComplete = () => {
    if (!currentLesson) return;
    
    if (currentLesson.is_completed) {
      markIncomplete(currentLesson.id);
    } else {
      markComplete(currentLesson.id);
    }
  };

  const goToNextLesson = () => {
    const currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
    if (currentIndex < lessons.length - 1) {
      setCurrentLesson(lessons[currentIndex + 1]);
    }
  };

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    
    // hablde yt url
    let videoId = null;
    
    // Standard youtube.com watch URL
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0];
    }
    // Shortened youtu.be URL
    else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    }
    // Embed URL
    else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('embed/')[1]?.split('?')[0];
    }
    
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  const completedCount = lessons.filter(l => l.is_completed).length;
  const progressPercentage = lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0;

  if (!course) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="course-learning-container">
      {/* Header */}
      <div className="learning-header">
        <button onClick={() => navigate('/student/dashboard')} className="back-btn">
          ← Back to Courses
        </button>
        <div className="course-progress-info">
          <h1>{course.title}</h1>
          <div className="progress-stats">
            <span>{completedCount} of {lessons.length} lessons completed</span>
            <div className="progress-bar-small">
              <div className="progress-fill" style={{width: `${progressPercentage}%`}}></div>
            </div>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
        </div>
        {certificateEligible && certificate && (
          <button onClick={handleDownloadCertificate} className="certificate-btn">
            🎓 Download Certificate
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="learning-content">
        {/* Sidebar - Lesson List */}
        <aside className="lessons-sidebar">
          <h2>Course Content</h2>
          {loading ? (
            <p>Loading lessons...</p>
          ) : lessons.length === 0 && quizzes.length === 0 ? (
            <p className="no-lessons">No content available yet.</p>
          ) : (
            <>
              {/* Lessons Section */}
              {lessons.length > 0 && (
                <div className="content-section">
                  <h3 className="section-title">📚 Lessons</h3>
                  <div className="lessons-list">
                    {lessons.map((lesson, index) => (
                      <div
                        key={lesson.id}
                        className={`lesson-item ${currentLesson?.id === lesson.id ? 'active' : ''} ${lesson.is_completed ? 'completed' : ''}`}
                        onClick={() => setCurrentLesson(lesson)}
                      >
                        <div className="lesson-number">{index + 1}</div>
                        <div className="lesson-details">
                          <div className="lesson-title">{lesson.title}</div>
                          {lesson.estimated_duration && (
                            <div className="lesson-duration">{lesson.estimated_duration} min</div>
                          )}
                        </div>
                        {lesson.is_completed && <div className="check-mark">✓</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quizzes Section */}
              {quizzes.length > 0 && (
                <div className="content-section">
                  <h3 className="section-title">📝 Quizzes</h3>
                  <div className="quizzes-list">
                    {quizzes.map((quiz) => {
                      const bestAttempt = quiz.attempts && quiz.attempts.length > 0 
                        ? quiz.attempts.reduce((best, current) => 
                            current.score > (best?.score || 0) ? current : best
                          , null)
                        : null;
                      
                      return (
                        <div
                          key={quiz.id}
                          className="quiz-item"
                          onClick={() => navigate(`/courses/${courseId}/quizzes/${quiz.id}/take`)}
                        >
                          <div className="quiz-icon">📝</div>
                          <div className="quiz-details">
                            <div className="quiz-title">{quiz.title}</div>
                            <div className="quiz-meta">
                              {quiz.questions_count} questions
                              {quiz.time_limit && ` • ${quiz.time_limit} min`}
                            </div>
                            {bestAttempt && (
                              <div className={`quiz-score ${bestAttempt.passed ? 'passed' : 'failed'}`}>
                                Best: {Math.round(bestAttempt.score)}%
                              </div>
                            )}
                          </div>
                          <div className="quiz-arrow">→</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </aside>

        {/* Main - Lesson Content */}
        <main className="lesson-viewer">
          {currentLesson ? (
            <>
              <div className="lesson-header">
                <h2>{currentLesson.title}</h2>
                <button 
                  onClick={toggleComplete}
                  className={currentLesson.is_completed ? 'mark-btn completed' : 'mark-btn'}
                >
                  {currentLesson.is_completed ? '✓ Completed' : 'Mark as Complete'}
                </button>
              </div>

              {/* Video Section */}
              {currentLesson.video_url && (
                <div className="video-section">
                  {getYouTubeEmbedUrl(currentLesson.video_url) ? (
                    <div className="video-container">
                      <iframe
                        src={getYouTubeEmbedUrl(currentLesson.video_url)}
                        title={currentLesson.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowFullScreen
                      ></iframe>
                    </div>
                  ) : (
                    <div className="video-error">
                      <p>Invalid YouTube URL format. Please use a valid YouTube link.</p>
                      <small>URL: {currentLesson.video_url}</small>
                    </div>
                  )}
                </div>
              )}

              {/* Text Content Section */}
              {currentLesson.content && (
                <div className="lesson-content">
                  <div className="content-text">
                    {currentLesson.content.split('\n').map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="lesson-navigation">
                <button
                  onClick={() => {
                    const currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
                    if (currentIndex > 0) {
                      setCurrentLesson(lessons[currentIndex - 1]);
                    }
                  }}
                  disabled={lessons.findIndex(l => l.id === currentLesson.id) === 0}
                  className="nav-btn"
                >
                  ← Previous Lesson
                </button>
                <button
                  onClick={goToNextLesson}
                  disabled={lessons.findIndex(l => l.id === currentLesson.id) === lessons.length - 1}
                  className="nav-btn next"
                >
                  Next Lesson →
                </button>
              </div>
            </>
          ) : (
            <div className="no-lesson-selected">
              <p>Select a lesson from the sidebar to begin learning</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default CourseLearning;
