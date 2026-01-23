<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\LessonCompletion;
use App\Models\QuizAttempt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ProgressController extends Controller
{
    // Get detailed analytics for a specific course
    public function getCourseAnalytics($courseId)
    {
        $user = Auth::user();
        
        // Check enrollment
        $enrollment = CourseEnrollment::where('user_id', $user->id)
            ->where('course_id', $courseId)
            ->first();

        if (!$enrollment) {
            return response()->json([
                'success' => false,
                'message' => 'You are not enrolled in this course',
            ], 403);
        }

        $course = Course::with(['lessons', 'quizzes'])->findOrFail($courseId);

        // Lesson completion data
        $lessonCompletions = LessonCompletion::where('user_id', $user->id)
            ->whereIn('lesson_id', $course->lessons->pluck('id'))
            ->get();

        $completedLessons = $lessonCompletions->count();
        $totalLessons = $course->lessons->count();
        $completionPercentage = $totalLessons > 0 ? round(($completedLessons / $totalLessons) * 100) : 0;

        // Time spent calculation
        $totalTimeSpent = $lessonCompletions->sum('time_spent'); // in seconds
        $avgTimePerLesson = $completedLessons > 0 ? round($totalTimeSpent / $completedLessons) : 0;

        // Quiz performance
        $quizAttempts = QuizAttempt::where('user_id', $user->id)
            ->whereIn('quiz_id', $course->quizzes->pluck('id'))
            ->orderBy('created_at', 'desc')
            ->get();

        $quizzesTaken = $quizAttempts->unique('quiz_id')->count();
        $totalQuizzes = $course->quizzes->count();
        $avgQuizScore = $quizAttempts->isNotEmpty() ? round($quizAttempts->avg('score')) : 0;
        $passedQuizzes = $quizAttempts->where('passed', true)->unique('quiz_id')->count();

        // Quiz performance trend (last 10 attempts)
        $quizTrend = $quizAttempts->take(10)->map(function($attempt) {
            return [
                'quiz_id' => $attempt->quiz_id,
                'quiz_title' => $attempt->quiz->title ?? 'Quiz',
                'score' => round($attempt->score),
                'passed' => $attempt->passed,
                'date' => $attempt->created_at->format('M d'),
            ];
        });

        // Learning streak calculation
        $streak = $this->calculateLearningStreak($user->id);

        return response()->json([
            'success' => true,
            'analytics' => [
                'course_id' => $courseId,
                'course_title' => $course->title,
                'enrolled_at' => $enrollment->created_at,
                
                // Lesson stats
                'lessons' => [
                    'completed' => $completedLessons,
                    'total' => $totalLessons,
                    'percentage' => $completionPercentage,
                ],
                
                // Time stats
                'time' => [
                    'total_seconds' => $totalTimeSpent,
                    'total_hours' => round($totalTimeSpent / 3600, 1),
                    'avg_per_lesson' => $avgTimePerLesson,
                ],
                
                // Quiz stats
                'quizzes' => [
                    'taken' => $quizzesTaken,
                    'total' => $totalQuizzes,
                    'passed' => $passedQuizzes,
                    'avg_score' => $avgQuizScore,
                    'trend' => $quizTrend,
                ],
                
                // Learning streak
                'streak' => $streak,
            ],
        ]);
    }

    // Get overall student analytics
    public function getOverallAnalytics()
    {
        $user = Auth::user();

        // All enrolled courses with progress
        $enrolledCourses = CourseEnrollment::where('user_id', $user->id)
            ->with('course')
            ->get()
            ->map(function($enrollment) use ($user) {
                $course = $enrollment->course;
                
                $completedLessons = LessonCompletion::where('user_id', $user->id)
                    ->whereIn('lesson_id', $course->lessons->pluck('id'))
                    ->count();
                
                $totalLessons = $course->lessons->count();
                $progress = $totalLessons > 0 ? round(($completedLessons / $totalLessons) * 100) : 0;

                return [
                    'id' => $course->id,
                    'title' => $course->title,
                    'progress' => $progress,
                    'completed_lessons' => $completedLessons,
                    'total_lessons' => $totalLessons,
                    'enrolled_at' => $enrollment->created_at,
                ];
            });

        // Overall stats
        $totalTimeSpent = LessonCompletion::where('user_id', $user->id)->sum('time_spent');
        $totalLessonsCompleted = LessonCompletion::where('user_id', $user->id)->count();
        $totalQuizzesTaken = QuizAttempt::where('user_id', $user->id)->distinct('quiz_id')->count('quiz_id');
        $avgQuizScore = QuizAttempt::where('user_id', $user->id)->avg('score');

        $streak = $this->calculateLearningStreak($user->id);

        return response()->json([
            'success' => true,
            'analytics' => [
                'courses' => $enrolledCourses,
                'overall' => [
                    'total_time_hours' => round($totalTimeSpent / 3600, 1),
                    'lessons_completed' => $totalLessonsCompleted,
                    'quizzes_taken' => $totalQuizzesTaken,
                    'avg_quiz_score' => round($avgQuizScore ?? 0),
                    'learning_streak' => $streak,
                ],
            ],
        ]);
    }

    // Calculate learning streak (consecutive days with activity)
    private function calculateLearningStreak($userId)
    {
        // Get all activity dates (lessons + quizzes)
        $lessonDates = LessonCompletion::where('user_id', $userId)
            ->select(DB::raw('DATE(completed_at) as date'))
            ->orderBy('date', 'desc')
            ->pluck('date')
            ->unique()
            ->values();

        $quizDates = QuizAttempt::where('user_id', $userId)
            ->select(DB::raw('DATE(created_at) as date'))
            ->orderBy('date', 'desc')
            ->pluck('date')
            ->unique()
            ->values();

        $allDates = $lessonDates->merge($quizDates)->unique()->sort()->values()->reverse();

        if ($allDates->isEmpty()) {
            return [
                'current' => 0,
                'longest' => 0,
                'last_activity' => null,
            ];
        }

        $currentStreak = 0;
        $longestStreak = 0;
        $tempStreak = 1;

        $today = now()->startOfDay();
        $lastActivityDate = \Carbon\Carbon::parse($allDates->first());

        // Check if streak is active (activity today or yesterday)
        if ($lastActivityDate->isSameDay($today) || $lastActivityDate->isSameDay($today->copy()->subDay())) {
            $currentStreak = 1;
            
            for ($i = 1; $i < $allDates->count(); $i++) {
                $currentDate = \Carbon\Carbon::parse($allDates[$i]);
                $previousDate = \Carbon\Carbon::parse($allDates[$i - 1]);
                
                if ($previousDate->diffInDays($currentDate) === 1) {
                    $currentStreak++;
                    $tempStreak++;
                } else {
                    break;
                }
            }
        }

        // Calculate longest streak
        $tempStreak = 1;
        for ($i = 1; $i < $allDates->count(); $i++) {
            $currentDate = \Carbon\Carbon::parse($allDates[$i]);
            $previousDate = \Carbon\Carbon::parse($allDates[$i - 1]);
            
            if ($previousDate->diffInDays($currentDate) === 1) {
                $tempStreak++;
                $longestStreak = max($longestStreak, $tempStreak);
            } else {
                $tempStreak = 1;
            }
        }
        $longestStreak = max($longestStreak, $tempStreak, $currentStreak);

        return [
            'current' => $currentStreak,
            'longest' => $longestStreak,
            'last_activity' => $lastActivityDate->diffForHumans(),
        ];
    }
}
