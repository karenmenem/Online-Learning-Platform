import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAuthToken } from '../utils/storage';
import './ManageLessons.css';

function ManageLessons() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    video_url: '',
    order: 1,
    estimated_duration: '',
  });

  useEffect(() => {
    loadCourse();
    loadLessons();
  }, [courseId]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = getAuthToken();
      const url = editingLesson
        ? `http://localhost:8000/api/instructor/courses/${courseId}/lessons/${editingLesson.id}`
        : `http://localhost:8000/api/instructor/courses/${courseId}/lessons`;
      
      const response = await fetch(url, {
        method: editingLesson ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(editingLesson ? 'Lesson updated!' : 'Lesson created!');
        setShowModal(false);
        setEditingLesson(null);
        resetForm();
        loadLessons();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to save lesson');
      }
    } catch (err) {
      setError('Failed to save lesson');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (lessonId) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;

    try {
      const token = getAuthToken();
      const response = await fetch(
        `http://localhost:8000/api/instructor/courses/${courseId}/lessons/${lessonId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setSuccess('Lesson deleted!');
        loadLessons();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to delete lesson');
    }
  };

  const openEditModal = (lesson) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title,
      content: lesson.content || '',
      video_url: lesson.video_url || '',
      order: lesson.order,
      estimated_duration: lesson.estimated_duration || '',
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingLesson(null);
    resetForm();
    setFormData(prev => ({
      ...prev,
      order: lessons.length + 1,
    }));
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      video_url: '',
      order: 1,
      estimated_duration: '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!course) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="manage-lessons-container">
      {/* Header */}
      <div className="page-header">
        <button onClick={() => navigate('/instructor/dashboard')} className="back-btn">
          ← Back to Dashboard
        </button>
        <div className="header-info">
          <h1>{course.title}</h1>
          <p className="course-meta">{course.category} • {course.difficulty}</p>
        </div>
      </div>

      {/* Messages */}
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Lessons Section */}
      <div className="lessons-section">
        <div className="section-header">
          <h2>Course Lessons</h2>
          <button onClick={openCreateModal} className="create-btn">
            + Add Lesson
          </button>
        </div>

        {loading ? (
          <p>Loading lessons...</p>
        ) : lessons.length === 0 ? (
          <div className="empty-state">
            <p>No lessons yet. Create your first lesson!</p>
            <button onClick={openCreateModal} className="create-btn">
              Create First Lesson
            </button>
          </div>
        ) : (
          <div className="lessons-list">
            {lessons.map((lesson) => (
              <div key={lesson.id} className="lesson-item">
                <div className="lesson-number">#{lesson.order}</div>
                <div className="lesson-info">
                  <h3>{lesson.title}</h3>
                  <div className="lesson-meta">
                    {lesson.video_url && <span className="badge video">Video</span>}
                    {lesson.content && <span className="badge text">Text</span>}
                    {lesson.estimated_duration && (
                      <span className="duration">{lesson.estimated_duration} min</span>
                    )}
                  </div>
                </div>
                <div className="lesson-actions">
                  <button 
                    className="edit-btn"
                    onClick={() => openEditModal(lesson)}
                  >
                    Edit
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDelete(lesson.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingLesson ? 'Edit Lesson' : 'Create New Lesson'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="lesson-form">
              <div className="form-group">
                <label htmlFor="title">Lesson Title *</label>
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
                <label htmlFor="order">Lesson Order *</label>
                <input
                  type="number"
                  id="order"
                  name="order"
                  value={formData.order}
                  onChange={handleInputChange}
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="estimated_duration">Duration (minutes)</label>
                <input
                  type="number"
                  id="estimated_duration"
                  name="estimated_duration"
                  value={formData.estimated_duration}
                  onChange={handleInputChange}
                  min="1"
                  placeholder="e.g., 15"
                />
              </div>

              <div className="form-group">
                <label htmlFor="video_url">Video URL (YouTube)</label>
                <input
                  type="url"
                  id="video_url"
                  name="video_url"
                  value={formData.video_url}
                  onChange={handleInputChange}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <small>Paste a YouTube video URL</small>
              </div>

              <div className="form-group">
                <label htmlFor="content">Text Content</label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  rows="8"
                  placeholder="Write lesson content here..."
                ></textarea>
                <small>You can add video, text, or both</small>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : editingLesson ? 'Update Lesson' : 'Create Lesson'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageLessons;
