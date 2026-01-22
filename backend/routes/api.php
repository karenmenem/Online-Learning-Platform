<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\LessonController;
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
});
