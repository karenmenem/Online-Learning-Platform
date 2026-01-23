<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\LessonCompletion;
use App\Models\QuizAttempt;
use App\Models\Certificate;
use App\Models\CourseEnrollment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'sometimes|in:student,instructor,admin',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role ?? 'student',
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'User registered successfully',
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
        ]);
    }

    public function me(Request $request)
    {
        return response()->json([
            'success' => true,
            'user' => $request->user(),
        ]);
    }

    public function getStudentStats(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'student') {
            return response()->json([
                'success' => false,
                'message' => 'Only students can access this endpoint',
            ], 403);
        }

        $stats = [
            'enrolledCourses' => CourseEnrollment::where('user_id', $user->id)->count(),
            'lessonsCompleted' => LessonCompletion::where('user_id', $user->id)->count(),
            'quizzesTaken' => QuizAttempt::where('user_id', $user->id)->distinct('quiz_id')->count('quiz_id'),
            'certificatesEarned' => Certificate::where('user_id', $user->id)->count(),
        ];

        return response()->json([
            'success' => true,
            'stats' => $stats,
        ]);
    }
}
