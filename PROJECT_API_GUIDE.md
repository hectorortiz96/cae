# CAE Reports - Project Structure & API Guide

This guide provides information about the project structure and API endpoints for the **cae-app** (frontend) and **reports** (backend) projects.

---

## Table of Contents

1. [Running the Applications](#running-the-applications)
2. [Backend Project Structure](#backend-project-structure)
3. [API Endpoints](#api-endpoints)
4. [User Roles](#user-roles)

---

## Running the Applications

### Start Backend (Reports)

```bash
cd reports

# Using Maven Wrapper
./mvnw spring-boot:run

# Or using the JAR file
java -jar target/reports-0.0.1-SNAPSHOT.jar
```

The backend will start on `http://localhost:8080` (default Spring Boot port).

### Start Frontend (CAE-App)

```bash
cd cae-app
npm run dev
```

The frontend development server will start on `http://localhost:5173` (default Vite port).

---

## Backend Project Structure

```
reports/src/main/java/com/cae/reports/
├── ReportsApplication.java
├── config/
│   ├── AppConfig.java              # Authentication beans
│   ├── JwtAuthFilter.java          # JWT validation filter
│   └── SecurityConfig.java         # Security configuration
├── controller/
│   ├── AdminController.java        # Admin-only user management
│   ├── AuthenticationController.java # Login/signup endpoints
│   ├── ReportController.java       # Report CRUD endpoints
│   ├── StudentController.java      # Student CSV import endpoint
│   └── UserController.java         # User endpoints
├── dto/
│   ├── request/
│   │   ├── LoginRequest.java
│   │   ├── RegisterRequest.java
│   │   ├── ReportRequest.java
│   │   └── UpdateRoleRequest.java
│   └── response/
│       ├── LoginResponse.java
│       ├── ReportResponse.java
│       ├── StudentBatchImportResponse.java
│       ├── StudentResponse.java
│       └── UserResponse.java
├── exceptions/
│   └── GlobalExceptionHandler.java # Centralized error handling
├── model/
│   ├── Grade.java                  # Grade level enum (1A-3C)
│   ├── Report.java                 # Report entity
│   ├── ReportType.java             # Report type enum (Observation, Report)
│   ├── Role.java                   # USER, ADMIN enum
│   ├── Student.java                # Student entity
│   └── User.java                   # User entity with UserDetails
├── repository/
│   ├── ReportRepository.java
│   ├── StudentRepository.java
│   └── UserRepository.java
└── service/
    ├── AuthService.java            # Signup/login logic
    ├── EmailNotificationService.java # Sends report-created emails to student contacts
    ├── JwtService.java             # JWT token operations
    ├── ReportService.java          # Report CRUD operations
    ├── StudentService.java         # Student CSV import logic
    └── UserService.java            # User operations
```

---

## API Endpoints

### Authentication (Public)

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| POST | `/auth/signup` | Register new user | `RegisterRequest` |
| POST | `/auth/login` | Login and get JWT token | `LoginRequest` |
| POST | `/auth/forgot-password` | Request password reset email | `ForgotPasswordRequest` |
| POST | `/auth/reset-password` | Reset password with token | `ResetPasswordRequest` |

### Users (Authenticated)

| Method | Endpoint | Description | Required Role |
|--------|----------|-------------|---------------|
| GET | `/users/me` | Get current user | Any authenticated |

### Admin (Admin Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/users` | List all users |
| GET | `/admin/users/{id}` | Get user by ID |
| GET | `/admin/users/{id}/reports` | Get all reports for a user |
| PUT | `/admin/users/{id}/role` | Update user role |
| DELETE | `/admin/users/{id}` | Delete user |

### Reports (Authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/reports` | Create a new report |
| GET | `/reports` | Get all reports |
| GET | `/reports/{id}` | Get a report by ID |
| GET | `/reports/public/{id}` | Get a public report by ID |
| GET | `/reports/me` | Get reports created by current user |
| GET | `/reports/grade/{grade}` | Get reports by grade (e.g., 1A, 2B) |
| GET | `/reports/type/{reportType}` | Get reports by type (Observación, Reporte) |
| GET | `/reports/student/{studentName}` | Get reports by student name |
| PUT | `/reports/{id}` | Update a report |
| DELETE | `/reports/{id}` | Delete a report |

### Students

| Method | Endpoint | Description | Required Role |
|--------|----------|-------------|---------------|
| GET | `/students/grade/{grade}` | Get students by grade (e.g., `1A`, `2B`) and return `StudentResponse` DTOs with display-grade values | Any authenticated |
| GET | `/students/name/{name}` | Search students by name (case-insensitive contains) and return `StudentResponse` DTOs with display-grade values | Any authenticated |
| POST | `/students/import` | Upload CSV to create students in batch | ADMIN |
| DELETE | `/students` | Delete all student records | ADMIN |

CSV format accepted by `/students/import`:

- Optional header row: `fullName,grade,contactemail1,contactemail2`
- Data rows must contain 3 or 4 columns: `fullName,grade,contactemail1[,contactemail2]`
- `fullName` is normalized to name case on import (example: `jOHN DOE` -> `John Doe`)
- Duplicate checking is based on `fullName` (case-insensitive) in file and in database
- Upload CSVs in UTF-8 when possible.

Student list responses use `StudentResponse` DTOs so the frontend receives the display grade directly (for example, `1C` instead of `GRADE_1C`). The secondary email field is included only when present.

### Request/Response Examples

**Register:**
```json
// POST /auth/signup
{
  "username": "john",
  "password": "secret123",
  "email": "john@example.com",
  "fullName": "John Doe"
}
```

**Login:**
```json
// POST /auth/login
{
  "username": "john",
  "password": "secret123"
}

// Response
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 3600000,
  "user": {
    "id": 1,
    "username": "john",
    "email": "john@example.com",
    "fullName": "John Doe",
    "role": "USER"
  }
}
```

**Forgot Password:**
```json
// POST /auth/forgot-password
{
  "email": "john@example.com"
}

// Response (200 OK)
{
  "message": "Password reset email sent successfully",
  "success": true
}

// Response (200 OK - generic for security if email not found)
{
  "message": "If an account exists with this email, a reset link has been sent",
  "success": true
}
```

**Reset Password:**
```json
// POST /auth/reset-password
{
  "token": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "password": "newSecurePassword123",
  "passwordConfirm": "newSecurePassword123"
}

// Response (200 OK)
{
  "message": "Password reset successfully",
  "success": true
}

// Error Response (400 Bad Request)
{
  "message": "Passwords do not match",
  "success": false
}
```

Error messages for reset password:
- `"Passwords do not match"` - password ≠ passwordConfirm
- `"Invalid or expired reset token"` - token not found in DB or token expired (>24 hours)
- `"User with email not found"` - Email address doesn't exist in the system

**Update Role (Admin):**
```json
// PUT /admin/users/1/role
// Header: Authorization: Bearer <admin_token>
{
  "role": "ADMIN"
}
```

**Create Report:**
```json
// POST /reports
// Header: Authorization: Bearer <token>
{
  "content": "Student has shown great improvement...",
  "studentName": "Jane Smith",
  "grade": "2A",
  "reportType": "Reporte"
}

// Response
{
  "id": 1,
  "content": "Student has shown great improvement...",
  "studentName": "Jane Smith",
  "grade": "2A",
  "reportType": "Reporte",
  "authorUsername": "john",
  "createdAt": "2026-08-31T10:30:00.000+00:00"
}
```

**Import Students (CSV):**
```text
POST /students/import
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
file=<students.csv>
```

**Delete All Students:**
```text
DELETE /students
Authorization: Bearer <admin_token>
```

```text
Response: 204 No Content
```

```csv
fullName,grade,contactemail1,contactemail2
jOHN DOE,1A,john.doe@example.com,
mary ann smith,2B,mary.smith@example.com,mary.parent@example.com
```

```json
// Response
{
  "totalRows": 2,
  "createdRows": 2,
  "failedRows": 0,
  "errors": []
}
```

### Grade Values

| Enum Value | Display Value |
|------------|---------------|
| `GRADE_1A` | 1A |
| `GRADE_1B` | 1B |
| `GRADE_1C` | 1C |
| `GRADE_2A` | 2A |
| `GRADE_2B` | 2B |
| `GRADE_2C` | 2C |
| `GRADE_3A` | 3A |
| `GRADE_3B` | 3B |
| `GRADE_3C` | 3C |

### Report Type Values

| Enum Value | Display Value |
|------------|---------------|
| `OBSERVATION` | Observación |
| `REPORT` | Reporte |

---

## User Roles

| Role    | Description                | Permissions                                                         |
|---------|----------------------------|---------------------------------------------------------------------|
| `USER`  | Default role for new users | Access own profile, view users                                      |
| `ADMIN` | Administrator              | Full user management, student batch import, and delete all students |

