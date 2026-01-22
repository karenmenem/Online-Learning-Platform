<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Question;
use App\Models\Answer;
use App\Models\Quiz;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class QuestionController extends Controller
{
    // Get all questions for a quiz
    public function index($courseId, $quizId)
    {
        $questions = Question::where('quiz_id', $quizId)
            ->with('answers')
            ->orderBy('order')
            ->get();

        return response()->json(['questions' => $questions]);
    }

    // Create question with answers
    public function store(Request $request, $courseId, $quizId)
    {
        $validated = $request->validate([
            'question_text' => 'required|string',
            'question_type' => 'required|in:multiple_choice,multiple_select,true_false',
            'points' => 'nullable|integer|min:1',
            'order' => 'nullable|integer|min:1',
            'answers' => 'required|array|min:2',
            'answers.*.answer_text' => 'required|string',
            'answers.*.is_correct' => 'required|boolean',
        ]);

        // Verify quiz belongs to instructor's course
        $quiz = Quiz::where('id', $quizId)
            ->where('course_id', $courseId)
            ->firstOrFail();
        
        $course = Course::where('id', $courseId)
            ->where('instructor_id', Auth::id())
            ->firstOrFail();

        // Validate answer correctness based on question type
        $correctCount = collect($validated['answers'])->where('is_correct', true)->count();
        
        if ($validated['question_type'] === 'true_false' && count($validated['answers']) !== 2) {
            return response()->json(['error' => 'True/False questions must have exactly 2 answers'], 422);
        }
        
        if ($validated['question_type'] === 'multiple_choice' && $correctCount !== 1) {
            return response()->json(['error' => 'Multiple choice questions must have exactly 1 correct answer'], 422);
        }
        
        if ($validated['question_type'] === 'multiple_select' && $correctCount < 1) {
            return response()->json(['error' => 'Multiple select questions must have at least 1 correct answer'], 422);
        }

        DB::beginTransaction();
        try {
            // Create question
            $question = Question::create([
                'quiz_id' => $quizId,
                'question_text' => $validated['question_text'],
                'question_type' => $validated['question_type'],
                'points' => $validated['points'] ?? 1,
                'order' => $validated['order'] ?? Question::where('quiz_id', $quizId)->max('order') + 1,
            ]);

            // Create answers
            foreach ($validated['answers'] as $answerData) {
                Answer::create([
                    'question_id' => $question->id,
                    'answer_text' => $answerData['answer_text'],
                    'is_correct' => $answerData['is_correct'],
                ]);
            }

            DB::commit();

            $question->load('answers');
            return response()->json(['question' => $question], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to create question'], 500);
        }
    }

    // Update question and answers
    public function update(Request $request, $courseId, $quizId, $questionId)
    {
        $validated = $request->validate([
            'question_text' => 'required|string',
            'question_type' => 'required|in:multiple_choice,multiple_select,true_false',
            'points' => 'nullable|integer|min:1',
            'order' => 'nullable|integer|min:1',
            'answers' => 'required|array|min:2',
            'answers.*.id' => 'nullable|exists:answers,id',
            'answers.*.answer_text' => 'required|string',
            'answers.*.is_correct' => 'required|boolean',
        ]);

        // Verify quiz belongs to instructor's course
        $quiz = Quiz::where('id', $quizId)
            ->where('course_id', $courseId)
            ->firstOrFail();
        
        $course = Course::where('id', $courseId)
            ->where('instructor_id', Auth::id())
            ->firstOrFail();

        $question = Question::where('quiz_id', $quizId)
            ->findOrFail($questionId);

        // Validate answer correctness based on question type
        $correctCount = collect($validated['answers'])->where('is_correct', true)->count();
        
        if ($validated['question_type'] === 'true_false' && count($validated['answers']) !== 2) {
            return response()->json(['error' => 'True/False questions must have exactly 2 answers'], 422);
        }
        
        if ($validated['question_type'] === 'multiple_choice' && $correctCount !== 1) {
            return response()->json(['error' => 'Multiple choice questions must have exactly 1 correct answer'], 422);
        }
        
        if ($validated['question_type'] === 'multiple_select' && $correctCount < 1) {
            return response()->json(['error' => 'Multiple select questions must have at least 1 correct answer'], 422);
        }

        DB::beginTransaction();
        try {
            // Update question
            $question->update([
                'question_text' => $validated['question_text'],
                'question_type' => $validated['question_type'],
                'points' => $validated['points'] ?? 1,
                'order' => $validated['order'] ?? $question->order,
            ]);

            // Delete old answers that are not in the new set
            $newAnswerIds = collect($validated['answers'])->pluck('id')->filter();
            Answer::where('question_id', $questionId)
                ->whereNotIn('id', $newAnswerIds)
                ->delete();

            // Update or create answers
            foreach ($validated['answers'] as $answerData) {
                if (isset($answerData['id'])) {
                    Answer::where('id', $answerData['id'])
                        ->update([
                            'answer_text' => $answerData['answer_text'],
                            'is_correct' => $answerData['is_correct'],
                        ]);
                } else {
                    Answer::create([
                        'question_id' => $question->id,
                        'answer_text' => $answerData['answer_text'],
                        'is_correct' => $answerData['is_correct'],
                    ]);
                }
            }

            DB::commit();

            $question->load('answers');
            return response()->json(['question' => $question]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to update question'], 500);
        }
    }

    // Delete question
    public function destroy($courseId, $quizId, $questionId)
    {
        // Verify quiz belongs to instructor's course
        $quiz = Quiz::where('id', $quizId)
            ->where('course_id', $courseId)
            ->firstOrFail();
        
        $course = Course::where('id', $courseId)
            ->where('instructor_id', Auth::id())
            ->firstOrFail();

        $question = Question::where('quiz_id', $quizId)
            ->findOrFail($questionId);

        $question->delete();

        return response()->json(['message' => 'Question deleted successfully']);
    }
}
