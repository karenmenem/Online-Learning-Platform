<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonCompletion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LessonController extends Controller
{
    
    public function index($courseId)
    {
        $course = Course::findOrFail($courseId);
        $lessons = $course->lessons()->orderBy('order')->get();

        // Add completion status if user is a student
        if (Auth::check() && Auth::user()->role === 'student') {
            $userId = Auth::id();
            $lessons->each(function ($lesson) use ($userId) {
                $lesson->is_completed = LessonCompletion::where('lesson_id', $lesson->id)
                    ->where('user_id', $userId)
                    ->exists();
            });
        }

        return response()->json([
            'success' => true,
            'lessons' => $lessons,
        ]);
    }

    // Get single lesson
    public function show($courseId, $lessonId)
    {
        $lesson = Lesson::where('course_id', $courseId)
            ->findOrFail($lessonId);

        // Check if completed
        if (Auth::check() && Auth::user()->role === 'student') {
            $lesson->is_completed = LessonCompletion::where('lesson_id', $lesson->id)
                ->where('user_id', Auth::id())
                ->exists();
        }

        return response()->json([
            'success' => true,
            'lesson' => $lesson,
        ]);
    }

    // Create lesson 
    public function store(Request $request, $courseId)
    {
        $user = Auth::user();
        $course = Course::findOrFail($courseId);

        
        if ($course->created_by !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only add lessons to your own courses',
            ], 403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'nullable|string',
            'video_url' => 'nullable|url',
            'order' => 'required|integer|min:1',
            'estimated_duration' => 'nullable|integer|min:1',
        ]);

        $lesson = Lesson::create([
            'course_id' => $courseId,
            'title' => $request->title,
            'content' => $request->content,
            'video_url' => $request->video_url,
            'order' => $request->order,
            'estimated_duration' => $request->estimated_duration,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Lesson created successfully',
            'lesson' => $lesson,
        ], 201);
    }

    // Update lesson 
    public function update(Request $request, $courseId, $lessonId)
    {
        $user = Auth::user();
        $course = Course::findOrFail($courseId);
        $lesson = Lesson::where('course_id', $courseId)->findOrFail($lessonId);

        
        if ($course->created_by !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only update lessons in your own courses',
            ], 403);
        }

        $request->validate([
            'title' => 'sometimes|string|max:255',
            'content' => 'nullable|string',
            'video_url' => 'nullable|url',
            'order' => 'sometimes|integer|min:1',
            'estimated_duration' => 'nullable|integer|min:1',
        ]);

        $lesson->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Lesson updated successfully',
            'lesson' => $lesson,
        ]);
    }

    // Delete 
    public function destroy($courseId, $lessonId)
    {
        $user = Auth::user();
        $course = Course::findOrFail($courseId);
        $lesson = Lesson::where('course_id', $courseId)->findOrFail($lessonId);

       
        if ($course->created_by !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only delete lessons from your own courses',
            ], 403);
        }

        $lesson->delete();

        return response()->json([
            'success' => true,
            'message' => 'Lesson deleted successfully',
        ]);
    }

    
    public function markComplete($courseId, $lessonId)
    {
        $user = Auth::user();

        if ($user->role !== 'student') {
            return response()->json([
                'success' => false,
                'message' => 'Only students can mark lessons as complete',
            ], 403);
        }

        $lesson = Lesson::where('course_id', $courseId)->findOrFail($lessonId);

        // Check if already completed
        $existing = LessonCompletion::where('lesson_id', $lessonId)
            ->where('user_id', $user->id)
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Lesson already marked as complete',
            ], 400);
        }

        LessonCompletion::create([
            'lesson_id' => $lessonId,
            'user_id' => $user->id,
        ]);

        // Update 
        $this->updateCourseProgress($courseId, $user->id);

        return response()->json([
            'success' => true,
            'message' => 'Lesson marked as complete',
        ]);
    }

    
    public function markIncomplete($courseId, $lessonId)
    {
        $user = Auth::user();

        if ($user->role !== 'student') {
            return response()->json([
                'success' => false,
                'message' => 'Only students can mark lessons as incomplete',
            ], 403);
        }

        LessonCompletion::where('lesson_id', $lessonId)
            ->where('user_id', $user->id)
            ->delete();

        // Update course progress
        $this->updateCourseProgress($courseId, $user->id);

        return response()->json([
            'success' => true,
            'message' => 'Lesson marked as incomplete',
        ]);
    }

   
    private function updateCourseProgress($courseId, $userId)
    {
        $course = Course::with('lessons')->findOrFail($courseId);
        $totalLessons = $course->lessons->count();

        if ($totalLessons === 0) {
            return;
        }

        $completedLessons = LessonCompletion::where('user_id', $userId)
            ->whereIn('lesson_id', $course->lessons->pluck('id'))
            ->count();

        $progress = round(($completedLessons / $totalLessons) * 100);

        // Update enrollment progress
        \App\Models\CourseEnrollment::where('course_id', $courseId)
            ->where('user_id', $userId)
            ->update(['progress' => $progress]);
    }
}
