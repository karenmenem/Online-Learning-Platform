<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\QuizAttempt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminController extends Controller
{
    // Get platform statistics
    public function getStats()
    {
        // Check if user is admin
        if (Auth::user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $stats = [
            'totalUsers' => User::count(),
            'students' => User::where('role', 'student')->count(),
            'instructors' => User::where('role', 'instructor')->count(),
            'admins' => User::where('role', 'admin')->count(),
            'totalCourses' => Course::count(),
            'publishedCourses' => Course::where('is_published', true)->count(),
            'draftCourses' => Course::where('is_published', false)->count(),
            'totalEnrollments' => CourseEnrollment::count(),
            'averageEnrollments' => Course::count() > 0 
                ? round(CourseEnrollment::count() / Course::count(), 1)
                : 0,
            'totalQuizAttempts' => QuizAttempt::count(),
        ];

        return response()->json($stats);
    }

    // Get all users
    public function getUsers()
    {
        // Check if user is admin
        if (Auth::user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $users = User::orderBy('created_at', 'desc')->get();
        return response()->json($users);
    }

    // Get all courses with instructor info
    public function getCourses()
    {
        // Check if user is admin
        if (Auth::user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $courses = Course::with('instructor')
            ->withCount('enrollments')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($course) {
                return [
                    'id' => $course->id,
                    'title' => $course->title,
                    'description' => $course->description,
                    'is_published' => $course->is_published,
                    'instructor_name' => $course->instructor->name,
                    'enrollments_count' => $course->enrollments_count,
                    'created_at' => $course->created_at,
                    'updated_at' => $course->updated_at,
                ];
            });

        return response()->json($courses);
    }

    // Update user role
    public function updateUserRole(Request $request, $userId)
    {
        // Check if user is admin
        if (Auth::user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'role' => 'required|in:student,instructor,admin',
        ]);

        $user = User::findOrFail($userId);
        
        // Prevent admin from changing their own role
        if ($user->id === Auth::id()) {
            return response()->json(['message' => 'Cannot change your own role'], 400);
        }

        $user->role = $request->role;
        $user->save();

        return response()->json(['message' => 'User role updated successfully', 'user' => $user]);
    }

    // Delete user
    public function deleteUser($userId)
    {
        // Check if user is admin
        if (Auth::user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $user = User::findOrFail($userId);
        
        // Prevent admin from deleting themselves
        if ($user->id === Auth::id()) {
            return response()->json(['message' => 'Cannot delete your own account'], 400);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }

    // Delete course
    public function deleteCourse($courseId)
    {
        // Check if user is admin
        if (Auth::user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $course = Course::findOrFail($courseId);
        $course->delete();

        return response()->json(['message' => 'Course deleted successfully']);
    }
}
