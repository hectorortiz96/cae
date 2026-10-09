# CAE Reports API - Bruno Collection

This is a Bruno API testing collection for the CAE Reports application. Bruno is a lightweight, open-source API client that stores requests as version-controlled text files.

## 📦 What's Included

The collection includes all API endpoints organized into logical groups:

### **Authentication**
- `Register` - Create a new user account
- `Login` - Authenticate and get JWT token
- `Forgot Password` - Request a password reset email for an existing user
- `Reset Password` - Set a new password using a valid reset token

### **Users**
- `Get Current User` - Fetch authenticated user's current profile

### **Reports**
- `Create Report` - Create a new report
- `Get All Reports` - Retrieve all reports
- `Get Report by ID` - Fetch a specific report
- `Get My Reports` - Get reports created by current user
- `Search Reports by Student Name` - Search reports by student
- `Get Reports by Grade` - Filter reports by grade
- `Get Reports by Type` - Filter reports by type
- `Get Reports by Student` - Get all reports for a student
- `Update Report` - Modify an existing report
- `Delete Report` - Remove a report
- `Get Public Report by ID` - Access report publicly
- `Mark Public Report as Received` - Confirm receipt of public report
- `Resend Report Email` - Send a reminder to student contacts with the report creator in CC (owner or admin only)

### **Admin**
- `Get All Users` - List all users (admin only)
- `Get User by ID` - Retrieve specific user details (admin only)
- `Get User Reports` - Get all reports by a user (admin only)
- `Update User Role` - Change user's role (admin only)
- `Delete User` - Delete a user (admin only)

### **Students**
- `Get All Students` - Retrieve all students
- `Get Students by Grade` - Filter students by grade
- `Get Students by Name` - Search students by name
- `Import Students from CSV` - Batch import students (admin only)
- `Delete All Students` - Remove all students (admin only)
- `Get Student Details` - Retrieve a student's details by exact full name (admin only)
- `Update Student` - Update a student's name, grade, and contact emails (admin only)

### New Endpoint Usage

| Request | Endpoint | Notes |
|---------|----------|-------|
| Resend Report Email | `POST /reports/{id}/resend-email` | Set `reportId` and log in as the report owner or an admin. Leave the PDF fields empty to omit the attachment, or supply Base64 PDF content and `application/pdf`. Returns `204 No Content`. |
| Get Student Details | `GET /students/details?fullName=...` | Replace the URL-encoded sample name with the student's exact full name. Requires an admin token. |
| Update Student | `PUT /students/details?contactemail1=...` | The query parameter identifies the student's current primary email; the JSON body contains the new values. Use grades `1A` through `3C`; secondary email can be `null`. Renaming also updates matching reports. Requires an admin token. |

## 🚀 Getting Started

### Prerequisites
- [Bruno](https://www.usebruno.com/download) - Download and install the latest version
- A running instance of the CAE Reports backend (default: `http://localhost:8080`)

### Installation

1. Open Bruno
2. Click **Open Collection** → Navigate to the `reports` folder
3. Select **bruno.json** to load the collection

### Configuration

The collection uses environment variables for flexibility:

#### **Local Development Environment**
Located in `environments/Local.json` (within the Bruno collection), contains:
- `baseUrl`: `http://localhost:8080`
- `token`: (auto-populated after login)
- `userId`: User ID for admin operations

#### **Production Environment**
Located in `environments/Production.json` (within the Bruno collection), contains:
- `baseUrl`: `https://api.cae-reports.com`
- `token`: (auto-populated after login)
- `userId`: User ID for admin operations

**To switch environments in Bruno:**
1. Click the **Environments** dropdown (top-right)
2. Select **Local** or **Production**

## 📋 Typical Workflow

### 1. **Register a New User**
```
GET Authentication > Register
```
Update the request body with desired credentials, then send.

### 2. **Login**
```
GET Authentication > Login
```
The JWT token will automatically be captured and set in the environment.

### 3. **Create a Report**
```
POST Reports > Create Report
```
Update the request body with report details. Replace placeholders as needed.

### 4. **Fetch and Manage Reports**
- Use `Get My Reports` to see your reports
- Use `Search Reports by Student Name` for specific reports
- Use `Update Report` to modify existing reports
- Use `Delete Report` to remove reports

### 5. **Admin Operations**
```
GET Admin > Get All Users
PUT Admin > Update User Role
DELETE Admin > Delete User
```
Note: Requires ADMIN role

## 🔐 Authentication

Most endpoints require Bearer token authentication. The workflow:

1. **Register** a new user (if needed)
2. **Login** with credentials
3. Token is automatically extracted and saved to the environment
4. Subsequent requests use this token automatically

The token expires after 1 hour (by default). Login again to refresh.

## ✅ Testing Features

Each request includes built-in tests that validate:
- HTTP status codes
- Response structure
- Data integrity
- Token extraction (for login)

After sending a request, check the **Tests** tab to see results.

## 🔄 Environment Variables

Bruno supports dynamic variables. Key variables used:

| Variable | Purpose | Auto-populated |
|----------|---------|-----------------|
| `baseUrl` | API base URL | No (set manually) |
| `token` | JWT authentication token | Yes (by Login) |
| `userId` | User ID for admin operations | No (set manually) |
| `reportId` | Report ID from last creation | Yes (by Create Report) |

**To set variables:**
1. Click **Environments** → Select environment
2. Add/modify variables in the JSON editor
3. Or use auto-population from test responses

## 📝 Example: Complete Flow

```
1. Authentication > Register
   - Creates new user, get ID

2. Authentication > Login
   - Token auto-saved to environment

3. Reports > Create Report
   - ReportID auto-saved to environment

4. Reports > Get Report by ID
   - Uses {{reportId}} from previous step

5. Reports > Update Report
   - Modifies the report

6. Reports > Delete Report
   - Removes the report

7. Admin > Get All Users (if admin)
   - Lists all users
```

## 🛠️ Customization

### Modify Requests
- Double-click any request to edit
- Change URLs, headers, body, authentication
- Save changes automatically

### Add New Requests
1. Right-click a folder
2. **New Request**
3. Configure and save

### Create Folders
1. Right-click collection root
2. **New Folder**
3. Rename and organize requests

## 🐛 Troubleshooting

### Connection Refused
- Ensure backend is running on `http://localhost:8080`
- Check `baseUrl` in environment settings

### 401 Unauthorized
- Login to refresh token
- Verify token is not expired (1 hour TTL)

### 403 Forbidden
- Ensure user account has ADMIN role for admin endpoints
- Use `Admin > Update User Role` to grant permissions

### 404 Not Found
- Verify resource IDs are correct
- Check `reportId` or `userId` environment variables

## 📖 Documentation

For more information:
- [Bruno Documentation](https://docs.usebruno.com/)
- Backend API documentation in `reports` folder
- Postman collection export available (can import into Bruno)

## 🤝 Contributing

To add new endpoints:
1. Follow the existing naming convention
2. Include sample request bodies
3. Add relevant tests
4. Update this README with new operations

---

**Happy Testing!** 🚀
