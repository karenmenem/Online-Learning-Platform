<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\User;
use Illuminate\Database\Seeder;

class CourseSeeder extends Seeder
{
    public function run(): void
    {
        // Create an instructor user if one doesn't exist
        $instructor = User::firstOrCreate(
            ['email' => 'instructor@example.com'],
            [
                'name' => 'John Instructor',
                'password' => bcrypt('password123'),
                'role' => 'instructor',
            ]
        );

        // Sample courses
        $courses = [
            [
                'title' => 'Introduction to Web Development',
                'short_description' => 'Learn the basics of HTML, CSS, and JavaScript',
                'description' => 'This comprehensive course covers the fundamentals of web development. You will learn HTML for structure, CSS for styling, and JavaScript for interactivity. Perfect for beginners who want to start their web development journey.',
                'category' => 'Web Development',
                'difficulty' => 'beginner',
                'thumbnail' => 'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
                'created_by' => $instructor->id,
                'is_published' => true,
            ],
            [
                'title' => 'Advanced React & Redux',
                'short_description' => 'Master React hooks, Redux state management, and modern patterns',
                'description' => 'Take your React skills to the next level with this advanced course. Learn React hooks, Redux for state management, performance optimization, and best practices for building scalable applications.',
                'category' => 'Frontend Development',
                'difficulty' => 'advanced',
                'thumbnail' => 'https://images.unsplash.com/photo-1633356122544-f134324a6cee',
                'created_by' => $instructor->id,
                'is_published' => true,
            ],
            [
                'title' => 'Python for Data Science',
                'short_description' => 'Learn Python, pandas, NumPy, and data visualization',
                'description' => 'Discover the power of Python for data analysis. This course covers Python basics, pandas for data manipulation, NumPy for numerical computing, and matplotlib for data visualization.',
                'category' => 'Data Science',
                'difficulty' => 'intermediate',
                'thumbnail' => 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5',
                'created_by' => $instructor->id,
                'is_published' => true,
            ],
            [
                'title' => 'Mobile App Development with Flutter',
                'short_description' => 'Build beautiful cross-platform mobile apps',
                'description' => 'Learn to build stunning mobile applications for both iOS and Android using Flutter. This course covers Dart programming, Flutter widgets, state management, and API integration.',
                'category' => 'Mobile Development',
                'difficulty' => 'intermediate',
                'thumbnail' => 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c',
                'created_by' => $instructor->id,
                'is_published' => true,
            ],
            [
                'title' => 'Database Design & SQL Mastery',
                'short_description' => 'Master database design, SQL queries, and optimization',
                'description' => 'Become proficient in database design and SQL. Learn to design efficient database schemas, write complex queries, optimize performance, and work with MySQL, PostgreSQL, and more.',
                'category' => 'Database',
                'difficulty' => 'intermediate',
                'thumbnail' => 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d',
                'created_by' => $instructor->id,
                'is_published' => true,
            ],
            [
                'title' => 'Machine Learning Fundamentals',
                'short_description' => 'Introduction to ML algorithms and practical applications',
                'description' => 'Start your machine learning journey with this beginner-friendly course. Learn about supervised and unsupervised learning, regression, classification, and practical ML applications.',
                'category' => 'Artificial Intelligence',
                'difficulty' => 'beginner',
                'thumbnail' => 'https://images.unsplash.com/photo-1555949963-aa79dcee981c',
                'created_by' => $instructor->id,
                'is_published' => true,
            ],
        ];

        foreach ($courses as $courseData) {
            Course::create($courseData);
        }
    }
}

