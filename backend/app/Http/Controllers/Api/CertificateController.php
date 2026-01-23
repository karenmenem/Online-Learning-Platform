<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Course;
use App\Models\LessonCompletion;
use App\Models\QuizAttempt;
use Illuminate\Support\Facades\Auth;
use Barryvdh\DomPDF\Facade\Pdf;

class CertificateController extends Controller
{
    // Check and generate certificate if course is completed
    public function checkAndGenerate($courseId)
    {
        $userId = Auth::id();
        $course = Course::findOrFail($courseId);

        // Check if certificate already exists - if yes, return it (permanent)
        $existingCert = Certificate::where('user_id', $userId)
            ->where('course_id', $courseId)
            ->first();

        if ($existingCert) {
            return response()->json([
                'success' => true,
                'certificate' => $existingCert,
                'message' => 'You already earned this certificate!',
                'already_issued' => true
            ]);
        }

        // Check if all lessons are completed
        $totalLessons = $course->lessons()->count();
        
        if ($totalLessons === 0) {
            return response()->json([
                'success' => false,
                'message' => 'This course has no lessons yet'
            ]);
        }

        $completedLessons = LessonCompletion::where('user_id', $userId)
            ->whereHas('lesson', function ($query) use ($courseId) {
                $query->where('course_id', $courseId);
            })
            ->count();

        if ($completedLessons < $totalLessons) {
            return response()->json([
                'success' => false,
                'message' => 'Complete all lessons to earn certificate',
                'completed' => $completedLessons,
                'total' => $totalLessons
            ]);
        }

        // Check if all quizzes are passed
        $quizzes = $course->quizzes;
        
        if ($quizzes->count() === 0) {
            return response()->json([
                'success' => false,
                'message' => 'This course has no quizzes yet'
            ]);
        }

        foreach ($quizzes as $quiz) {
            $bestAttempt = QuizAttempt::where('user_id', $userId)
                ->where('quiz_id', $quiz->id)
                ->orderBy('score', 'desc')
                ->first();

            if (!$bestAttempt || !$bestAttempt->passed) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pass all quizzes to earn certificate'
                ]);
            }
        }

        // Generate certificate
        $certificate = Certificate::create([
            'user_id' => $userId,
            'course_id' => $courseId,
            'issued_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'certificate' => $certificate,
            'message' => 'Congratulations! Certificate earned!',
            'newly_issued' => true
        ]);
    }

    // Get user's certificates
    public function index()
    {
        $certificates = Certificate::with('course')
            ->where('user_id', Auth::id())
            ->orderBy('issued_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'certificates' => $certificates
        ]);
    }

    // Get single certificate
    public function show($id)
    {
        $certificate = Certificate::with(['course', 'user'])
            ->where('user_id', Auth::id())
            ->findOrFail($id);

        return response()->json($certificate);
    }

    // Download certificate as PDF
    public function download($id)
    {
        $certificate = Certificate::with(['course.instructor', 'user'])
            ->where('user_id', Auth::id())
            ->findOrFail($id);

        $data = [
            'student_name' => $certificate->user->name,
            'course_title' => $certificate->course->title,
            'instructor_name' => $certificate->course->instructor->name ?? 'Platform Administrator',
            'issued_date' => $certificate->issued_at->format('F d, Y'),
            'certificate_code' => $certificate->certificate_code ?? $certificate->certificate_number,
        ];

        $pdf = Pdf::loadView('certificates.template', $data)
            ->setPaper('a4', 'landscape');
        
        return $pdf->download('certificate-' . $certificate->certificate_code . '.pdf');
    }

    // Verify certificate by code (public route)
    public function verify($code)
    {
        $certificate = Certificate::with(['course', 'user'])
            ->where('certificate_code', strtoupper($code))
            ->first();

        if (!$certificate) {
            return response()->json([
                'valid' => false,
                'message' => 'Certificate not found',
            ], 404);
        }

        return response()->json([
            'valid' => true,
            'certificate' => [
                'student_name' => $certificate->user->name,
                'course_title' => $certificate->course->title,
                'issued_date' => $certificate->issued_at->format('F d, Y'),
                'certificate_code' => $certificate->certificate_code,
            ],
        ]);
    }
}
