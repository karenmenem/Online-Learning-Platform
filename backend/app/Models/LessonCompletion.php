<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LessonCompletion extends Model
{
    use HasFactory;

    protected $fillable = [
        'lesson_id',
        'user_id',
        'completed_at',
        'time_spent',
    ];

    protected $casts = [
        'completed_at' => 'datetime',
    ];

    // Relationships
    public function lesson()
    {
        return $this->belongsTo(Lesson::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
