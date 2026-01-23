<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LessonCompletion;
use App\Models\QuizAttempt;
use App\Models\Certificate;
use Illuminate\Support\Facades\Auth;

class StudentController extends Controller
{
    public function getProgress()
    {
        $userId = Auth::id();

        $stats = [
            'lessonsCompleted' => LessonCompletion::where('user_id', $userId)->count(),
            'quizzesTaken' => QuizAttempt::where('user_id', $userId)->distinct('quiz_id')->count('quiz_id'),
            'certificatesEarned' => Certificate::where('user_id', $userId)->count(),
        ];

        return response()->json($stats);
    }
}
