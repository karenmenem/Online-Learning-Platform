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
            'pendingApproval' => Course::where('approval_status', 'pending')->count(),
            'approvedCourses' => Course::where('approval_status', 'approved')->count(),
            'rejectedCourses' => Course::where('approval_status', 'rejected')->count(),
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
                    'approval_status' => $course->approval_status,
                    'rejection_reason' => $course->rejection_reason,
                    'approved_at' => $course->approved_at,
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

   
    public function deleteUser($userId)
    {
        
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

    
    public function deleteCourse($courseId)
    {
        
        if (Auth::user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $course = Course::findOrFail($courseId);
        $course->delete();

        return response()->json(['message' => 'Course deleted successfully']);
    }

   
    public function approveCourse($courseId)
    {
        
        if (Auth::user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $course = Course::findOrFail($courseId);

        if ($course->approval_status === 'approved') {
            return response()->json(['message' => 'Course is already approved'], 400);
        }

        $course->update([
            'approval_status' => 'approved',
            'approved_at' => now(),
            'approved_by' => Auth::id(),
            'rejection_reason' => null, 
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Course approved successfully',
            'course' => $course->fresh()->load('instructor'),
        ]);
    }

    
    public function rejectCourse(Request $request, $courseId)
    {
        
        if (Auth::user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'rejection_reason' => 'required|string|max:1000',
        ]);

        $course = Course::findOrFail($courseId);

        if ($course->approval_status === 'rejected') {
            return response()->json(['message' => 'Course is already rejected'], 400);
        }

        $course->update([
            'approval_status' => 'rejected',
            'rejection_reason' => $request->rejection_reason,
            'approved_at' => null,
            'approved_by' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Course rejected',
            'course' => $course->fresh()->load('instructor'),
        ]);
    }

    // pending courses
    public function getPendingCourses()
    {
       
        if (Auth::user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $courses = Course::with('instructor')
            ->where('approval_status', 'pending')
            ->withCount('enrollments')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'courses' => $courses,
        ]);
    }
}
