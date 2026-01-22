import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ManageQuizzes.css';

function ManageQuizzes() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    passing_score: 70,
    time_limit: null,
    shuffle_questions: false,
    show_correct_answers: true,
    allow_retake: true,
  });

  useEffect(() => {
    loadCourse();
    loadQuizzes();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:8000/api/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setCourse(data.course);
    } catch (err) {
      console.error('Failed to load course:', err);
    }
  };

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
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
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem('auth_token');
    
    try {
      const url = editingQuiz
        ? `http://localhost:8000/api/instructor/courses/${courseId}/quizzes/${editingQuiz.id}`
        : `http://localhost:8000/api/instructor/courses/${courseId}/quizzes`;
      
      const method = editingQuiz ? 'PUT' : 'POST';
      
      console.log('Submitting quiz:', formData);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log('Response:', data);

      if (response.ok) {
        alert('Quiz created successfully!');
        setShowModal(false);
        resetForm();
        loadQuizzes();
      } else {
        alert('Failed to create quiz: ' + (data.message || 'Unknown error'));
        console.error('Error response:', data);
      }
    } catch (err) {
      console.error('Failed to save quiz:', err);
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (quiz) => {
    setEditingQuiz(quiz);
    setFormData({
      title: quiz.title,
      description: quiz.description || '',
      passing_score: quiz.passing_score,
      time_limit: quiz.time_limit || null,
      shuffle_questions: quiz.shuffle_questions,
      show_correct_answers: quiz.show_correct_answers,
      allow_retake: quiz.allow_retake,
    });
    setShowModal(true);
  };

  const handleDelete = async (quizId) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `http://localhost:8000/api/instructor/courses/${courseId}/quizzes/${quizId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        loadQuizzes();
      }
    } catch (err) {
      console.error('Failed to delete quiz:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      passing_score: 70,
      time_limit: null,
      shuffle_questions: false,
      show_correct_answers: true,
      allow_retake: true,
    });
    setEditingQuiz(null);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  return (
    <div className="manage-quizzes-container">
      <div className="quizzes-header">
        <button onClick={() => navigate('/instructor/dashboard')} className="back-btn">
          ← Back to Dashboard
        </button>
        <div>
          <h1>Manage Quizzes</h1>
          <p className="course-title">{course?.title}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="add-quiz-btn">
          + Add New Quiz
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading quizzes...</div>
      ) : quizzes.length === 0 ? (
        <div className="no-quizzes">
          <p>No quizzes yet. Create your first quiz to test students!</p>
        </div>
      ) : (
        <div className="quizzes-list">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="quiz-card">
              <div className="quiz-info">
                <h3>{quiz.title}</h3>
                {quiz.description && <p className="quiz-description">{quiz.description}</p>}
                <div className="quiz-meta">
                  <span className="meta-item">
                    📝 {quiz.questions_count || 0} Questions
                  </span>
                  <span className="meta-item">
                    ✓ {quiz.passing_score}% to Pass
                  </span>
                  {quiz.time_limit && (
                    <span className="meta-item">
                      ⏱️ {quiz.time_limit} minutes
                    </span>
                  )}
                  {quiz.allow_retake && (
                    <span className="meta-item badge">Retake Allowed</span>
                  )}
                </div>
              </div>
              <div className="quiz-actions">
                <button
                  onClick={() => navigate(`/courses/${courseId}/quizzes/${quiz.id}/questions`)}
                  className="manage-questions-btn"
                >
                  Manage Questions
                </button>
                <button onClick={() => handleEdit(quiz)} className="edit-btn">
                  Edit
                </button>
                <button onClick={() => handleDelete(quiz.id)} className="delete-btn">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Quiz Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingQuiz ? 'Edit Quiz' : 'Create New Quiz'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Quiz Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Passing Score (%) *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.passing_score}
                    onChange={(e) => setFormData({ ...formData, passing_score: parseInt(e.target.value) })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Time Limit (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.time_limit || ''}
                    onChange={(e) => setFormData({ ...formData, time_limit: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="No limit"
                  />
                </div>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.shuffle_questions}
                    onChange={(e) => setFormData({ ...formData, shuffle_questions: e.target.checked })}
                  />
                  Shuffle questions for each attempt
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.show_correct_answers}
                    onChange={(e) => setFormData({ ...formData, show_correct_answers: e.target.checked })}
                  />
                  Show correct answers after submission
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.allow_retake}
                    onChange={(e) => setFormData({ ...formData, allow_retake: e.target.checked })}
                  />
                  Allow students to retake quiz
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {editingQuiz ? 'Update Quiz' : 'Create Quiz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageQuizzes;
