# CAE Reports - Dependencies Guide

This guide provides instructions for setting up the development environment on a new computer for both the **cae-app** (frontend) and **reports** (backend) projects.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [CAE-App (Frontend)](#cae-app-frontend)
3. [Reports (Backend)](#reports-backend)
4. [Running the Applications](#running-the-applications)
5. [API Endpoints](#api-endpoints)
6. [User Roles](#user-roles)

---

## Prerequisites

Before setting up the projects, ensure you have the following installed on your system:

### Required Software

| Software | Version | Download Link |
|----------|---------|---------------|
| **Node.js** | v20.x or higher (LTS recommended) | [https://nodejs.org/](https://nodejs.org/) |
| **npm** | v10.x or higher (included with Node.js) | Included with Node.js |
| **Java JDK** | 17 or higher | [https://adoptium.net/](https://adoptium.net/) |
| **Maven** | 3.9.x or higher | [https://maven.apache.org/download.cgi](https://maven.apache.org/download.cgi) |
| **MySQL** | 8.x or higher | [https://dev.mysql.com/downloads/mysql/](https://dev.mysql.com/downloads/mysql/) |
| **Git** | Latest | [https://git-scm.com/](https://git-scm.com/) |

### Verify Installation

Run the following commands to verify your installations:

```bash
# Check Node.js version
node -v

# Check npm version
npm -v

# Check Java version
java -version

# Check Maven version
mvn -v

# Check MySQL version
mysql --version

# Check Git version
git --version
```

---

## CAE-App (Frontend)

The frontend is a **React + TypeScript** application built with **Vite**.

### Dependencies Overview

#### Production Dependencies

| Package | Version | Description |
|---------|---------|-------------|
| `@emotion/react` | ^11.14.0 | CSS-in-JS library for React styling |
| `@emotion/styled` | ^11.14.1 | Styled components for Emotion |
| `@mui/icons-material` | ^9.4.0 | Material Design icons for MUI |
| `@mui/material` | ^9.4.0 | Material UI component library |
| `react` | ^19.2.8 | React library for building user interfaces |
| `react-dom` | ^19.2.8 | React DOM rendering package |

#### Development Dependencies

| Package | Version | Description |
|---------|---------|-------------|
| `@types/node` | ^24.13.3 | TypeScript definitions for Node.js |
| `@types/react` | ^19.2.18 | TypeScript definitions for React |
| `@types/react-dom` | ^19.2.4 | TypeScript definitions for React DOM |
| `@vitejs/plugin-react` | ^6.1.0 | Vite plugin for React |
| `oxlint` | ^1.79.0 | Fast JavaScript/TypeScript linter |
| `typescript` | ~6.0.2 | TypeScript compiler |
| `vite` | ^8.2.2 | Next-generation frontend build tool |

### Setup Instructions

1. **Navigate to the cae-app directory:**
   ```bash
   cd cae-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Available Scripts:**
   ```bash
   # Start development server
   npm run dev

   # Build for production
   npm run build

   # Run linter
   npm run lint

   # Preview production build
   npm run preview
   ```

---

## Reports (Backend)

The backend is a **Spring Boot 4.1.1** application built with **Java 17** and **Maven**.

### Dependencies Overview

#### Core Dependencies

| Dependency | Description |
|------------|-------------|
| `spring-boot-starter-data-jpa` | Spring Data JPA for database operations |
| `spring-boot-starter-security` | Spring Security for authentication/authorization |
| `spring-boot-starter-webmvc` | Spring Web MVC for REST APIs |
| `spring-boot-starter-validation` | Bean validation with Hibernate Validator |

#### CSV Processing

| Dependency | Version | Description |
|------------|---------|-------------|
| `commons-csv` | 1.11.0 | CSV parsing for batch student import |

#### Database

| Dependency | Version | Description |
|------------|---------|-------------|
| `mysql-connector-j` | (managed) | MySQL JDBC driver |

#### JWT Authentication

| Dependency | Version | Description |
|------------|---------|-------------|
| `jjwt-api` | 0.11.5 | JSON Web Token API |
| `jjwt-impl` | 0.11.5 | JJWT implementation |
| `jjwt-jackson` | 0.11.5 | JJWT Jackson serialization |

#### Test Dependencies

| Dependency | Description |
|------------|-------------|
| `spring-boot-starter-data-jpa-test` | Testing support for JPA |
| `spring-boot-starter-security-test` | Testing support for Security |
| `spring-boot-starter-webmvc-test` | Testing support for Web MVC |

### Project Structure

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
    ├── JwtService.java             # JWT token operations
    ├── ReportService.java          # Report CRUD operations
    ├── StudentService.java         # Student CSV import logic
    └── UserService.java            # User operations
```

### Database Setup

1. **Install MySQL Server** (if not already installed)

2. **Create the database:**
   ```sql
   CREATE DATABASE local;
   ```

3. **Configure database credentials:**
   
   Update `src/main/resources/application.properties` with your MySQL credentials:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/local?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&characterEncoding=UTF-8&useUnicode=true&connectionCollation=utf8mb4_unicode_ci
   spring.datasource.username=your_username
   spring.datasource.password=your_password
   ```

   > **Note:** The default configuration uses `root` as username. Update these values according to your local MySQL setup.

   > **Encoding note:** Use `utf8mb4` for the database and tables so Spanish accents are stored correctly. The backend also runs `src/main/resources/schema.sql` on startup to convert the `student`, `report`, and `user` tables to `utf8mb4_unicode_ci`.

4. **Create first admin user:**
   
   After registering a user via the API, promote them to admin:
   ```sql
   UPDATE user SET role = 'ADMIN' WHERE username = 'your_username';
   ```

### Setup Instructions

1. **Navigate to the reports directory:**
   ```bash
   cd reports
   ```

2. **Install dependencies and build:**
   ```bash
   # Using Maven Wrapper (recommended)
   ./mvnw clean install

   # Or using system Maven
   mvn clean install
   ```

3. **Run tests:**
   ```bash
   ./mvnw test
   ```

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

## API Endpoints

### Authentication (Public)

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| POST | `/auth/signup` | Register new user | `RegisterRequest` |
| POST | `/auth/login` | Login and get JWT token | `LoginRequest` |

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
| GET | `/students/grade/{grade}` | Get students by grade (e.g., `1A`, `2B`) | Any authenticated |
| GET | `/students/name/{name}` | Search students by name (case-insensitive contains) | Any authenticated |
| POST | `/students/import` | Upload CSV to create students in batch | ADMIN |
| DELETE | `/students` | Delete all student records | ADMIN |

CSV format accepted by `/students/import`:

- Optional header row: `fullName,grade,contactemail1,contactemail2`
- Data rows must contain 3 or 4 columns: `fullName,grade,contactemail1[,contactemail2]`
- `fullName` is normalized to name case on import (example: `jOHN DOE` -> `John Doe`)
- Duplicate checking is based on `fullName` (case-insensitive) in file and in database
- Upload CSVs in UTF-8 when possible.

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

**Grade Values:**
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

**Report Type Values:**
| Enum Value | Display Value |
|------------|---------------|
| `OBSERVATION` | Observación |
| `REPORT` | Reporte |

---

## User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| `USER` | Default role for new users | Access own profile, view users |
| `ADMIN` | Administrator | Full user management (CRUD, role changes), student batch import, and delete all students |

---

## Environment Variables (Optional)

For production deployments, consider using environment variables instead of hardcoding sensitive values:

### Backend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SPRING_DATASOURCE_URL` | Database connection URL | `jdbc:mysql://localhost:3306/local` |
| `SPRING_DATASOURCE_USERNAME` | Database username | `root` |
| `SPRING_DATASOURCE_PASSWORD` | Database password | `your_password` |
| `SECURITY_JWT_SECRET_KEY` | JWT signing key (256-bit) | Base64 encoded key |
| `SECURITY_JWT_EXPIRATION_TIME` | Token expiration (ms) | `3600000` |

---

## Troubleshooting

### Common Issues

1. **Node.js version mismatch:**
   - Use [nvm](https://github.com/nvm-sh/nvm) (Linux/Mac) or [nvm-windows](https://github.com/coreybutler/nvm-windows) to manage Node.js versions.

2. **Java version mismatch:**
   - Ensure `JAVA_HOME` environment variable points to JDK 17+.

3. **MySQL connection refused:**
   - Verify MySQL service is running.
   - Check credentials in `application.properties`.
   - Ensure the database `local` exists.

4. **Maven build failures:**
   - Run `./mvnw clean install -U` to force update dependencies.
   - Check your internet connection for downloading dependencies.

5. **npm install fails:**
   - Clear npm cache: `npm cache clean --force`
   - Delete `node_modules` folder and `package-lock.json`, then run `npm install` again.

6. **401 Unauthorized on protected endpoints:**
   - Ensure you're sending the JWT token in the `Authorization` header: `Bearer <token>`
   - Check if the token has expired (default: 1 hour)

7. **403 Forbidden on admin endpoints:**
   - Verify the user has `ADMIN` role in the database
   - Update role via SQL: `UPDATE user SET role = 'ADMIN' WHERE id = <user_id>;`

---

## IDE Recommendations

- **Frontend (cae-app):** Visual Studio Code with ESLint and TypeScript extensions
- **Backend (reports):** IntelliJ IDEA or Eclipse with Spring Boot support

---

## Additional Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Spring Security Documentation](https://spring.io/projects/spring-security)
- [MySQL Documentation](https://dev.mysql.com/doc/)

