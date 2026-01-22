# Quiz Learning Platform - API Documentation

## Base URL
```
http://localhost:8000/api
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer {your-token-here}
```

---

## Authentication Endpoints

### Register User
**POST** `/register`

Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "password_confirmation": "password123",
  "role": "student" // optional: student, instructor, admin (default: student)
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "created_at": "2026-01-21T10:47:12.000000Z",
    "updated_at": "2026-01-21T10:47:12.000000Z"
  },
  "token": "1|WiG4xnGLCe4JooXCyWkcBFD0DVCMExQXFfc1OHlDcf64bc1c"
}
```

---

### Login
**POST** `/login`

Authenticate and receive an access token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "email_verified_at": null,
    "role": "student",
    "created_at": "2026-01-21T10:47:12.000000Z",
    "updated_at": "2026-01-21T10:47:12.000000Z"
  },
  "token": "2|dH23BozJ9KsbobnupyWd8a0GWJha0WxfqfUNkVYF86f6804e"
}
```

**Error Response (422):**
```json
{
  "message": "The provided credentials are incorrect.",
  "errors": {
    "email": [
      "The provided credentials are incorrect."
    ]
  }
}
```

---

### Logout
**POST** `/logout`

**Authentication Required**

Invalidate the current access token.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Get Current User
**GET** `/me`

**Authentication Required**

Get the authenticated user's information.

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "email_verified_at": null,
    "role": "student",
    "created_at": "2026-01-21T10:47:12.000000Z",
    "updated_at": "2026-01-21T10:47:12.000000Z"
  }
}
```

---

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "password_confirmation": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Get Current User
```bash
curl -X GET http://localhost:8000/api/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Accept: application/json"
```

### Logout
```bash
curl -X POST http://localhost:8000/api/logout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Accept: application/json"
```

---

## Error Responses

### Validation Error (422)
```json
{
  "message": "The email field is required. (and 1 more error)",
  "errors": {
    "email": [
      "The email field is required."
    ],
    "password": [
      "The password field is required."
    ]
  }
}
```

### Unauthorized (401)
```json
{
  "message": "Unauthenticated."
}
```

---

## Status Codes

- `200` - OK (Success)
- `201` - Created (Resource created successfully)
- `401` - Unauthorized (Invalid or missing token)
- `422` - Unprocessable Entity (Validation error)
- `500` - Internal Server Error

---

## User Roles

- **student** - Default role, can enroll in courses and take quizzes
- **instructor** - Can create courses, lessons, and quizzes
- **admin** - Full access to all resources

---

## Next Steps

The following endpoints will be implemented next:

### Courses
- `GET /courses` - List all published courses
- `POST /courses` - Create a course (instructor/admin)
- `GET /courses/{id}` - Get course details
- `PUT /courses/{id}` - Update course (instructor/admin)
- `DELETE /courses/{id}` - Delete course (instructor/admin)

### Enrollments
- `POST /courses/{id}/enroll` - Enroll in a course
- `GET /my-courses` - Get user's enrolled courses

### Lessons
- `GET /courses/{id}/lessons` - Get course lessons
- `POST /courses/{id}/lessons` - Create lesson (instructor)
- `PUT /lessons/{id}/complete` - Mark lesson as complete

### Quizzes
- `GET /courses/{id}/quizzes` - Get course quizzes
- `POST /quizzes/{id}/attempt` - Start quiz attempt
- `POST /quizzes/{id}/submit` - Submit quiz answers

### Certificates
- `GET /certificates` - Get user's certificates
- `GET /certificates/{code}/verify` - Verify certificate

---

## Frontend Integration

### Storing the Token
Save the token in localStorage or a secure cookie:
```javascript
localStorage.setItem('auth_token', response.data.token);
```

### Making Authenticated Requests
Include the token in all API requests:
```javascript
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

### React Example
```javascript
// Login
const login = async (email, password) => {
  const response = await axios.post('http://localhost:8000/api/login', {
    email,
    password
  });
  localStorage.setItem('auth_token', response.data.token);
  return response.data.user;
};

// Make authenticated request
const getUser = async () => {
  const token = localStorage.getItem('auth_token');
  const response = await axios.get('http://localhost:8000/api/me', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data.user;
};
```
