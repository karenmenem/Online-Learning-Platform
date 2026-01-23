import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAuthToken } from '../utils/storage';
import './TakeQuiz.css';

function TakeQuiz() {
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [currentAttempt, setCurrentAttempt] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadQuiz();
  }, [courseId, quizId]);

  useEffect(() => {
    if (currentAttempt && quiz?.time_limit) {
      setTimeRemaining(quiz.time_limit * 60); // Convert minutes to seconds
    }
  }, [currentAttempt, quiz]);

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || !currentAttempt) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, currentAttempt]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await fetch(`http://localhost:8000/api/courses/${courseId}/quizzes/${quizId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setQuiz(data.quiz);
      setAttempts(data.attempts || []);
    } catch (err) {
      setError('Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = () => {
    setCurrentAttempt({ started_at: new Date() });
    setSelectedAnswers({});
    setShowResults(false);
    setResults(null);
  };

  const handleAnswerSelect = (questionId, answerId) => {
    const question = quiz.questions.find(q => q.id === questionId);
    
    if (question.question_type === 'multiple_select') {
      // For multiple select, toggle answer
      setSelectedAnswers(prev => {
        const current = prev[questionId] || [];
        const isSelected = current.includes(answerId);
        
        return {
          ...prev,
          [questionId]: isSelected 
            ? current.filter(id => id !== answerId)
            : [...current, answerId]
        };
      });
    } else {
      // For single select (MCQ, True/False)
      setSelectedAnswers(prev => ({
        ...prev,
        [questionId]: [answerId]
      }));
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    // Validate all questions answered
    const unanswered = quiz.questions.filter(q => !selectedAnswers[q.id] || selectedAnswers[q.id].length === 0);
    if (unanswered.length > 0 && !window.confirm(`You have ${unanswered.length} unanswered question(s). Submit anyway?`)) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const token = getAuthToken();
      
      // Format answers for API
      const formattedAnswers = quiz.questions.map(question => ({
        question_id: question.id,
        answer_ids: selectedAnswers[question.id] || []
      }));

      const response = await fetch(
        `http://localhost:8000/api/courses/${courseId}/quizzes/${quizId}/submit`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ answers: formattedAnswers }),
        }
      );

      const data = await response.json();
      
      if (response.ok) {
        setResults(data);
        setShowResults(true);
        setCurrentAttempt(null);
        loadQuiz(); // Reload to update attempts
      } else {
        setError(data.message || 'Failed to submit quiz');
      }
    } catch (err) {
      setError('Failed to submit quiz. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const viewAttempt = async (attemptId) => {
    try {
      const token = getAuthToken();
      const response = await fetch(
        `http://localhost:8000/api/courses/${courseId}/quizzes/${quizId}/attempts/${attemptId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const data = await response.json();
      setResults({
        ...data.attempt,
        results: data.results,
        quiz: data.quiz
      });
      setShowResults(true);
    } catch (err) {
      setError('Failed to load attempt details');
    }
  };

  if (loading) {
    return <div className="loading">Loading quiz...</div>;
  }

  if (!quiz) {
    return <div className="error-message">Quiz not found</div>;
  }

  // Show Results View
  if (showResults && results) {
    const passed = results.passed || results.score >= quiz.passing_score;
    
    return (
      <div className="quiz-container">
        <div className="quiz-header">
          <button onClick={() => navigate(`/courses/${courseId}/learn`)} className="back-btn">
            ← Back to Course
          </button>
        </div>

        <div className="quiz-results">
          <div className={`results-header ${passed ? 'passed' : 'failed'}`}>
            <h1>{passed ? '🎉 Congratulations!' : '📝 Quiz Completed'}</h1>
            <div className="score-display">
              <div className="score-circle">
                <span className="score-number">{Math.round(results.score)}%</span>
              </div>
              <p className="score-text">
                {passed 
                  ? `You passed! (Passing score: ${quiz.passing_score}%)`
                  : `You need ${quiz.passing_score}% to pass. Try again!`
                }
              </p>
            </div>
          </div>

          <div className="results-stats">
            <div className="stat">
              <span className="stat-label">Correct Answers</span>
              <span className="stat-value">{results.correct_answers || 0} / {results.total_questions || quiz.questions.length}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Your Score</span>
              <span className="stat-value">{Math.round(results.score)}%</span>
            </div>
            <div className="stat">
              <span className="stat-label">Passing Score</span>
              <span className="stat-value">{quiz.passing_score}%</span>
            </div>
          </div>

          {quiz.show_correct_answers && results.results && (
            <div className="answers-review">
              <h2>Answer Review</h2>
              {quiz.questions.map((question, index) => {
                const result = results.results.find(r => r.question_id === question.id);
                const isCorrect = result?.is_correct;
                
                return (
                  <div key={question.id} className={`question-review ${isCorrect ? 'correct' : 'incorrect'}`}>
                    <div className="question-header">
                      <span className="question-number">Question {index + 1}</span>
                      <span className={`result-badge ${isCorrect ? 'correct' : 'incorrect'}`}>
                        {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                      </span>
                    </div>
                    <p className="question-text">{question.question_text}</p>
                    
                    <div className="answers-list">
                      {question.answers.map(answer => {
                        const wasSelected = result?.submitted_answer_ids?.includes(answer.id);
                        const isCorrectAnswer = answer.is_correct;
                        
                        return (
                          <div 
                            key={answer.id} 
                            className={`answer-option review ${
                              isCorrectAnswer ? 'correct-answer' : ''
                            } ${
                              wasSelected && !isCorrectAnswer ? 'wrong-selected' : ''
                            } ${
                              wasSelected && isCorrectAnswer ? 'correct-selected' : ''
                            }`}
                          >
                            {answer.answer_text}
                            {isCorrectAnswer && <span className="correct-indicator"> ✓</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="results-actions">
            {quiz.allow_retake && (
              <button onClick={() => { setShowResults(false); startQuiz(); }} className="retake-btn">
                Try Again
              </button>
            )}
            <button onClick={() => navigate(`/courses/${courseId}/learn`)} className="back-course-btn">
              Back to Course
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show Quiz Taking View
  if (currentAttempt) {
    const answeredCount = Object.keys(selectedAnswers).filter(key => selectedAnswers[key]?.length > 0).length;
    
    return (
      <div className="quiz-container">
        <div className="quiz-header">
          <div className="quiz-info">
            <h1>{quiz.title}</h1>
            {quiz.description && <p className="quiz-description">{quiz.description}</p>}
          </div>
          {quiz.time_limit && (
            <div className={`timer ${timeRemaining < 60 ? 'warning' : ''}`}>
              <span className="timer-icon">⏱</span>
              <span className="timer-text">{formatTime(timeRemaining)}</span>
            </div>
          )}
        </div>

        <div className="quiz-progress">
          <span>Question {answeredCount} of {quiz.questions.length} answered</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(answeredCount / quiz.questions.length) * 100}%` }}></div>
          </div>
        </div>

        <div className="questions-container">
          {quiz.questions.map((question, index) => (
            <div key={question.id} className="question-card">
              <div className="question-header">
                <span className="question-number">Question {index + 1}</span>
                <span className="question-type">{question.question_type}</span>
              </div>
              <p className="question-text">{question.question_text}</p>
              
              <div className="answers-list">
                {question.answers.map(answer => {
                  const isSelected = selectedAnswers[question.id]?.includes(answer.id);
                  
                  return (
                    <div
                      key={answer.id}
                      className={`answer-option ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleAnswerSelect(question.id, answer.id)}
                    >
                      <div className="answer-checkbox">
                        {question.question_type === 'multiple_select' ? (
                          <span className="checkbox">{isSelected ? '☑' : '☐'}</span>
                        ) : (
                          <span className="radio">{isSelected ? '●' : '○'}</span>
                        )}
                      </div>
                      <span className="answer-text">{answer.answer_text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="quiz-actions">
          <button 
            onClick={handleSubmit} 
            className="submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
          <button 
            onClick={() => {
              if (window.confirm('Are you sure you want to cancel? Your progress will be lost.')) {
                setCurrentAttempt(null);
              }
            }} 
            className="cancel-btn"
          >
            Cancel
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
      </div>
    );
  }

  // Show Quiz Start/Attempts View
  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <button onClick={() => navigate(`/courses/${courseId}/learn`)} className="back-btn">
          ← Back to Course
        </button>
      </div>

      <div className="quiz-intro">
        <h1>{quiz.title}</h1>
        {quiz.description && <p className="quiz-description">{quiz.description}</p>}
        
        <div className="quiz-details">
          <div className="detail-item">
            <span className="detail-label">Questions:</span>
            <span className="detail-value">{quiz.questions.length}</span>
          </div>
          {quiz.time_limit && (
            <div className="detail-item">
              <span className="detail-label">Time Limit:</span>
              <span className="detail-value">{quiz.time_limit} minutes</span>
            </div>
          )}
          <div className="detail-item">
            <span className="detail-label">Passing Score:</span>
            <span className="detail-value">{quiz.passing_score}%</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Retakes:</span>
            <span className="detail-value">{quiz.allow_retake ? 'Allowed' : 'Not Allowed'}</span>
          </div>
        </div>

        {attempts.length > 0 && (
          <div className="previous-attempts">
            <h2>Your Attempts</h2>
            <div className="attempts-list">
              {attempts.map((attempt, index) => (
                <div key={attempt.id} className="attempt-item">
                  <div className="attempt-info">
                    <span className="attempt-number">Attempt {attempts.length - index}</span>
                    <span className={`attempt-score ${attempt.passed ? 'passed' : 'failed'}`}>
                      {Math.round(attempt.score)}%
                    </span>
                    <span className="attempt-date">
                      {new Date(attempt.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {quiz.show_correct_answers && (
                    <button onClick={() => viewAttempt(attempt.id)} className="view-btn">
                      View Details
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="start-actions">
          {(!attempts.length || quiz.allow_retake) ? (
            <button onClick={startQuiz} className="start-btn">
              {attempts.length > 0 ? 'Retake Quiz' : 'Start Quiz'}
            </button>
          ) : (
            <p className="no-retake-message">You have already completed this quiz. Retakes are not allowed.</p>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

export default TakeQuiz;
