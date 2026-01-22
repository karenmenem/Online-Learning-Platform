<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create test user
        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        // Create instructor user
        User::factory()->create([
            'name' => 'Instructor',
            'email' => 'instructor@example.com',
            'password' => bcrypt('password123'),
            'role' => 'instructor',
        ]);

        // Seed courses
        $this->call([
            CourseSeeder::class,
        ]);
    }
}
