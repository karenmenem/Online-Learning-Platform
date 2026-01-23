import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAuthToken } from '../utils/storage';
import './ManageQuestions.css';

function ManageQuestions() {
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [formData, setFormData] = useState({
    question_text: '',
    question_type: 'multiple_choice',
    points: 1,
    answers: [
      { answer_text: '', is_correct: false },
      { answer_text: '', is_correct: false },
    ],
  });

  useEffect(() => {
    loadQuiz();
    loadQuestions();
  }, [courseId, quizId]);

  const loadQuiz = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(
        `http://localhost:8000/api/courses/${courseId}/quizzes/${quizId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const data = await response.json();
      setQuiz(data.quiz);
    } catch (err) {
      console.error('Failed to load quiz:', err);
    }
  };

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await fetch(
        `http://localhost:8000/api/instructor/courses/${courseId}/quizzes/${quizId}/questions`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const data = await response.json();
      setQuestions(data.questions || []);
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = getAuthToken();

    // Validate answers based on question type
    if (formData.question_type === 'true_false' && formData.answers.length !== 2) {
      alert('True/False questions must have exactly 2 answers');
      return;
    }

    const correctCount = formData.answers.filter(a => a.is_correct).length;
    if (formData.question_type === 'multiple_choice' && correctCount !== 1) {
      alert('Multiple choice questions must have exactly 1 correct answer');
      return;
    }

    if (formData.question_type === 'multiple_select' && correctCount < 1) {
      alert('Multiple select questions must have at least 1 correct answer');
      return;
    }

    try {
      const url = editingQuestion
        ? `http://localhost:8000/api/instructor/courses/${courseId}/quizzes/${quizId}/questions/${editingQuestion.id}`
        : `http://localhost:8000/api/instructor/courses/${courseId}/quizzes/${quizId}/questions`;

      const method = editingQuestion ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowModal(false);
        resetForm();
        loadQuestions();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to save question');
      }
    } catch (err) {
      console.error('Failed to save question:', err);
      alert('Failed to save question');
    }
  };

  const handleEdit = (question) => {
    setEditingQuestion(question);
    setFormData({
      question_text: question.question_text,
      question_type: question.question_type,
      points: question.points || 1,
      answers: question.answers.map(a => ({
        id: a.id,
        answer_text: a.answer_text,
        is_correct: a.is_correct,
      })),
    });
    setShowModal(true);
  };

  const handleDelete = async (questionId) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const token = getAuthToken();
      const response = await fetch(
        `http://localhost:8000/api/instructor/courses/${courseId}/quizzes/${quizId}/questions/${questionId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        loadQuestions();
      }
    } catch (err) {
      console.error('Failed to delete question:', err);
    }
  };

  const addAnswer = () => {
    setFormData({
      ...formData,
      answers: [...formData.answers, { answer_text: '', is_correct: false }],
    });
  };

  const removeAnswer = (index) => {
    if (formData.answers.length <= 2) {
      alert('Questions must have at least 2 answers');
      return;
    }
    const newAnswers = formData.answers.filter((_, i) => i !== index);
    setFormData({ ...formData, answers: newAnswers });
  };

  const updateAnswer = (index, field, value) => {
    const newAnswers = [...formData.answers];
    newAnswers[index] = { ...newAnswers[index], [field]: value };
    
    // For multiple choice, uncheck other answers when one is checked
    if (field === 'is_correct' && value && formData.question_type === 'multiple_choice') {
      newAnswers.forEach((answer, i) => {
        if (i !== index) answer.is_correct = false;
      });
    }
    
    setFormData({ ...formData, answers: newAnswers });
  };

  const handleQuestionTypeChange = (type) => {
    let answers = formData.answers;
    
    if (type === 'true_false') {
      answers = [
        { answer_text: 'True', is_correct: false },
        { answer_text: 'False', is_correct: false },
      ];
    }
    
    setFormData({ ...formData, question_type: type, answers });
  };

  const resetForm = () => {
    setFormData({
      question_text: '',
      question_type: 'multiple_choice',
      points: 1,
      answers: [
        { answer_text: '', is_correct: false },
        { answer_text: '', is_correct: false },
      ],
    });
    setEditingQuestion(null);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const getQuestionTypeLabel = (type) => {
    const labels = {
      multiple_choice: 'Multiple Choice',
      multiple_select: 'Multiple Select',
      true_false: 'True/False',
    };
    return labels[type] || type;
  };

  return (
    <div className="manage-questions-container">
      <div className="questions-header">
        <button onClick={() => navigate(`/courses/${courseId}/quizzes`)} className="back-btn">
          ← Back to Quizzes
        </button>
        <div>
          <h1>Manage Questions</h1>
          <p className="quiz-title">{quiz?.title}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="add-question-btn">
          + Add Question
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading questions...</div>
      ) : questions.length === 0 ? (
        <div className="no-questions">
          <p>No questions yet. Add your first question to this quiz!</p>
        </div>
      ) : (
        <div className="questions-list">
          {questions.map((question, index) => (
            <div key={question.id} className="question-card">
              <div className="question-header-row">
                <div className="question-number">Question {index + 1}</div>
                <div className="question-type-badge">
                  {getQuestionTypeLabel(question.question_type)}
                </div>
              </div>
              
              <div className="question-text">{question.question_text}</div>
              
              <div className="answers-list">
                {question.answers.map((answer) => (
                  <div 
                    key={answer.id} 
                    className={`answer-item ${answer.is_correct ? 'correct' : ''}`}
                  >
                    {answer.is_correct && <span className="check-icon">✓</span>}
                    <span>{answer.answer_text}</span>
                  </div>
                ))}
              </div>

              <div className="question-actions">
                <button onClick={() => handleEdit(question)} className="edit-btn">
                  Edit
                </button>
                <button onClick={() => handleDelete(question.id)} className="delete-btn">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Question Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <h2>{editingQuestion ? 'Edit Question' : 'Add New Question'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Question Type *</label>
                <select
                  value={formData.question_type}
                  onChange={(e) => handleQuestionTypeChange(e.target.value)}
                  className="question-type-select"
                >
                  <option value="multiple_choice">Multiple Choice (Single Answer)</option>
                  <option value="multiple_select">Multiple Select (Multiple Answers)</option>
                  <option value="true_false">True/False</option>
                </select>
              </div>

              <div className="form-group">
                <label>Question Text *</label>
                <textarea
                  value={formData.question_text}
                  onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                  rows="3"
                  required
                />
              </div>

              <div className="form-group">
                <label>Points</label>
                <input
                  type="number"
                  min="1"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                />
              </div>

              <div className="answers-section">
                <div className="answers-header">
                  <label>Answers *</label>
                  {formData.question_type !== 'true_false' && (
                    <button type="button" onClick={addAnswer} className="add-answer-btn">
                      + Add Answer
                    </button>
                  )}
                </div>

                {formData.answers.map((answer, index) => (
                  <div key={index} className="answer-input-row">
                    <input
                      type="checkbox"
                      checked={answer.is_correct}
                      onChange={(e) => updateAnswer(index, 'is_correct', e.target.checked)}
                      title="Mark as correct answer"
                    />
                    <input
                      type="text"
                      value={answer.answer_text}
                      onChange={(e) => updateAnswer(index, 'answer_text', e.target.value)}
                      placeholder={`Answer ${index + 1}`}
                      required
                      disabled={formData.question_type === 'true_false'}
                    />
                    {formData.question_type !== 'true_false' && formData.answers.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeAnswer(index)}
                        className="remove-answer-btn"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}

                <p className="hint-text">
                  {formData.question_type === 'multiple_choice' && 'Check ONE correct answer'}
                  {formData.question_type === 'multiple_select' && 'Check ALL correct answers'}
                  {formData.question_type === 'true_false' && 'Check the correct answer'}
                </p>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {editingQuestion ? 'Update Question' : 'Add Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageQuestions;
