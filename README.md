# cae

## Admin student editing

Admins can select **Edit Student** on a result in **Search Reports by Student**
(including the mobile card view) to update the student's full name, grade, and
contact emails. Student changes do not rewrite existing reports, so reports
retain the student name and grade recorded when they were created.

Both endpoints require the `ADMIN` role:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/students/details?fullName=<encoded name>` | Load a student by exact name, case-insensitively |
| PUT | `/admin/students?contactemail1=<encoded original email>` | Update the student identified by their original primary contact email |

The PUT body contains `fullName`, `grade` (`1A` through `3C`), `contactemail1`,
and optional `contactemail2`. Blank secondary emails are cleared. Invalid input
returns `400`, missing students return `404`, and conflicting names or primary
emails return `409`.

## Updating your profile

Authenticated users can edit their own username and full name from the dashboard.
`PUT /users/me` accepts `username` (3-50 characters) and `fullName` (up to 150
characters). A successful update returns the updated user and a refreshed JWT;
duplicate usernames return `409`.

## Paginated lists

Dashboard reports and users, student report search results, unreceived reports,
and reports shown on an admin user detail page are paginated on both desktop
and mobile layouts.

## Testing Quick Start

Backend tests live in `reports/src/test/java`.

Run from the backend module folder:

```powershell
Set-Location "reports"
.\mvnw.cmd test
```

Run only selected backend test classes:

```powershell
Set-Location "reports"
.\mvnw.cmd -Dtest=EmailNotificationServiceTests test
.\mvnw.cmd -Dtest=ReportServiceTests test
.\mvnw.cmd -Dtest=ReportsApplicationTests test
```

Detailed backend test inventory and test-case descriptions:
- `reports/TEST_CASES_README.md`

## Docker / MailHog setup

This project supports running the full stack locally with Docker Compose.

### Start the stack

**For local development (REQUIRED - uses .env.local):**

```powershell
cd "C:\Users\M8T5SPV\OneDrive - Deere & Co\Desktop\cae"
docker compose --env-file .env.local up --build
```

**For production (uses .env.production):**

```powershell
docker compose up --build
```

### Services

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- MySQL: localhost:3306
- MailHog UI: http://localhost:8025
- MailHog SMTP: localhost:1025

### Email testing

MailHog is included so email flows can be tested locally without a real SMTP provider.

- App mail host: `mailhog`
- App mail port: `1025`
- MailHog web UI: http://localhost:8025

With the local `dev` profile, mail is disabled by default. Set `APP_MAIL_ENABLED=true`
to log email previews (recipients, CC, subject, body, and attachment filename) in the
backend logs without sending via SMTP. This applies to reports, reminders, and
password resets. When disabled, no email preview is logged.

To explicitly test SMTP delivery through MailHog, enable mail and override
`app.mail.log-only=false` (for example, the application argument
`--app.mail.log-only=false`). Emails will then
appear in the MailHog dashboard. Production sends enabled emails normally.
Local previews can contain personal information and password-reset links; keep
these logs private.

### Stop the stack

```powershell
docker compose down
```

To remove the database volume:

```powershell
docker compose down -v
```

## Docker troubleshooting

### "Illegal base64 character: '-'" error during login

**Cause:** You're not using the correct environment file for local development.

**Solution:** Always use `.env.local` for local Docker testing:

```powershell
docker compose --env-file .env.local up --build
```

The `.env.production` file is a template and contains placeholder secrets. Use `.env.local` which has properly configured base64-encoded JWT secrets for local development.

### Docker is not installed or not running

- Install Docker Desktop or Docker Engine.
- Make sure the Docker service is running before executing `docker compose up`.

### Containers fail to start

```powershell
docker compose ps
docker compose logs -f
```

Check the logs for MySQL startup, connection failures, or backend build errors.

### MySQL not reachable from the backend

- Confirm the backend depends on MySQL and waits for a healthy database.
- Check the database URL in `.env.production`.
- Ensure the service name matches `mysql` in Docker Compose.

### Frontend cannot reach the API

- Verify the frontend was built with the correct `VITE_API_BASE_URL`.
- Confirm the backend is running on `http://localhost:8080`.
- If needed, rebuild the app:

```powershell
docker compose build --no-cache
docker compose up
```

### MailHog is not receiving emails

- Confirm MailHog is running:

```powershell
docker compose ps mailhog
```

- Open the UI at `http://localhost:8025`.
- Verify `MAIL_HOST=mailhog` and `MAIL_PORT=1025` in `.env.production`.

### Clean reset

If you want to reset the full local environment:

```powershell
docker compose down -v
```

Then start again with:

```powershell
docker compose up --build
```

---
