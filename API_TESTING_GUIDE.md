# API Testing Guide - Quick Reference

## Server Status
- **Backend**: http://localhost:8000
- **Frontend**: http://localhost:3000

## Testing Tools
- **curl** (command line)
- **Postman** (GUI)
- **Insomnia** (GUI)
- Browser DevTools Network tab

---

## Common curl Commands

### 1. Register New User
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "name": "Test Student",
    "email": "student@test.com",
    "password": "password123",
    "password_confirmation": "password123",
    "role": "student"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "email": "student@test.com",
    "password": "password123"
  }'
```
**Response:** Save the `token` from response for authenticated requests

### 3. Get Authenticated User (requires token)
```bash
curl -X GET http://localhost:8000/api/auth/me \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Get All Courses (public)
```bash
curl -X GET http://localhost:8000/api/courses \
  -H "Accept: application/json"
```

### 5. Search & Filter Courses
```bash
# Search by title
curl -X GET "http://localhost:8000/api/courses?search=React" \
  -H "Accept: application/json"

# Filter by category
curl -X GET "http://localhost:8000/api/courses?category=Programming" \
  -H "Accept: application/json"

# Filter by difficulty
curl -X GET "http://localhost:8000/api/courses?difficulty=beginner" \
  -H "Accept: application/json"

# Combine filters
curl -X GET "http://localhost:8000/api/courses?search=Web&category=Programming&difficulty=intermediate" \
  -H "Accept: application/json"
```

### 6. Get Course Details
```bash
curl -X GET http://localhost:8000/api/courses/1 \
  -H "Accept: application/json"
```

### 7. Enroll in Course (requires authentication)
```bash
curl -X POST http://localhost:8000/api/courses/1/enroll \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 8. Get My Enrolled Courses
```bash
curl -X GET http://localhost:8000/api/my-enrolled-courses \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 9. Get Course Progress
```bash
curl -X GET http://localhost:8000/api/courses/1/progress \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 10. Get Course Lessons
```bash
curl -X GET http://localhost:8000/api/courses/1/lessons \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 11. Mark Lesson Complete
```bash
curl -X POST http://localhost:8000/api/lessons/1/complete \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "time_spent": 300
  }'
```

### 12. Get Lesson Quizzes
```bash
curl -X GET http://localhost:8000/api/lessons/1/quizzes \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 13. Submit Quiz Attempt
```bash
curl -X POST http://localhost:8000/api/quizzes/1/submit \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": {
      "1": [1],
      "2": [3],
      "3": [2, 4]
    }
  }'
```

### 14. Check Certificate Eligibility
```bash
curl -X GET http://localhost:8000/api/certificates/check/1 \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 15. Get My Certificates
```bash
curl -X GET http://localhost:8000/api/certificates \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 16. Download Certificate PDF
```bash
curl -X GET http://localhost:8000/api/certificates/1/download \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  --output certificate.pdf
```

### 17. Get Overall Analytics
```bash
curl -X GET http://localhost:8000/api/progress/analytics \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 18. Get Course Analytics
```bash
curl -X GET http://localhost:8000/api/progress/courses/1/analytics \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Instructor Endpoints

### 19. Create Course (instructor only)
```bash
curl -X POST http://localhost:8000/api/instructor/courses \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_INSTRUCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Advanced React Patterns",
    "description": "Learn advanced React patterns and best practices",
    "category": "Programming",
    "difficulty": "advanced",
    "thumbnail_url": "https://example.com/thumbnail.jpg",
    "is_published": true
  }'
```

### 20. Update Course
```bash
curl -X PUT http://localhost:8000/api/instructor/courses/1 \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_INSTRUCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Course Title",
    "description": "Updated description"
  }'
```

### 21. Delete Course
```bash
curl -X DELETE http://localhost:8000/api/instructor/courses/1 \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_INSTRUCTOR_TOKEN"
```

### 22. Create Lesson
```bash
curl -X POST http://localhost:8000/api/instructor/lessons \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_INSTRUCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "course_id": 1,
    "title": "Introduction to React Hooks",
    "content": "Learn about useState, useEffect, and custom hooks",
    "video_url": "https://youtube.com/watch?v=abc123",
    "duration": 1200,
    "order": 1
  }'
```

### 23. Create Quiz
```bash
curl -X POST http://localhost:8000/api/instructor/quizzes \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_INSTRUCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lesson_id": 1,
    "title": "React Hooks Quiz",
    "description": "Test your knowledge of React Hooks",
    "passing_score": 80,
    "time_limit": 1800
  }'
```

### 24. Create Question
```bash
curl -X POST http://localhost:8000/api/instructor/questions \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_INSTRUCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quiz_id": 1,
    "question_text": "What is the purpose of useState?",
    "question_type": "multiple_choice",
    "points": 10,
    "order": 1,
    "answers": [
      {"answer_text": "To manage component state", "is_correct": true},
      {"answer_text": "To fetch data", "is_correct": false},
      {"answer_text": "To style components", "is_correct": false},
      {"answer_text": "To create routes", "is_correct": false}
    ]
  }'
```

---

## Admin Endpoints

### 25. Get Dashboard Stats (admin only)
```bash
curl -X GET http://localhost:8000/api/admin/stats \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 26. Get All Users
```bash
curl -X GET http://localhost:8000/api/admin/users \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 27. Update User Role
```bash
curl -X PUT http://localhost:8000/api/admin/users/1/role \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "instructor"
  }'
```

### 28. Delete User
```bash
curl -X DELETE http://localhost:8000/api/admin/users/1 \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## Testing Workflow

### Scenario 1: Student Journey
1. Register as student
2. Login and get token
3. Browse courses (search/filter)
4. Enroll in a course
5. View course lessons
6. Complete lessons
7. Take quizzes
8. Check certificate eligibility
9. Download certificate
10. View overall analytics

### Scenario 2: Instructor Journey
1. Register as instructor
2. Login and get token
3. Create a course
4. Add lessons to course
5. Create quizzes for lessons
6. Add questions to quizzes
7. Publish course
8. View enrolled students

### Scenario 3: Admin Journey
1. Login as admin
2. View dashboard stats
3. Manage users (view, update roles)
4. View all courses
5. Delete inactive users
6. Monitor platform activity

---

## Expected Response Codes

- **200 OK**: Successful GET request
- **201 Created**: Successful POST request (resource created)
- **204 No Content**: Successful DELETE request
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Missing or invalid token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **422 Unprocessable Entity**: Validation errors
- **500 Internal Server Error**: Server error

---

## Common Error Responses

### Unauthenticated
```json
{
  "success": false,
  "message": "Unauthenticated."
}
```

### Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": ["The email field is required."],
    "password": ["The password must be at least 8 characters."]
  }
}
```

### Not Found
```json
{
  "success": false,
  "message": "Course not found"
}
```

### Forbidden
```json
{
  "success": false,
  "message": "You do not have permission to perform this action"
}
```

---

## Tips for Testing

1. **Always include Accept header**: `Accept: application/json`
2. **Store token after login**: Use it in Authorization header for protected routes
3. **Use proper HTTP methods**: GET for reading, POST for creating, PUT/PATCH for updating, DELETE for deleting
4. **Check response status codes**: They indicate success or failure type
5. **Validate data**: Test with both valid and invalid data
6. **Test edge cases**: Empty strings, null values, very long text
7. **Test permissions**: Try accessing resources you shouldn't have access to
8. **Monitor logs**: Check `storage/logs/laravel.log` for errors

---

## Debugging

### Check Laravel Logs
```bash
cd backend
tail -f storage/logs/laravel.log
```

### Clear Cache
```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
```

### Restart Server
```bash
# Stop (Ctrl+C), then:
php artisan serve
```

### Test Database Connection
```bash
php artisan db:show
```

---

## Postman Collection

For easier testing, you can import all these endpoints into Postman:

1. Create a new Collection
2. Add Environment variables:
   - `base_url`: http://localhost:8000
   - `token`: (will be set after login)
3. Import all endpoints from above
4. Use `{{base_url}}` and `{{token}}` variables
5. Set token automatically using Postman Tests tab on login request:
   ```javascript
   pm.environment.set("token", pm.response.json().token);
   ```
