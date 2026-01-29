<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class InstructorAnalyticsController extends Controller
{
    // Get overall instructor statistics
    public function getOverallStats()
    {
        $instructorId = Auth::id();

        $stats = [
            'totalCourses' => Course::where('created_by', $instructorId)->count(),
            'publishedCourses' => Course::where('created_by', $instructorId)
                ->where('is_published', true)
                ->count(),
            'totalEnrollments' => Course::where('created_by', $instructorId)
                ->withCount('enrollments')
                ->get()
                ->sum('enrollments_count'),
            'totalQuizzes' => Quiz::whereHas('course', function ($query) use ($instructorId) {
                $query->where('created_by', $instructorId);
            })->count(),
            'totalQuizAttempts' => QuizAttempt::whereHas('quiz.course', function ($query) use ($instructorId) {
                $query->where('created_by', $instructorId);
            })->count(),
        ];

        return response()->json($stats);
    }

   
    public function getCourseAnalytics($courseId)
    {
        $instructorId = Auth::id();
        
        
        $course = Course::where('id', $courseId)
            ->where('created_by', $instructorId)
            ->firstOrFail();

        $enrollmentsCount = $course->enrollments()->count();
        
        // Get quiz statistics for this course
        $quizzes = Quiz::where('course_id', $courseId)->get();
        
        $quizStats = [];
        foreach ($quizzes as $quiz) {
            $attempts = QuizAttempt::where('quiz_id', $quiz->id)->get();
            
            if ($attempts->count() > 0) {
                $quizStats[] = [
                    'quiz_id' => $quiz->id,
                    'quiz_title' => $quiz->title,
                    'total_attempts' => $attempts->count(),
                    'average_score' => round($attempts->avg('score'), 2),
                    'pass_rate' => round(($attempts->where('passed', true)->count() / $attempts->count()) * 100, 2),
                    'highest_score' => $attempts->max('score'),
                    'lowest_score' => $attempts->min('score'),
                ];
            } else {
                $quizStats[] = [
                    'quiz_id' => $quiz->id,
                    'quiz_title' => $quiz->title,
                    'total_attempts' => 0,
                    'average_score' => 0,
                    'pass_rate' => 0,
                    'highest_score' => 0,
                    'lowest_score' => 0,
                ];
            }
        }

        return response()->json([
            'course' => [
                'id' => $course->id,
                'title' => $course->title,
                'enrollments_count' => $enrollmentsCount,
            ],
            'quiz_statistics' => $quizStats,
        ]);
    }

    // Get top and bottom performing quizzes across all courses
    public function getQuizPerformance()
    {
        $instructorId = Auth::id();

        // Get all quizzes for instructor's courses with attempt statistics
        $quizzes = Quiz::whereHas('course', function ($query) use ($instructorId) {
            $query->where('created_by', $instructorId);
        })
        ->with('course:id,title')
        ->get()
        ->map(function ($quiz) {
            $attempts = QuizAttempt::where('quiz_id', $quiz->id)->get();
            
            if ($attempts->count() > 0) {
                return [
                    'quiz_id' => $quiz->id,
                    'quiz_title' => $quiz->title,
                    'course_title' => $quiz->course->title,
                    'total_attempts' => $attempts->count(),
                    'average_score' => round($attempts->avg('score'), 2),
                    'pass_rate' => round(($attempts->where('passed', true)->count() / $attempts->count()) * 100, 2),
                ];
            }
            return null;
        })
        ->filter()
        ->values();

        // Sort by average score
        $topPerforming = $quizzes->sortByDesc('average_score')->take(5)->values();
        $lowPerforming = $quizzes->sortBy('average_score')->take(5)->values();

        return response()->json([
            'topQuizzes' => $topPerforming,
            'bottomQuizzes' => $lowPerforming,
        ]);
    }

    // Get student enrollment trends
    public function getEnrollmentTrends()
    {
        $instructorId = Auth::id();

        $courses = Course::where('created_by', $instructorId)
            ->withCount('enrollments')
            ->orderBy('enrollments_count', 'desc')
            ->get();

        return response()->json([
            'courses' => $courses,
        ]);
    }
}
