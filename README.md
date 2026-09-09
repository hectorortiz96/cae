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
