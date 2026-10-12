# Patient Vault Clinic System (System 2) Progress Tracker

## Status Overview
- Current Stage: **Stage 2 Completed, Moving to Stage 3 (App Shell & Clinic Admin Setup)**
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
- **Status**: In Progress
- **Tasks**:
  1. Isolated layout shell `VaultClinicShell.tsx` (fixed 240px sidebar, 56px header, connected cross logo, compact density).
  2. Clinic sign-in page (`/vault-clinic/login`) and first-login forced password change screen (`/vault-clinic/change-password`).
  3. Clinic setup wizard: operating hours, service catalog, booking mode.
  4. Staff management screen (`/vault-clinic/staff`): invite receptionists and clinicians with temporary passwords.

### Stage 4: Appointments Dashboard & Booking Integrity
- **Status**: Pending

### Stage 5: Patient Vault View, Consent Grants & Mocked Tap
- **Status**: Pending

### Stage 6: Reminders, Scheduled Jobs, Tests & Polish
- **Status**: Pending

---

## Open Questions & Blockers
None. Schema and platform admin components are verified with 0 TypeScript/build errors.
