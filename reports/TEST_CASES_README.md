# Unit Test Cases (Reports Module)

This document describes the current unit and test-support classes in the `reports` module and how to run them.

## Scope

- Module: `reports`
- Test source folder: `src/test/java`
- Main goals:
  - verify service behavior with mocked dependencies
  - verify Spring context startup

## Test Frameworks Used

- JUnit 5 (`@Test`) for test definitions and assertions.
- Mockito (`mock`, `when`, `verify`, `doThrow`) for dependency mocking and interaction checks.
- Spring Boot Test (`@SpringBootTest`) for application-context loading tests.

## Current Test Classes and Cases

### 1) `com.cae.reports.service.EmailNotificationServiceTests`

File: `src/test/java/com/cae/reports/service/EmailNotificationServiceTests.java`

- `notifyReportCreatedSendsEmailToStudentContacts`
  - Mocks `JavaMailSender` and `StudentRepository`.
  - Stubs student lookup to return a student with two contact emails.
  - Verifies that `mailSender.send(...)` is called.
  - Captures `SimpleMailMessage` and asserts:
    - `from` is `noreply@test.local`
    - `to` contains both contacts
    - subject is `New report for Jane Doe`

- `notifyReportCreatedSkipsWhenStudentDoesNotExist`
  - Stubs student lookup to return empty.
  - Verifies `mailSender.send(...)` is never called.

### 2) `com.cae.reports.service.ReportServiceTests`

File: `src/test/java/com/cae/reports/service/ReportServiceTests.java`

- `createReportSavesReportAndTriggersEmailNotification`
  - Mocks `ReportRepository` and `EmailNotificationService`.
  - Stubs repository save.
  - Verifies saved report is returned.
  - Verifies email notification is triggered with the saved report.

- `createReportStillReturnsSavedReportWhenNotificationFails`
  - Same setup, but notification mock throws runtime exception.
  - Verifies service still returns saved report.
  - Verifies notification was attempted.

### 3) `com.cae.reports.service.EmailNotificationLiveSmtpTests`

File: `src/test/java/com/cae/reports/service/EmailNotificationLiveSmtpTests.java`

- `notifyReportCreatedSendsLiveEmailToOneConfiguredRecipient`
  - Sends a **real SMTP email** to a single recipient (`LIVE_EMAIL_RECIPIENT`).
  - Uses real SMTP environment variables (`MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`).
  - Uses mocked `StudentRepository` so no database data is modified.
  - Is **opt-in only** and skipped unless `LIVE_EMAIL_TEST=true`.

### 4) `com.cae.reports.ReportsApplicationTests`

File: `src/test/java/com/cae/reports/ReportsApplicationTests.java`

- `contextLoads`
  - Uses `@SpringBootTest`.
  - Confirms Spring application context starts successfully.

### 5) `com.cae.reports.util.TextRepairUtilsTests`

File: `src/test/java/com/cae/reports/util/TextRepairUtilsTests.java`

- Placeholder class currently containing no executable test methods.

## Run Tests (Windows PowerShell)

From the `reports` folder:

```powershell
.\mvnw.cmd test
```

Run only email service tests:

```powershell
.\mvnw.cmd -Dtest=EmailNotificationServiceTests test
```

Run only report service tests:

```powershell
.\mvnw.cmd -Dtest=ReportServiceTests test
```

Run only context-load test:

```powershell
.\mvnw.cmd -Dtest=ReportsApplicationTests test
```

Run one live SMTP test email (single recipient, opt-in):

```powershell
Set-Location "C:\Users\M8T5SPV\OneDrive - Deere & Co\Desktop\cae\reports"
Get-Content ".env" | ForEach-Object {
  $line = $_.Trim()
  if (-not $line -or $line.StartsWith('#')) { return }
  $parts = $line -split '=', 2
  if ($parts.Count -eq 2) { [Environment]::SetEnvironmentVariable($parts[0], $parts[1], 'Process') }
}
$env:LIVE_EMAIL_TEST="true"
$env:LIVE_EMAIL_RECIPIENT="your.test.inbox@example.com"
.\mvnw.cmd -Dtest=EmailNotificationLiveSmtpTests test
```

Quick rerun command (same shell session, recipient as parameter):

```powershell
& {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Recipient
  )

  $env:LIVE_EMAIL_TEST="true"
  $env:LIVE_EMAIL_RECIPIENT=$Recipient
  .\mvnw.cmd -Dtest=EmailNotificationLiveSmtpTests test
} "your.test.inbox@example.com"
```

## Where Test Results Are Stored

Maven Surefire outputs reports to:

- `target/surefire-reports/`

These files are generated artifacts from test runs.

## Maintenance Note

Update this file whenever you add, remove, or rename test classes or test methods.

