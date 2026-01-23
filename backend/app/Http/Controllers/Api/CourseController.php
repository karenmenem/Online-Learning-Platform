<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\LessonCompletion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CourseController extends Controller
{
    // Get all published courses
    public function index(Request $request)
    {
        $query = Course::with('instructor:id,name')
            ->where('is_published', true)
            ->where('approval_status', 'approved'); // Only show approved courses

        // Search by title or description
        if ($request->has('search') && $request->search) {
            $searchTerm = $request->search;
            $query->where(function($q) use ($searchTerm) {
                $q->where('title', 'like', "%{$searchTerm}%")
                  ->orWhere('short_description', 'like', "%{$searchTerm}%")
                  ->orWhere('description', 'like', "%{$searchTerm}%");
            });
        }

        // Filter by category
        if ($request->has('category') && $request->category) {
            $query->where('category', $request->category);
        }

        // Filter by difficulty
        if ($request->has('difficulty') && $request->difficulty) {
            $query->where('difficulty', strtolower($request->difficulty));
        }

        // Filter by instructor
        if ($request->has('instructor') && $request->instructor) {
            $query->where('created_by', $request->instructor);
        }

        $courses = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'courses' => $courses,
        ]);
    }

    // Get single course details
    public function show($id)
    {
        $course = Course::with(['instructor:id,name', 'lessons', 'quizzes'])
            ->findOrFail($id);

        // Check if user is enrolled
        $isEnrolled = false;
        if (Auth::check()) {
            $isEnrolled = CourseEnrollment::where('user_id', Auth::id())
                ->where('course_id', $id)
                ->exists();
        }

        return response()->json([
            'success' => true,
            'course' => $course,
            'is_enrolled' => $isEnrolled,
        ]);
    }

    // Enroll in a course
    public function enroll($id)
    {
        $user = Auth::user();
        $course = Course::findOrFail($id);

        // Check if already enrolled
        $existingEnrollment = CourseEnrollment::where('user_id', $user->id)
            ->where('course_id', $id)
            ->first();

        if ($existingEnrollment) {
            return response()->json([
                'success' => false,
                'message' => 'You are already enrolled in this course',
            ], 400);
        }

        // Check if user is a student
        if ($user->role !== 'student') {
            return response()->json([
                'success' => false,
                'message' => 'Only students can enroll in courses',
            ], 403);
        }

        // Create enrollment
        $enrollment = CourseEnrollment::create([
            'user_id' => $user->id,
            'course_id' => $id,
            'progress' => 0,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Successfully enrolled in course',
            'enrollment' => $enrollment,
        ]);
    }

    // Get user's enrolled courses
    public function myEnrolledCourses()
    {
        $user = Auth::user();

        $enrolledCourses = CourseEnrollment::with(['course.instructor'])
            ->where('user_id', $user->id)
            ->get()
            ->map(function ($enrollment) {
                return [
                    'id' => $enrollment->course->id,
                    'title' => $enrollment->course->title,
                    'short_description' => $enrollment->course->short_description,
                    'thumbnail' => $enrollment->course->thumbnail,
                    'category' => $enrollment->course->category,
                    'difficulty' => $enrollment->course->difficulty,
                    'progress' => $enrollment->progress,
                    'enrolled_at' => $enrollment->created_at,
                ];
            });

        return response()->json([
            'success' => true,
            'courses' => $enrolledCourses,
        ]);
    }

    // Get course progress
    public function courseProgress($id)
    {
        $user = Auth::user();
        
        // Check if enrolled
        $enrollment = CourseEnrollment::where('user_id', $user->id)
            ->where('course_id', $id)
            ->first();

        if (!$enrollment) {
            return response()->json([
                'success' => false,
                'message' => 'You are not enrolled in this course',
            ], 403);
        }

        $course = Course::with(['lessons', 'quizzes'])->findOrFail($id);

        // Get completed lessons
        $completedLessons = LessonCompletion::where('user_id', $user->id)
            ->whereIn('lesson_id', $course->lessons->pluck('id'))
            ->count();

        $totalLessons = $course->lessons->count();
        $progress = $totalLessons > 0 ? round(($completedLessons / $totalLessons) * 100) : 0;

        // Update enrollment progress
        $enrollment->update(['progress' => $progress]);

        return response()->json([
            'success' => true,
            'progress' => $progress,
            'completed_lessons' => $completedLessons,
            'total_lessons' => $totalLessons,
            'total_quizzes' => $course->quizzes->count(),
        ]);
    }

    // Get instructor's courses (for instructors)
    public function myCourses()
    {
        $user = Auth::user();

        if ($user->role !== 'instructor') {
            return response()->json([
                'success' => false,
                'message' => 'Only instructors can access this endpoint',
            ], 403);
        }

        $courses = Course::where('created_by', $user->id)
            ->withCount(['enrollments', 'lessons', 'quizzes'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'courses' => $courses,
        ]);
    }

    // Create course (for instructors)
    public function store(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'instructor') {
            return response()->json([
                'success' => false,
                'message' => 'Only instructors can create courses',
            ], 403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'short_description' => 'required|string|max:500',
            'description' => 'required|string',
            'category' => 'required|string|max:100',
            'difficulty' => 'required|in:beginner,intermediate,advanced',
            'thumbnail' => 'nullable|url',
            'is_published' => 'boolean',
        ]);

        $course = Course::create([
            'title' => $request->title,
            'short_description' => $request->short_description,
            'description' => $request->description,
            'category' => $request->category,
            'difficulty' => $request->difficulty,
            'thumbnail' => $request->thumbnail,
            'created_by' => $user->id,
            'is_published' => $request->is_published ?? false,
            'approval_status' => 'pending', // Set to pending by default
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Course created successfully and is pending approval',
            'course' => $course,
        ], 201);
    }

    // Update course (for instructors)
    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $course = Course::findOrFail($id);

        if ($course->created_by !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only update your own courses',
            ], 403);
        }

        $request->validate([
            'title' => 'sometimes|string|max:255',
            'short_description' => 'sometimes|string|max:500',
            'description' => 'sometimes|string',
            'category' => 'sometimes|string|max:100',
            'difficulty' => 'sometimes|in:beginner,intermediate,advanced',
            'thumbnail' => 'nullable|url',
            'is_published' => 'boolean',
        ]);

        $course->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Course updated successfully',
            'course' => $course,
        ]);
    }

    // Delete course (for instructors)
    public function destroy($id)
    {
        $user = Auth::user();
        $course = Course::findOrFail($id);

        if ($course->created_by !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only delete your own courses',
            ], 403);
        }

        $course->delete();

        return response()->json([
            'success' => true,
            'message' => 'Course deleted successfully',
        ]);
    }
}
