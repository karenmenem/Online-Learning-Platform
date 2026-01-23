<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CertificateController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\LessonController;
use App\Http\Controllers\Api\ProgressController;
use App\Http\Controllers\Api\QuizController;
use App\Http\Controllers\Api\QuestionController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/student/stats', [AuthController::class, 'getStudentStats']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Course routes
    Route::get('/courses', [CourseController::class, 'index']);
    Route::get('/courses/{id}', [CourseController::class, 'show']);
    Route::post('/courses/{id}/enroll', [CourseController::class, 'enroll']);
    Route::get('/my-courses', [CourseController::class, 'myEnrolledCourses']);
    Route::get('/courses/{id}/progress', [CourseController::class, 'courseProgress']);

    // Lesson routes
    Route::get('/courses/{courseId}/lessons', [LessonController::class, 'index']);
    Route::get('/courses/{courseId}/lessons/{lessonId}', [LessonController::class, 'show']);
    Route::post('/courses/{courseId}/lessons/{lessonId}/complete', [LessonController::class, 'markComplete']);
    Route::delete('/courses/{courseId}/lessons/{lessonId}/complete', [LessonController::class, 'markIncomplete']);

    // Instructor routes
    Route::get('/instructor/courses', [CourseController::class, 'myCourses']);
    Route::post('/instructor/courses', [CourseController::class, 'store']);
    Route::put('/instructor/courses/{id}', [CourseController::class, 'update']);
    Route::delete('/instructor/courses/{id}', [CourseController::class, 'destroy']);
    
    // Instructor lesson management
    Route::post('/instructor/courses/{courseId}/lessons', [LessonController::class, 'store']);
    Route::put('/instructor/courses/{courseId}/lessons/{lessonId}', [LessonController::class, 'update']);
    Route::delete('/instructor/courses/{courseId}/lessons/{lessonId}', [LessonController::class, 'destroy']);

    // Quiz routes (Student)
    Route::get('/courses/{courseId}/quizzes', [QuizController::class, 'index']);
    Route::get('/courses/{courseId}/quizzes/{quizId}', [QuizController::class, 'show']);
    Route::post('/courses/{courseId}/quizzes/{quizId}/submit', [QuizController::class, 'submitAttempt']);
    Route::get('/courses/{courseId}/quizzes/{quizId}/attempts', [QuizController::class, 'getAttempts']);
    Route::get('/courses/{courseId}/quizzes/{quizId}/attempts/{attemptId}', [QuizController::class, 'getAttempt']);

    // Quiz management (Instructor)
    Route::post('/instructor/courses/{courseId}/quizzes', [QuizController::class, 'store']);
    Route::put('/instructor/courses/{courseId}/quizzes/{quizId}', [QuizController::class, 'update']);
    Route::delete('/instructor/courses/{courseId}/quizzes/{quizId}', [QuizController::class, 'destroy']);
    Route::get('/instructor/courses/{courseId}/quizzes/{quizId}/statistics', [QuizController::class, 'getStatistics']);

    // Question management (Instructor)
    Route::get('/instructor/courses/{courseId}/quizzes/{quizId}/questions', [QuestionController::class, 'index']);
    Route::post('/instructor/courses/{courseId}/quizzes/{quizId}/questions', [QuestionController::class, 'store']);
    Route::put('/instructor/courses/{courseId}/quizzes/{quizId}/questions/{questionId}', [QuestionController::class, 'update']);
    Route::delete('/instructor/courses/{courseId}/quizzes/{quizId}/questions/{questionId}', [QuestionController::class, 'destroy']);

    // Certificate routes
    Route::get('/courses/{courseId}/certificate/check', [CertificateController::class, 'checkAndGenerate']);
    Route::get('/certificates', [CertificateController::class, 'index']);
    Route::get('/certificates/{id}', [CertificateController::class, 'show']);
    Route::get('/certificates/{id}/download', [CertificateController::class, 'download']);

    // Progress Analytics routes
    Route::get('/progress/analytics', [ProgressController::class, 'getOverallAnalytics']);
    Route::get('/progress/courses/{courseId}/analytics', [ProgressController::class, 'getCourseAnalytics']);

    // Admin routes
    Route::get('/admin/stats', [AdminController::class, 'getStats']);
    Route::get('/admin/users', [AdminController::class, 'getUsers']);
    Route::get('/admin/courses', [AdminController::class, 'getCourses']);
    Route::put('/admin/users/{userId}/role', [AdminController::class, 'updateUserRole']);
    Route::delete('/admin/users/{userId}', [AdminController::class, 'deleteUser']);
    Route::delete('/admin/courses/{courseId}', [AdminController::class, 'deleteCourse']);
});

// Public certificate verification route (no auth required)
Route::get('/certificates/verify/{code}', [CertificateController::class, 'verify']);
