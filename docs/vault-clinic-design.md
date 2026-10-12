# Patient Vault Clinic System (System 2) Design

## 1. Overview
The Patient Vault Clinic System is a dedicated operational and clinical platform designed for healthcare providers participating in the MedCard Patient Vault network. It operates in strict isolation from System 1 (the contactless NFC facility system).

System 2 enables clinics to:
- Onboard via invitation from the MedCard Platform Admin with one-time, expiring credentials.
- Manage operating hours, active services, durations, and appointment triage modes (manual vs. automatic).
- Triage appointment requests, propose alternative times with structured notes, decline requests with specific reasons, and manage a live calendar.
- Access patient medical vault data (allergies, chronic conditions, current medications) strictly with active consent grants derived from confirmed visits or controlled test card taps.
- Maintain a complete audit trail of every access event with real-time in-app notifications dispatched to patients.

---

## 2. Hard Isolation Boundaries
1. **Database Identity**: System 2 staff are stored in `VaultClinicStaff`. System 1 users (`User` table) are never referenced for System 2 authentication or permissions.
2. **Clinician Reference on Appointments**: `Appointment.vaultClinicianId` references `VaultClinicStaff.id`. The existing `Appointment.providerId` (which points to System 1 `User`) remains untouched and unused for System 2.
3. **Token Audience Isolation**:
   - System 2 JWTs are signed with a dedicated secret (`VAULT_CLINIC_JWT_SECRET` or fallback to secure salt) with `aud: "vault-clinic"`.
   - The System 2 auth middleware explicitly verifies `aud === "vault-clinic"`.
   - Any token from System 1 (`medcard_auth_token`, no audience or staff role) or from the Patient Vault (`type: "patient"`, `aud: "patient-vault"`) is immediately rejected with HTTP 401/403.
   - Browser storage key for System 2 is `medcard_vault_clinic_token`.
4. **Clinic Status Separation**:
   - `Facility.status` belongs strictly to System 1.
   - System 2 clinic state is governed by `VaultClinicSettings.status` (`INVITED`, `ACTIVE`, `SUSPENDED`).
   - Suspending a vault clinic updates `VaultClinicSettings.status = SUSPENDED`, immediately revoking token validity for all its staff without altering `Facility.status`.
   - The public/patient directory (`GET /api/v1/vault/clinics`) lists only facilities where `VaultClinicSettings.status === ACTIVE`, operating hours are defined, and at least one active service exists. System 1 facilities (e.g., King Faisal Hospital) do not appear in the vault directory unless explicitly configured with an active vault status.

---

## 3. Roles and Permissions Matrix

| Capability | Platform Admin | Clinic Admin | Receptionist | Clinician | Patient |
|---|:---:|:---:|:---:|:---:|:---:|
| Register Clinic & Invite 1st Admin | Yes | No | No | No | No |
| Suspend / Reactivate Clinic | Yes | No | No | No | No |
| Configure Hours, Services & Mode | No | Yes | No | No | No |
| Invite & Manage Clinic Staff | No | Yes | No | No | No |
| View Calendar & Queues | No | Yes | Yes | Yes | No |
| Triage Requests (Confirm/Decline) | No | Yes | Yes | No | No |
| Patient Lookup (Initials, YOB, Masked Phone) | No | Yes | Yes | Yes | No |
| View Full Patient Demographics | No | Yes (via appt) | Yes (via appt) | Yes (via appt) | Self |
| View Clinical Vault (Allergies, Meds, etc.) | Blocked | Blocked | Blocked | Yes (with active grant) | Self |
| Simulate Card Tap (Test Patients only) | Blocked | Blocked | Blocked | Yes (if env enabled) | No |
| Revoke Clinic Access Grant | No | No | No | No | Yes |
| Delete Patient Records | Blocked | Blocked | Blocked | Blocked | Blocked |

---

## 4. Credential & Invitation Architecture
1. **Platform Admin Onboarding**:
   - Platform admin navigates to `/admin/vault-clinics`.
   - Form inputs: Clinic name, facility type, district, address, phone, license number, services, first admin name, and admin email.
   - Generates a crypto-random temporary password: min 14 characters, characters `[A-Za-z0-9!@#$%^&*]`, avoiding ambiguous characters (`0, O, l, 1, I`).
   - Hashes with `bcryptjs` (salt 10).
   - Temporary password is sent once via email through Brevo/Nodemailer with login instructions and login URL (`/vault-clinic/login`).
   - Password is never stored in plaintext, never logged, and never returned in API payloads.
   - `tempPasswordExpires` set to `Date.now() + 72 * 60 * 60 * 1000` (72 hours).
   - `mustChangePassword` flag set to `true`.
2. **First Login & Password Change**:
   - Staff member logs in with temporary password.
   - System issues a scoped session with `mustChangePassword: true`.
   - Every route except `POST /api/v1/vault-clinic/auth/change-password` is rejected with HTTP 403 (`PASSWORD_CHANGE_REQUIRED`).
   - Password strength validation: min 12 characters, uppercase, lowercase, number, symbol.
   - Rejects passwords matching temporary password or common passwords list.
   - Upon success, `mustChangePassword` is set to `false`, `tempPasswordExpires` cleared, and full operational token issued.
3. **Staff Management by Clinic Admin**:
   - Clinic Admin creates Receptionist or Clinician accounts using identical secure generation and email dispatch.
   - Clinic Admin can resend invitation (invalidates previous temporary password and resets 72h window).
   - Clinic Admin can deactivate/reactivate staff or update staff roles. Only Platform Admin can create Clinic Admins.
4. **Security Defenses**:
   - Per-account and per-IP lockout: 5 failed attempts in 15 minutes triggers a 15-minute lockout.
   - Generic authentication errors: "Invalid email or password" returned for both non-existent users and incorrect credentials.
   - Token re-verification: On every authenticated request, verify staff account is `isActive === true` and clinic status is `ACTIVE`.

---

## 5. Booking Service & Concurrency Integrity
1. **Single Unified Engine**:
   - All booking, confirmation, rescheduling, and slot modifications route through `VaultBookingService`.
   - Utilizes `prisma.$transaction(..., { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })`.
2. **Available Slots Computation**:
   - Endpoint: `GET /api/v1/vault-clinic/available-slots?facilityId=...&serviceId=...&date=YYYY-MM-DD`.
   - Computes open time windows from `VaultClinicSettings.operatingHours`.
   - Slices into increments matching `VaultClinicService.durationMinutes`.
   - Evaluates confirmed, pending, and scheduled appointments for collisions.
   - Returns only unconflicted future slots.
3. **Triage Modes**:
   - `MANUAL`: Patient bookings from vault portal enter `status: PENDING`. Clinic reviews in Requests queue and selects Confirm, Decline (with `declineReason`), or Propose Time (with `proposedTime`).
   - `AUTOMATIC`: If requested slot is valid and free, booking immediately transitions to `status: CONFIRMED`, and a `VaultAccessGrant` is initialized.
4. **Status Transitions**:
   - `PENDING` -> `CONFIRMED` or `DECLINED` or `PROPOSED_TIME`
   - `PROPOSED_TIME` -> `CONFIRMED` (patient accepts) or `DECLINED` / `RESCHEDULING`
   - `CONFIRMED` -> `CHECKED_IN` -> `COMPLETED` or `NO_SHOW` or `CANCELLED`

---

## 6. Patient Consent Grants & Mocked Tap Simulator
1. **VaultAccessGrant Lifecycle**:
   - Created automatically upon appointment confirmation or when unlocked via test card tap.
   - Duration: Valid from 1 hour prior to scheduled appointment start until appointment completes, or a maximum of 12 hours.
   - Patient specifies `sharedSections` (default: `allergies`, `conditions`, `medications`).
   - Grants can be revoked immediately by the patient in the Patient Vault portal under "Clinics with access".
2. **Mocked Card Tap Simulator**:
   - Enabled strictly when `VAULT_CLINIC_MOCK_TAP === "true"`. Default is `false`.
   - Enforces `Patient.isTestPatient === true`. Non-test patients are rejected.
   - Available to Clinicians only. Receptionists are rejected.
   - Creates a 12-hour `VaultAccessGrant` with source `MOCKED_CARD_TAP`.
   - Logs an audit entry in `VaultAuditLog`.
   - Dispatches a real-time notification to the patient: "Clinic [Name] opened your medical record via card tap."

---

## 7. App Shell and Visual Standards
- Dedicated app shell component `VaultClinicShell` used by both Vault Clinic and Patient Vault.
- Fixed sidebar (240px) and fixed header (56px). Main viewport only scrolls (`overflow-y-auto`, `min-h-0`).
- Connected cross logo from `public/medcard-logo.svg`.
- Compact density: 36px control heights, 12px card border radius, 24px container padding.
- Neutral white surfaces with subtle border `#E4EBF0`.
- Primary actions: Navy `#0F2942` buttons with white text.
- Brand Teal `#00A3B8` reserved for focus outlines, active indicators, and accents.
- No colored icon background boxes. No all-caps text. No inline styles.

---

## 8. Scheduled Reminders & Background Jobs
- Web Service Architecture on Render: Render instances may sleep or restart on free/starter tiers.
- The reminder dispatcher `backend/scripts/run-reminders.js` processes upcoming appointments scheduled within 24 hours.
- Prevents duplicate dispatches using unique sent tracking (`reminderSentAt` on Appointment or `PatientNotification` deduplication).
- Distributed lock via PostgreSQL advisory lock (`SELECT pg_try_advisory_lock(...)`) ensures safety across parallel or restarting instances.

