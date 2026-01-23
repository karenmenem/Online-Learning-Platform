# Quiz Learning Platform - Testing Checklist

## Critical Fix Applied
✅ **Fixed 500 Error**: Updated `/backend/bootstrap/app.php` to return JSON responses for API authentication failures instead of trying to redirect to non-existent 'login' route.

---

## Test Results Summary

### ✅ Completed Tests
- [x] Laravel server running on port 8000
- [x] API routes properly registered (42+ endpoints verified)
- [x] Database migrations all successful (15 tables)
- [x] API authentication error handling (returns JSON 401)
- [x] Password hashing with bcrypt (verified in AuthController)

---

## Manual Testing Checklist

### 1. Backend API Testing

#### Authentication Endpoints (/api/auth)
- [ ] **POST /api/auth/register** - Create new user
  - Test with student role
  - Test with instructor role
  - Test password validation (min 8 chars)
  - Test duplicate email
  
- [ ] **POST /api/auth/login** - User login
  - Test with valid credentials
  - Test with invalid credentials
  - Test rate limiting
  - Verify token generation
  
- [ ] **POST /api/auth/logout** - User logout
  - Test with valid token
  - Test without token
  
- [ ] **GET /api/auth/me** - Get authenticated user
  - Test with valid token
  - Test without token

#### Course Endpoints (/api/courses)
- [ ] **GET /api/courses** - Get all published courses
  - Test without authentication
  - Test search functionality (title, description)
  - Test filter by category
  - Test filter by difficulty (beginner, intermediate, advanced)
  - Test filter by instructor
  - Test pagination
  
- [ ] **GET /api/courses/{id}** - Get course details
  - Test with valid ID
  - Test with invalid ID
  - Test with unpublished course
  
- [ ] **POST /api/courses/{id}/enroll** - Enroll in course
  - Test as authenticated student
  - Test duplicate enrollment
  - Test without authentication
  
- [ ] **GET /api/my-enrolled-courses** - Get user's enrolled courses
  - Test as student
  - Test without courses
  
- [ ] **GET /api/courses/{id}/progress** - Get course progress
  - Test with active enrollment
  - Test without enrollment

#### Instructor Course Management
- [ ] **POST /api/instructor/courses** - Create course
  - Test with all required fields
  - Test with missing fields
  - Test as non-instructor
  
- [ ] **PUT /api/instructor/courses/{id}** - Update course
  - Test updating title, description
  - Test updating difficulty, category
  - Test updating thumbnail_url
  - Test as different instructor
  
- [ ] **DELETE /api/instructor/courses/{id}** - Delete course
  - Test with own course
  - Test with other instructor's course
  - Test with enrolled students

#### Lesson Endpoints
- [ ] **GET /api/courses/{courseId}/lessons** - Get course lessons
  - Test with valid course
  - Test lesson order
  
- [ ] **GET /api/lessons/{id}** - Get lesson details
  - Test with enrolled student
  - Test without enrollment
  
- [ ] **POST /api/lessons/{id}/complete** - Mark lesson complete
  - Test first completion
  - Test re-completion
  - Test time_spent tracking
  
- [ ] **POST /api/lessons/{id}/incomplete** - Mark incomplete
  - Test removing completion

#### Quiz Endpoints
- [ ] **GET /api/lessons/{lessonId}/quizzes** - Get lesson quizzes
  - Test with enrolled student
  - Test question loading
  
- [ ] **GET /api/quizzes/{id}** - Get quiz details
  - Test with questions
  - Test without revealing answers
  
- [ ] **POST /api/quizzes/{id}/submit** - Submit quiz attempt
  - Test with all answers
  - Test with partial answers
  - Test score calculation
  - Test passing (80%) and failing (<80%)
  
- [ ] **GET /api/quizzes/{id}/attempts** - Get user's attempts
  - Test multiple attempts
  - Test best score tracking
  
- [ ] **GET /api/quiz-attempts/{id}** - Get attempt details
  - Test with correct/incorrect answers
  - Test detailed results

#### Certificate Endpoints
- [ ] **GET /api/certificates/check/{courseId}** - Check eligibility
  - Test with completed course (100% lessons, all quizzes 80%+)
  - Test with incomplete course
  - Test auto-generation
  
- [ ] **GET /api/certificates** - Get user's certificates
  - Test with multiple certificates
  - Test with no certificates
  
- [ ] **GET /api/certificates/{id}** - Get certificate details
  - Test certificate_code generation
  - Test issued_at timestamp
  
- [ ] **GET /api/certificates/{id}/download** - Download PDF
  - Test PDF generation
  - Test single-page landscape format
  - Test green theme
  - Test certificate details display
  
- [ ] **GET /api/certificates/verify/{code}** - Verify certificate
  - Test with valid code
  - Test with invalid code

#### Progress & Analytics Endpoints
- [ ] **GET /api/progress/analytics** - Get overall analytics
  - Test learning streak calculation
  - Test time investment
  - Test quiz performance trends
  - Test course progress summary
  
- [ ] **GET /api/progress/courses/{courseId}/analytics** - Course analytics
  - Test lesson completion stats
  - Test quiz attempts breakdown
  - Test time per lesson
  - Test average quiz score

#### Admin Endpoints
- [ ] **GET /api/admin/stats** - Dashboard statistics
  - Test total counts (users, courses, enrollments)
  - Test role breakdown
  - Test recent activity
  
- [ ] **GET /api/admin/users** - Get all users
  - Test pagination
  - Test user data
  
- [ ] **GET /api/admin/courses** - Get all courses
  - Test including unpublished
  - Test enrollment counts
  
- [ ] **PUT /api/admin/users/{id}/role** - Update user role
  - Test changing to instructor
  - Test changing to admin
  
- [ ] **DELETE /api/admin/users/{id}** - Delete user
  - Test cascade delete
  - Test self-delete prevention

---

### 2. Frontend Testing

#### Authentication Pages
- [ ] **Register Page**
  - Test form validation
  - Test password confirmation
  - Test role selection
  - Test redirect to login after success
  
- [ ] **Login Page**
  - Test form validation
  - Test error messages
  - Test remember me
  - Test redirect to dashboard
  
- [ ] **Logout**
  - Test sessionStorage clearing
  - Test redirect to login

#### Student Dashboard
- [ ] **Main Dashboard**
  - Test stats display (enrolled courses, completed, certificates)
  - Test learning streak display
  - Test enrolled courses list
  - Test "Continue Learning" buttons
  
- [ ] **Browse Courses**
  - Test search functionality (real-time)
  - Test category filter
  - Test difficulty filter
  - Test instructor filter
  - Test filter combination
  - Test course cards display
  - Test enrollment button
  
- [ ] **My Progress**
  - Test overall analytics display
  - Test time investment chart/stats
  - Test quiz performance trends
  - Test per-course progress details
  - Test course completion percentage

#### Course Learning
- [ ] **Course View**
  - Test lesson list display
  - Test lesson order
  - Test completion checkmarks
  - Test quiz indicators
  
- [ ] **Lesson View**
  - Test content display
  - Test video playback (if applicable)
  - Test "Mark Complete" button
  - Test time tracking
  - Test navigation (prev/next)
  
- [ ] **Quiz Taking**
  - Test question display
  - Test answer selection
  - Test timer (if applicable)
  - Test submission
  - Test results display
  - Test retry option
  
- [ ] **Certificate View**
  - Test eligibility check
  - Test certificate display
  - Test PDF download
  - Test certificate details

#### Instructor Dashboard
- [ ] **My Courses**
  - Test course list display
  - Test enrollment counts
  - Test "Create Course" button
  
- [ ] **Create Course**
  - Test form validation
  - Test all fields (title, description, category, difficulty, thumbnail)
  - Test publish/draft toggle
  - Test success message
  
- [ ] **Edit Course**
  - Test pre-populated fields
  - Test updating
  - Test deleting course
  
- [ ] **Manage Lessons**
  - Test lesson list
  - Test add lesson
  - Test edit lesson
  - Test reorder lessons
  - Test delete lesson
  
- [ ] **Manage Quizzes**
  - Test quiz list
  - Test add quiz
  - Test edit quiz
  - Test passing score setting
  - Test delete quiz
  
- [ ] **Manage Questions**
  - Test question list
  - Test add question
  - Test answer options
  - Test correct answer marking
  - Test edit question
  - Test delete question

#### Admin Dashboard
- [ ] **Statistics**
  - Test total users count
  - Test total courses count
  - Test total enrollments count
  - Test role distribution chart
  
- [ ] **User Management**
  - Test user list
  - Test search/filter users
  - Test change role
  - Test delete user
  - Test confirmation dialogs
  
- [ ] **Course Management**
  - Test all courses list
  - Test unpublished courses
  - Test delete course
  - Test course statistics

---

### 3. Database Integrity Tests

#### Data Relationships
- [ ] Course -> Lessons (foreign key)
- [ ] Course -> Enrollments (cascade delete)
- [ ] Lesson -> Quizzes (foreign key)
- [ ] Quiz -> Questions (cascade delete)
- [ ] Question -> Answers (cascade delete)
- [ ] User -> Enrollments (cascade delete)
- [ ] Enrollment -> Certificates (foreign key)
- [ ] Enrollment -> LessonCompletions
- [ ] Enrollment -> QuizAttempts

#### Data Validation
- [ ] Email uniqueness
- [ ] Password hashing (bcrypt)
- [ ] Timestamps (created_at, updated_at)
- [ ] Soft deletes (if applicable)
- [ ] Enum values (role, difficulty)
- [ ] Default values (is_correct = false, order = 0)

---

### 4. Security Tests

#### Authentication & Authorization
- [ ] **Sanctum Token Security**
  - Test token expiration
  - Test token validation
  - Test CORS policy
  
- [ ] **Role-Based Access Control (RBAC)**
  - Test student cannot access instructor routes
  - Test instructor cannot access admin routes
  - Test non-authenticated cannot access protected routes
  
- [ ] **Data Access Control**
  - Test users can only see their own data
  - Test instructors can only modify their own courses
  - Test students can only enroll in published courses

#### Input Validation
- [ ] SQL injection prevention (Eloquent ORM)
- [ ] XSS prevention (sanitization)
- [ ] CSRF protection (Sanctum)
- [ ] File upload validation (if applicable)
- [ ] Rate limiting on login endpoint

#### Password Security
- [ ] Bcrypt hashing (verified ✅)
- [ ] Minimum length (8 characters)
- [ ] Password confirmation on registration

---

### 5. Performance Tests

#### API Response Times
- [ ] GET /api/courses (Target: < 300ms)
- [ ] GET /api/courses/{id} (Target: < 200ms)
- [ ] POST /api/auth/login (Target: < 500ms)
- [ ] GET /api/progress/analytics (Target: < 500ms)
- [ ] Certificate PDF generation (Target: < 2s)

#### Database Query Optimization
- [ ] Eager loading relationships (with() statements)
- [ ] Pagination for large datasets
- [ ] Index on foreign keys
- [ ] Index on frequently searched fields (email, category)

#### Frontend Performance
- [ ] React component re-render optimization
- [ ] Lazy loading for courses
- [ ] Image optimization
- [ ] API call debouncing on search

---

### 6. UI/UX Tests

#### Responsive Design
- [ ] Mobile view (< 640px)
- [ ] Tablet view (640px - 1024px)
- [ ] Desktop view (> 1024px)
- [ ] Neobrutalism design consistency

#### User Experience
- [ ] Loading states (spinners, skeletons)
- [ ] Error messages (clear and helpful)
- [ ] Success messages (confirmations)
- [ ] Form validation feedback
- [ ] Empty states (no courses, no certificates)
- [ ] Confirmation dialogs (delete actions)

#### Accessibility
- [ ] Keyboard navigation
- [ ] Focus indicators
- [ ] Alt text for images
- [ ] ARIA labels for screen readers
- [ ] Color contrast ratios

---

### 7. Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

### 8. Error Handling

#### API Errors
- [ ] 400 Bad Request (validation errors)
- [ ] 401 Unauthorized (no token/invalid token)
- [ ] 403 Forbidden (insufficient permissions)
- [ ] 404 Not Found (resource not found)
- [ ] 422 Unprocessable Entity (validation failures)
- [ ] 500 Internal Server Error (server errors)

#### Frontend Error Handling
- [ ] Network errors (API down)
- [ ] Timeout errors
- [ ] Validation errors
- [ ] Authentication errors
- [ ] Session expiry handling

---

## Critical Issues Found

### Fixed Issues ✅
1. **500 Error on API Routes**: Routes returning "Route [login] not defined" error
   - **Cause**: Laravel trying to redirect unauthenticated API requests to 'login' route
   - **Fix**: Updated `bootstrap/app.php` to return JSON 401 responses for API requests
   - **Status**: FIXED ✅

---

## Testing Tools & Commands

### Backend Testing
```bash
# Run all routes
cd backend
php artisan route:list

# Check migrations
php artisan migrate:status

# Test API endpoints
curl -H "Accept: application/json" http://localhost:8000/api/courses

# Clear cache
php artisan cache:clear
php artisan config:clear
```

### Frontend Testing
```bash
# Run dev server
cd frontend
npm run dev

# Build production
npm run build

# Check for errors
npm run lint
```

### Database Testing
```bash
# Reset database
php artisan migrate:fresh --seed

# Check database structure
php artisan db:show

# Run seeders
php artisan db:seed
```

---

## Next Steps

1. ✅ Fix authentication error handling (COMPLETED)
2. ⏳ Manual API endpoint testing (use Postman/Insomnia or curl)
3. ⏳ Frontend functionality testing
4. ⏳ Create test data (seeder)
5. ⏳ Performance testing
6. ⏳ Security audit
7. ⏳ Documentation finalization
8. ⏳ Deployment preparation

---

## Testing Notes

- **All 15 migrations** are running successfully (verified 2026-01-23)
- **All 42+ API routes** are properly registered (verified via route:list)
- **Password hashing** is working correctly with bcrypt
- **API authentication** now returns proper JSON 401 responses
- **Sanctum SPA authentication** is configured correctly
