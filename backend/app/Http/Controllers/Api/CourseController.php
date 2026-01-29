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
    // get published courses
    public function index(Request $request)
    {
        $query = Course::with('instructor:id,name')
            ->where('is_published', true)
            ->where('approval_status', 'approved'); 

        
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

        
        if ($request->has('difficulty') && $request->difficulty) {
            $query->where('difficulty', strtolower($request->difficulty));
        }

        
        if ($request->has('instructor') && $request->instructor) {
            $query->where('created_by', $request->instructor);
        }

        $courses = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'courses' => $courses,
        ]);
    }

    // get course details
    public function show($id)
    {
        $course = Course::with(['instructor:id,name', 'lessons', 'quizzes'])
            ->findOrFail($id);

        
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

    // enroll 
    public function enroll($id)
    {
        $user = Auth::user();
        $course = Course::findOrFail($id);

        // check if alr enrolled
        $existingEnrollment = CourseEnrollment::where('user_id', $user->id)
            ->where('course_id', $id)
            ->first();

        if ($existingEnrollment) {
            return response()->json([
                'success' => false,
                'message' => 'You are already enrolled in this course',
            ], 400);
        }

       
        if ($user->role !== 'student') {
            return response()->json([
                'success' => false,
                'message' => 'Only students can enroll in courses',
            ], 403);
        }

        
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

    // get enrolled courses
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

    // create course
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
            'thumbnail' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'thumbnail_url' => 'nullable|url',
            'is_published' => 'boolean',
        ]);

        $thumbnailPath = null;
        
        
        if ($request->hasFile('thumbnail')) {
            $thumbnailPath = $request->file('thumbnail')->store('thumbnails', 'public');
            $thumbnailPath = '/storage/' . $thumbnailPath;
        } elseif ($request->thumbnail_url) {
            
            $thumbnailPath = $request->thumbnail_url;
        }

        $course = Course::create([
            'title' => $request->title,
            'short_description' => $request->short_description,
            'description' => $request->description,
            'category' => $request->category,
            'difficulty' => $request->difficulty,
            'thumbnail' => $thumbnailPath,
            'created_by' => $user->id,
            'is_published' => $request->is_published ?? false,
            'approval_status' => 'pending', 
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Course created successfully and is pending approval',
            'course' => $course,
        ], 201);
    }

    // update course
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
            'thumbnail' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'thumbnail_url' => 'nullable|url',
            'is_published' => 'boolean',
        ]);

        $updateData = $request->except(['thumbnail', 'thumbnail_url']);
        
        // Handle file upload
        if ($request->hasFile('thumbnail')) {
            // Delete old thumbnail if exists
            if ($course->thumbnail && strpos($course->thumbnail, '/storage/') === 0) {
                \Storage::disk('public')->delete(str_replace('/storage/', '', $course->thumbnail));
            }
            
            $thumbnailPath = $request->file('thumbnail')->store('thumbnails', 'public');
            $updateData['thumbnail'] = '/storage/' . $thumbnailPath;
        } elseif ($request->has('thumbnail_url')) {
            // Use URL if provided
            $updateData['thumbnail'] = $request->thumbnail_url;
        }

        $course->update($updateData);

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
