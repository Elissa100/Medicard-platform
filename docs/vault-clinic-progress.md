# Patient Vault Clinic System (System 2) Progress Tracker

## Status Overview
- Current Stage: **Stage 5 Completed, Moving to Stage 6 (Reminders, Scheduled Jobs, Tests & Polish)**
- Master Design: Completed & Approved (`docs/vault-clinic-design.md`)

---

## Environment Variables Needed

| Variable Name | Purpose | Example Value | Default if Unset |
|---|---|---|---|
| `VAULT_CLINIC_JWT_SECRET` | Secret key used to sign and verify System 2 staff JWTs | `secret_vault_clinic_jwt_key_2026_xyz` | Uses `process.env.JWT_SECRET + "_vault_clinic"` |
| `VAULT_CLINIC_MOCK_TAP` | Controls whether the mocked card tap simulator is enabled | `true` or `false` | `false` |
| `FRONTEND_URL` | Base public URL used in invitation and password reset emails | `https://medicard-platform.onrender.com` | `http://localhost:5173` |
| `BREVO_API_KEY` | API key for Brevo email dispatch | `xkeysib-...` | Uses console email fallback |
| `EMAIL_FROM` | Sender address for system invitation emails | `MedCard Health <no-reply@medcard.rw>` | `no-reply@medcard.rw` |

---

## Stage Tracking

### Stage 1: Design & Architecture
- **Status**: Completed
- **Decisions**:
  - `Facility.status` untouched; System 2 uses `VaultClinicSettings.status`.
  - Clinic Admin has no clinical data access (staff/hours management only).
  - Patient lookup returns only initials, YOB, and masked phone until booking or grant exists.
  - Test card tap requires `VAULT_CLINIC_MOCK_TAP=true` and `Patient.isTestPatient=true`.
  - Enums prefixed with `Vault` (`VaultBookingMode`, `VaultClinicStatus`, `VaultClinicRole`) to prevent collisions.
  - Earlier `Facility.bookingMode` and `Facility.operatingHours` left intact and unused.

### Stage 2: Schema, Token Isolation & Platform Admin
- **Status**: Completed
- **Completed Deliverables**:
  1. Additive schema definition in `backend/prisma/schema.prisma` with `VaultClinicStaff`, `VaultClinicSettings`, `VaultClinicService`, `VaultAccessGrant`, `VaultAuditLog`, `PatientNotification`, and back-relations.
  2. Verified `Appointment.source` is `String?` with no default; added `isTestPatient` to `Patient`.
  3. Token audience isolation middleware (`backend/src/middleware/vault-clinic.middleware.js`) verifying `aud: "vault-clinic"`, active staff status, active vault clinic status, and per-account/per-IP lockout.
  4. Vault clinic authentication service and endpoints (`/api/v1/vault-clinic/auth/login`, `/change-password`, `/me`, `/logout`).
  5. Cryptographic temporary password generation (16 chars, unambiguous charset) and Brevo invitation email integration.
  6. Platform Admin Vault Clinics management backend (`/api/v1/admin/vault-clinics`) and frontend (`/admin/vault-clinics`).
  7. Filtered patient participating clinic directory (`getParticipatingClinics`) strictly to active vault clinics with configured hours and services.

### Stage 3: New App Shell & Clinic Admin Setup
- **Status**: Completed
- **Completed Deliverables**:
  1. Isolated layout shell `VaultClinicShell.tsx` (fixed 240px sidebar, 56px header, connected cross logo, compact density).
  2. Frontend session manager & API client `frontend/src/services/vault-clinic.ts` with audience-isolated storage keys and redirection on token expiry / password change requirement.
  3. Clinic sign-in screen `VaultClinicLoginPage.tsx` (`/vault-clinic/login`) with zero exposed credentials.
  4. First-login forced password change screen `VaultClinicChangePasswordPage.tsx` (`/vault-clinic/change-password`) with strict complexity enforcement.
  5. Clinic settings & onboarding checklist screen `VaultClinicSettingsPage.tsx` (`/vault-clinic/settings`) for hours, booking mode, and service catalog.
  6. Staff management screen `VaultClinicStaffPage.tsx` (`/vault-clinic/staff`) with invitation modal and Brevo temporary password dispatch.
  7. Management backend service, controller, and routes mounted under `/api/v1/vault-clinic/management`.

### Stage 4: Appointments Dashboard & Booking Integrity
- **Status**: Completed
- **Completed Deliverables**:
  1. Isolated appointment backend routes mounted under `/api/v1/vault-clinic/appointments`.
  2. Double-booking prevention with strict time-overlap checking for clinicians.
  3. Triage workflow: confirm & assign clinician, decline with reason, propose alternative time, and reschedule.
  4. Automatic patient notifications (`PatientNotification`) on all appointment status transitions.
  5. Full audit logging for each appointment event (`VaultAuditLog`).
  6. Frontend dashboard `VaultClinicAppointmentsPage.tsx` with Triage Queue, Active Schedule, and History views, clinician assignment, and action modals.

### Stage 5: Patient Vault View, Consent Grants & Mocked Tap
- **Status**: Completed
- **Completed Deliverables**:
  1. Patient lookup endpoint with masked privacy release (initials, YOB, masked phone) and audit logging.
  2. Clinical vault record viewer endpoint (strictly clinician-only, requiring active grant or booking).
  3. Consent grant management (`VaultAccessGrant` creation, expiration check, and revocation).
  4. Mocked card tap simulator gated by `VAULT_CLINIC_MOCK_TAP=true`, `isTestPatient=true`, and clinician role.
  5. Frontend screens: `VaultClinicPatientsPage.tsx` (directory with privacy mask, clinician vault inspector, and NFC simulator) and `VaultClinicGrantsPage.tsx` (active consent grants with countdown and revocation).

### Stage 6: Reminders, Scheduled Jobs, Tests & Polish
- **Status**: In Progress
- **Tasks**:
  1. Automated reminder worker script (`backend/scripts/run-reminders.js`) with duplicate prevention.
  2. Verification test suite (`backend/scripts/vault-clinic/test-facility-isolation.js`) validating cross-system token isolation, role gating, and double-booking conflict rejection.
  3. Full pre-push verification: backend boot, frontend tsc, build, lint, and tests.
  4. Push to origin main and report hashes, revert commands, and Render environment variables.

---

## Open Questions & Blockers
None. Builds, linters, and type-checks are 100% green.
