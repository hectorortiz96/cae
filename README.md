# cae

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

When the app sends password reset or report emails, they will appear in the MailHog dashboard.

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
