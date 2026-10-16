import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import CompanyLandingPage from "./pages/CompanyLandingPage";
import NFCLandingPage from "./pages/NFCLandingPage";
import PatientVaultPage from "./pages/PatientVaultPage";
import PatientVaultLoginPage from "./pages/PatientVaultLoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import VaultPortalPage from "./pages/VaultPortalPage";
import VaultClinicLoginPage from "./pages/vault-clinic/VaultClinicLoginPage";
import VaultClinicChangePasswordPage from "./pages/vault-clinic/VaultClinicChangePasswordPage";
import VaultClinicSettingsPage from "./pages/vault-clinic/VaultClinicSettingsPage";
import VaultClinicStaffPage from "./pages/vault-clinic/VaultClinicStaffPage";
import VaultClinicAppointmentsPage from "./pages/vault-clinic/VaultClinicAppointmentsPage";
import VaultClinicPatientsPage from "./pages/vault-clinic/VaultClinicPatientsPage";
import VaultClinicGrantsPage from "./pages/vault-clinic/VaultClinicGrantsPage";
import FacilityLoginPage from "./pages/FacilityLoginPage";
import LoginPage from "./pages/LoginPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminChangePasswordPage from "./pages/AdminChangePasswordPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminClinicsPage from "./pages/admin/AdminClinicsPage";
import AdminVaultClinicsPage from "./pages/admin/AdminVaultClinicsPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminCardsPage from "./pages/admin/AdminCardsPage";
import AdminPlansPage from "./pages/admin/AdminPlansPage";
import AdminFinancePage from "./pages/admin/AdminFinancePage";
import AdminAuditLogPage from "./pages/admin/AdminAuditLogPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";

import DashboardPage from "./pages/DashboardPage";
import NFCScannerPage from "./pages/NFCScannerPage";
import PatientsPage from "./pages/PatientsPage";
import PatientWorkspacePage from "./pages/PatientWorkspacePage";
import AppointmentsPage from "./pages/AppointmentsPage";
import MedicalRecordsPage from "./pages/MedicalRecordsPage";
import LaboratoryWorkspacePage from "./pages/LaboratoryWorkspacePage";
import PharmacyWorkspacePage from "./pages/PharmacyWorkspacePage";
import PaymentWorkspacePage from "./pages/PaymentWorkspacePage";
import PatientRegistrationPage from "./pages/PatientRegistrationPage";
import SettingsPage from "./pages/SettingsPage";
import TopUpPage from "./pages/TopUpPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* =====================================================
            COMPANY LANDING PAGE
        ====================================================== */}
        <Route path="/" element={<CompanyLandingPage />} />

        {/* =====================================================
            NFC CARD LANDING PAGE
        ====================================================== */}
        <Route path="/nfc" element={<NFCLandingPage />} />

        {/* =====================================================
            PATIENT VAULT
        ====================================================== */}
        <Route path="/patient-vault" element={<PatientVaultPage />} />
        <Route path="/patient-vault/login" element={<PatientVaultLoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/patient-vault/forgot-password" element={<Navigate to="/forgot-password" replace />} />

        {/* =====================================================
            VAULT PORTAL
        ====================================================== */}
        <Route path="/vault-portal" element={<VaultPortalPage />} />

        {/* =====================================================
            SYSTEM 2: PATIENT VAULT CLINIC PORTAL
        ====================================================== */}
        <Route path="/vault-clinic" element={<Navigate to="/vault-clinic/login" replace />} />
        <Route path="/vault-clinic/login" element={<VaultClinicLoginPage />} />
        <Route path="/vault-clinic/change-password" element={<VaultClinicChangePasswordPage />} />
        <Route path="/vault-clinic/settings" element={<VaultClinicSettingsPage />} />
        <Route path="/vault-clinic/staff" element={<VaultClinicStaffPage />} />
        <Route path="/vault-clinic/appointments" element={<VaultClinicAppointmentsPage />} />
        <Route path="/vault-clinic/patients" element={<VaultClinicPatientsPage />} />
        <Route path="/vault-clinic/grants" element={<VaultClinicGrantsPage />} />

        {/* =====================================================
            PATIENT REGISTRATION
        ====================================================== */}
        <Route
          path="/register-patient"
          element={
            <ProtectedRoute>
              <PatientRegistrationPage />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            FACILITY ACCESS
        ====================================================== */}
        <Route
          path="/facility-login"
          element={<FacilityLoginPage />}
        />

        {/* =====================================================
            STAFF / ROLE LOGIN
        ====================================================== */}
        <Route
          path="/login"
          element={<LoginPage />}
        />

        {/* =====================================================
            PLATFORM ADMIN
        ====================================================== */}
        <Route
          path="/admin"
          element={<Navigate to="/admin/login" replace />}
        />
        <Route
          path="/admin/login"
          element={<AdminLoginPage />}
        />
        <Route
          path="/admin/change-password"
          element={<AdminChangePasswordPage />}
        />
        <Route
          path="/admin/dashboard"
          element={<AdminDashboardPage />}
        />
        <Route
          path="/admin/overview"
          element={<Navigate to="/admin/dashboard" replace />}
        />
        <Route
          path="/admin/clinics"
          element={<AdminClinicsPage />}
        />
        <Route
          path="/admin/vault-clinics"
          element={<AdminVaultClinicsPage />}
        />
        <Route
          path="/admin/users"
          element={<AdminUsersPage />}
        />
        <Route
          path="/admin/cards"
          element={<AdminCardsPage />}
        />
        <Route
          path="/admin/plans"
          element={<AdminPlansPage />}
        />
        <Route
          path="/admin/finance"
          element={<AdminFinancePage />}
        />
        <Route
          path="/admin/audit-log"
          element={<AdminAuditLogPage />}
        />

        {/* =====================================================
            MAIN DASHBOARD
        ====================================================== */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            NFC PATIENT IDENTIFICATION
        ====================================================== */}
        <Route
          path="/nfc/scan"
          element={
            <ProtectedRoute>
              <NFCScannerPage />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            PATIENTS REGISTRY & DIRECTORY
        ====================================================== */}
        <Route
          path="/patients"
          element={
            <ProtectedRoute>
              <PatientsPage />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            PATIENT WORKSPACE
        ====================================================== */}
        <Route
          path="/patients/:patientId"
          element={
            <ProtectedRoute>
              <PatientWorkspacePage />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            APPOINTMENTS & QUEUE
        ====================================================== */}
        <Route
          path="/appointments"
          element={
            <ProtectedRoute>
              <AppointmentsPage />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            MEDICAL RECORDS EXPLORER
        ====================================================== */}
        <Route
          path="/medical-records"
          element={
            <ProtectedRoute>
              <MedicalRecordsPage />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            LABORATORY WORKSPACE
        ====================================================== */}
        <Route
          path="/laboratory"
          element={
            <ProtectedRoute>
              <LaboratoryWorkspacePage />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            PHARMACY WORKSPACE
        ====================================================== */}
        <Route
          path="/pharmacy"
          element={
            <ProtectedRoute>
              <PharmacyWorkspacePage />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            PAYMENT WORKSPACE
        ====================================================== */}
        <Route
          path="/payment"
          element={
            <ProtectedRoute>
              <PaymentWorkspacePage />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            RECEPTION WALLET TOP-UP
        ====================================================== */}
        <Route
          path="/top-up"
          element={
            <ProtectedRoute>
              <TopUpPage />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            SETTINGS & DIAGNOSTICS
        ====================================================== */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            FALLBACK
        ====================================================== */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;