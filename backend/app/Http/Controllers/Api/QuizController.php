<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class QuizController extends Controller
{
    // Get all quizzes for a course
    public function index($courseId)
    {
        $quizzes = Quiz::where('course_id', $courseId)
            ->withCount('questions')
            ->with(['attempts' => function($query) {
                $query->where('user_id', Auth::id())
                      ->orderBy('created_at', 'desc');
            }])
            ->get();

        return response()->json(['quizzes' => $quizzes]);
    }

    // Get single quiz with questions
    public function show($courseId, $quizId)
    {
        $quiz = Quiz::with(['questions.answers'])
            ->where('course_id', $courseId)
            ->findOrFail($quizId);

        // Check if user has attempts
        $attempts = QuizAttempt::where('quiz_id', $quizId)
            ->where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'quiz' => $quiz,
            'attempts' => $attempts
        ]);
    }

    // Create quiz (Instructor only)
    public function store(Request $request, $courseId)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'lesson_id' => 'nullable|exists:lessons,id',
            'passing_score' => 'required|integer|min:0|max:100',
            'time_limit' => 'nullable|integer|min:1',
            'shuffle_questions' => 'boolean',
            'show_correct_answers' => 'boolean',
            'allow_retake' => 'boolean',
        ]);

        // Verify course belongs to instructor
        $course = Course::where('id', $courseId)
            ->where('created_by', Auth::id())
            ->firstOrFail();

        $quiz = Quiz::create([
            'course_id' => $courseId,
            'lesson_id' => $validated['lesson_id'] ?? null,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'passing_score' => $validated['passing_score'],
            'time_limit' => $validated['time_limit'] ?? null,
            'shuffle_questions' => $validated['shuffle_questions'] ?? false,
            'show_correct_answers' => $validated['show_correct_answers'] ?? true,
            'allow_retake' => $validated['allow_retake'] ?? true,
        ]);

        return response()->json(['quiz' => $quiz], 201);
    }

    // Update quiz (Instructor only)
    public function update(Request $request, $courseId, $quizId)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'lesson_id' => 'nullable|exists:lessons,id',
            'passing_score' => 'required|integer|min:0|max:100',
            'time_limit' => 'nullable|integer|min:1',
            'shuffle_questions' => 'boolean',
            'show_correct_answers' => 'boolean',
            'allow_retake' => 'boolean',
        ]);

        // Verify course belongs to instructor
        $course = Course::where('id', $courseId)
            ->where('created_by', Auth::id())
            ->firstOrFail();

        $quiz = Quiz::where('course_id', $courseId)
            ->findOrFail($quizId);

        $quiz->update($validated);

        return response()->json(['quiz' => $quiz]);
    }

    // Delete quiz (Instructor only)
    public function destroy($courseId, $quizId)
    {
        // Verify course belongs to instructor
        $course = Course::where('id', $courseId)
            ->where('created_by', Auth::id())
            ->firstOrFail();

        $quiz = Quiz::where('course_id', $courseId)
            ->findOrFail($quizId);

        $quiz->delete();

        return response()->json(['message' => 'Quiz deleted successfully']);
    }

    // Submit quiz attempt (Student)
    public function submitAttempt(Request $request, $courseId, $quizId)
    {
        $validated = $request->validate([
            'answers' => 'required|array',
            'answers.*.question_id' => 'required|exists:questions,id',
            'answers.*.answer_ids' => 'required|array',
            'answers.*.answer_ids.*' => 'exists:answers,id',
        ]);

        $quiz = Quiz::with('questions.answers')
            ->where('course_id', $courseId)
            ->findOrFail($quizId);

        // Calculate score
        $totalQuestions = $quiz->questions->count();
        $correctAnswers = 0;

        $results = [];
        foreach ($validated['answers'] as $answer) {
            $question = $quiz->questions->find($answer['question_id']);
            if (!$question) continue;

            $correctAnswerIds = $question->answers->where('is_correct', true)->pluck('id')->toArray();
            $submittedAnswerIds = $answer['answer_ids'];

            sort($correctAnswerIds);
            sort($submittedAnswerIds);

            $isCorrect = $correctAnswerIds == $submittedAnswerIds;
            if ($isCorrect) {
                $correctAnswers++;
            }

            $results[] = [
                'question_id' => $question->id,
                'is_correct' => $isCorrect,
                'correct_answer_ids' => $correctAnswerIds,
                'submitted_answer_ids' => $submittedAnswerIds,
            ];
        }

        $score = $totalQuestions > 0 ? ($correctAnswers / $totalQuestions) * 100 : 0;
        $passed = $score >= $quiz->passing_score;

        // Save attempt
        $attempt = QuizAttempt::create([
            'quiz_id' => $quizId,
            'user_id' => Auth::id(),
            'score' => round($score, 2),
            'passed' => $passed,
            'answers' => json_encode($results),
        ]);

        return response()->json([
            'attempt' => $attempt,
            'score' => round($score, 2),
            'passed' => $passed,
            'correct_answers' => $correctAnswers,
            'total_questions' => $totalQuestions,
            'results' => $quiz->show_correct_answers ? $results : null,
        ]);
    }

    // Get quiz attempts for student
    public function getAttempts($courseId, $quizId)
    {
        $attempts = QuizAttempt::where('quiz_id', $quizId)
            ->where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['attempts' => $attempts]);
    }

    // Get single attempt details
    public function getAttempt($courseId, $quizId, $attemptId)
    {
        $attempt = QuizAttempt::where('quiz_id', $quizId)
            ->where('user_id', Auth::id())
            ->findOrFail($attemptId);

        $quiz = Quiz::with('questions.answers')->findOrFail($quizId);

        return response()->json([
            'attempt' => $attempt,
            'quiz' => $quiz,
            'results' => json_decode($attempt->answers, true),
        ]);
    }

    // Get quiz statistics (Instructor)
    public function getStatistics($courseId, $quizId)
    {
        // Verify course belongs to instructor
        $course = Course::where('id', $courseId)
            ->where('created_by', Auth::id())
            ->firstOrFail();

        $quiz = Quiz::findOrFail($quizId);
        
        $attempts = QuizAttempt::where('quiz_id', $quizId)->get();
        
        $totalAttempts = $attempts->count();
        $averageScore = $attempts->avg('score');
        $passRate = $totalAttempts > 0 
            ? ($attempts->where('passed', true)->count() / $totalAttempts) * 100 
            : 0;

        return response()->json([
            'total_attempts' => $totalAttempts,
            'average_score' => round($averageScore, 2),
            'pass_rate' => round($passRate, 2),
            'highest_score' => $attempts->max('score'),
            'lowest_score' => $attempts->min('score'),
        ]);
    }
}
