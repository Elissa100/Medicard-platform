import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, X } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";

import type {
  TabId,
  DashboardData,
  EditableProfile,
  VaultProfile,
  Consultation,
  Prescription,
  LabResultItem,
  ParticipatingClinic,
  PatientAppointment,
} from "./vault-portal/types";

import VaultOverviewTab from "./vault-portal/VaultOverviewTab";
import VaultAppointmentsTab from "./vault-portal/VaultAppointmentsTab";
import VaultHistoryTab from "./vault-portal/VaultHistoryTab";
import VaultConsultationsTab from "./vault-portal/VaultConsultationsTab";
import VaultPrescriptionsTab from "./vault-portal/VaultPrescriptionsTab";
import VaultDocumentsTab from "./vault-portal/VaultDocumentsTab";
import VaultNotificationsTab from "./vault-portal/VaultNotificationsTab";
import VaultFamilyTab from "./vault-portal/VaultFamilyTab";
import VaultProfileTab from "./vault-portal/VaultProfileTab";
import VaultBillingTab from "./vault-portal/VaultBillingTab";

import {
  BookAppointmentModal,
  AddAllergyModal,
  AddConditionModal,
  AddDependentModal,
} from "./vault-portal/components/modals";

const API_URL = import.meta.env.VITE_API_URL || "https://medicard-platform.onrender.com/api/v1";
const AUTH_TOKEN_KEY = "medcard_auth_token";

const emptyDependent = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "UNKNOWN",
  nationalId: "",
  insuranceProvider: "",
};

export default function VaultPortalPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [profileForm, setProfileForm] = useState<EditableProfile | null>(null);

  // Clinical records
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [labResults, setLabResults] = useState<LabResultItem[]>([]);

  // Clinic directory and appointments
  const [clinics, setClinics] = useState<ParticipatingClinic[]>([]);
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);

  // Modal state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingInitialClinicId, setBookingInitialClinicId] = useState("");
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [showAllergyModal, setShowAllergyModal] = useState(false);
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [showDependentModal, setShowDependentModal] = useState(false);

  // Page state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentPhone, setPaymentPhone] = useState("");
  const [cancellingAppointmentId, setCancellingAppointmentId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  const getHeaders = useCallback(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  const fetchClinicalRecords = useCallback(
    async (profileId: string) => {
      if (!token) return;
      try {
        const [cRes, pRes, lRes] = await Promise.all([
          fetch(`${API_URL}/vault/consultations?profileId=${profileId}`, { headers: getHeaders() }),
          fetch(`${API_URL}/vault/prescriptions?profileId=${profileId}`, { headers: getHeaders() }),
          fetch(`${API_URL}/vault/lab-results?profileId=${profileId}`, { headers: getHeaders() }),
        ]);
        if (cRes.ok) {
          const d = await cRes.json();
          if (d.success) setConsultations(d.data);
        }
        if (pRes.ok) {
          const d = await pRes.json();
          if (d.success) setPrescriptions(d.data);
        }
        if (lRes.ok) {
          const d = await lRes.json();
          if (d.success) setLabResults(d.data);
        }
      } catch (err) {
        console.error("Failed to load clinical records:", err);
      }
    },
    [token, getHeaders]
  );

  const fetchClinicsAndAppointments = useCallback(async () => {
    if (!token) return;
    try {
      const [clinicsRes, apptRes] = await Promise.all([
        fetch(`${API_URL}/vault/clinics`, { headers: getHeaders() }),
        fetch(`${API_URL}/vault/appointments`, { headers: getHeaders() }),
      ]);
      if (clinicsRes.ok) {
        const d = await clinicsRes.json();
        if (d.success) setClinics(d.data);
      }
      if (apptRes.ok) {
        const d = await apptRes.json();
        if (d.success) setAppointments(d.data);
      }
    } catch (err) {
      console.error("Failed to load clinics or appointments:", err);
    }
  }, [token, getHeaders]);

  const fetchDashboard = useCallback(async () => {
    if (!token) {
      window.location.assign("/patient-vault/login");
      return;
    }
    try {
      setIsLoading(true);
      setError("");
      const response = await fetch(`${API_URL}/vault/me`, { headers: getHeaders() });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load patient dashboard.");
      }
      setDashboard(result.data);
      setSelectedProfileId((prev) => prev || result.data.patient.id);
      await fetchClinicsAndAppointments();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "An error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [token, getHeaders, fetchClinicsAndAppointments]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const selectedProfile = useMemo<VaultProfile | null>(() => {
    if (!dashboard) return null;
    if (dashboard.patient.id === selectedProfileId) return dashboard.patient;
    return (
      dashboard.patient.dependents?.find((d) => d.id === selectedProfileId) || dashboard.patient
    );
  }, [dashboard, selectedProfileId]);

  useEffect(() => {
    if (selectedProfile) {
      setProfileForm({
        firstName: selectedProfile.firstName || "",
        lastName: selectedProfile.lastName || "",
        dateOfBirth: selectedProfile.dateOfBirth ? selectedProfile.dateOfBirth.slice(0, 10) : "",
        gender: selectedProfile.gender || "UNKNOWN",
        phone: selectedProfile.phone || "",
        nationalId: selectedProfile.nationalId || "",
        emergencyContactName: selectedProfile.emergencyContactName || "",
        emergencyContactPhone: selectedProfile.emergencyContactPhone || "",
        insuranceProvider: selectedProfile.insuranceProvider || "",
      });
      fetchClinicalRecords(selectedProfile.id);
    }
  }, [selectedProfile, fetchClinicalRecords]);

  // --- Appointment actions ---
  const handleBookAppointment = async (
    facilityId: string,
    service: string,
    date: string,
    time: string,
    reason: string,
    notes: string
  ) => {
    if (!facilityId || !date || !time) {
      setError("Please select a clinic, date, and time.");
      return;
    }
    setIsSubmittingBooking(true);
    setError("");
    try {
      const scheduledAtIso = new Date(`${date}T${time}:00`).toISOString();
      const response = await fetch(`${API_URL}/vault/appointments`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          profileId: selectedProfile?.id,
          facilityId,
          appointmentType: service,
          scheduledAt: scheduledAtIso,
          reason,
          notes,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to book appointment.");
      }
      setNotice("Appointment request submitted. You will receive clinic confirmation shortly.");
      setShowBookingModal(false);
      await fetchClinicsAndAppointments();
      setActiveTab("appointments");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to complete appointment booking.");
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    setCancellingAppointmentId(appointmentId);
    setError("");
    try {
      const response = await fetch(`${API_URL}/vault/appointments/${appointmentId}/cancel`, {
        method: "PATCH",
        headers: getHeaders(),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not cancel appointment.");
      }
      setNotice("Appointment cancelled.");
      await fetchClinicsAndAppointments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel appointment.");
    } finally {
      setCancellingAppointmentId(null);
    }
  };

  // --- Profile save ---
  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProfile || !profileForm) return;
    try {
      setIsSaving(true);
      setError("");
      setNotice("");
      const response = await fetch(`${API_URL}/vault/profiles/${selectedProfile.id}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify(profileForm),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to save profile changes.");
      }
      setNotice("Profile updated successfully.");
      await fetchDashboard();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Save failed.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Health records ---
  const addAllergy = async (allergen: string, reaction: string) => {
    if (!selectedProfile) return;
    try {
      setIsSaving(true);
      setError("");
      const response = await fetch(
        `${API_URL}/vault/profiles/${selectedProfile.id}/allergies`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ allergen, reaction: reaction || undefined, severity: "MILD" }),
        }
      );
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Failed to add allergy.");
      setShowAllergyModal(false);
      setNotice("Allergy recorded.");
      await fetchDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add allergy.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAllergy = async (allergyId: string) => {
    if (!selectedProfile) return;
    try {
      setIsSaving(true);
      const res = await fetch(
        `${API_URL}/vault/profiles/${selectedProfile.id}/allergies/${allergyId}`,
        { method: "DELETE", headers: getHeaders() }
      );
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Could not delete allergy.");
      setNotice("Allergy removed.");
      await fetchDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting allergy.");
    } finally {
      setIsSaving(false);
    }
  };

  const addCondition = async (name: string, description: string) => {
    if (!selectedProfile) return;
    try {
      setIsSaving(true);
      setError("");
      const response = await fetch(
        `${API_URL}/vault/profiles/${selectedProfile.id}/conditions`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ name, description: description || undefined }),
        }
      );
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Failed to add condition.");
      setShowConditionModal(false);
      setNotice("Condition saved.");
      await fetchDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add condition.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCondition = async (conditionId: string) => {
    if (!selectedProfile) return;
    try {
      setIsSaving(true);
      const res = await fetch(
        `${API_URL}/vault/profiles/${selectedProfile.id}/conditions/${conditionId}`,
        { method: "DELETE", headers: getHeaders() }
      );
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Could not delete condition.");
      setNotice("Condition removed.");
      await fetchDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting condition.");
    } finally {
      setIsSaving(false);
    }
  };

  const addDependent = async (dependent: { firstName: string; lastName: string }) => {
    try {
      setIsSaving(true);
      setError("");
      const response = await fetch(`${API_URL}/vault/dependents`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ ...emptyDependent, ...dependent }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Failed to add family member.");
      setShowDependentModal(false);
      setNotice("Family profile created.");
      await fetchDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add family profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const uploadDocument = async (
    profileId: string,
    file: File,
    title: string,
    type: string,
    description: string
  ) => {
    setIsSaving(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("type", type);
      formData.append("description", description);
      const res = await fetch(`${API_URL}/vault/profiles/${profileId}/documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }, // no Content-Type – browser sets multipart boundary
        body: formData,
      });
      const resData = await res.json();
      if (!res.ok || !resData.success) throw new Error(resData.message || "Upload failed.");
      const newDoc = resData.data;
      setDashboard((prev) => {
        if (!prev) return prev;
        // Only update main patient; dependents come through VaultProfile.dependents field
        if (prev.patient.id !== profileId) return prev;
        return {
          ...prev,
          patient: {
            ...prev.patient,
            medicalDocuments: [newDoc, ...(prev.patient.medicalDocuments || [])],
          },
        };
      });
      setNotice("Document uploaded successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload document.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteDocument = async (profileId: string, documentId: string) => {
    setIsSaving(true);
    setError("");
    try {
      const res = await fetch(
        `${API_URL}/vault/profiles/${profileId}/documents/${documentId}`,
        { method: "DELETE", headers: getHeaders() }
      );
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Delete failed.");
      setDashboard((prev) => {
        if (!prev) return prev;
        if (prev.patient.id !== profileId) return prev;
        return {
          ...prev,
          patient: {
            ...prev.patient,
            medicalDocuments: (prev.patient.medicalDocuments || []).filter(
              (d) => d.id !== documentId
            ),
          },
        };
      });
      setNotice("Document deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete document.");
    } finally {
      setIsSaving(false);
    }
  };

  const getDocumentUrl = async (profileId: string, documentId: string): Promise<string | null> => {
    try {
      const res = await fetch(
        `${API_URL}/vault/profiles/${profileId}/documents/${documentId}/download`,
        { headers: getHeaders() }
      );
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      return data.data.signedUrl as string;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not get download link.");
      return null;
    }
  };

  const upgradePlan = async () => {
    if (!paymentPhone.trim()) {
      setError("Please enter your Mobile Money phone number.");
      return;
    }
    try {
      setIsPaying(true);
      setError("");
      setNotice("");
      const response = await fetch(`${API_URL}/vault/payment/initiate`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ plan: "PREMIUM", phone: paymentPhone.trim() }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Payment initiation failed.");
      const paymentId = result.data.paymentId;
      for (let i = 0; i < 6; i++) {
        await new Promise((resolve) => window.setTimeout(resolve, 5000));
        const check = await fetch(`${API_URL}/vault/payment/${paymentId}/status`, {
          headers: getHeaders(),
        });
        const checkResult = await check.json();
        if (checkResult.success && checkResult.data.status === "SUCCESS") {
          setNotice("Payment confirmed. Your Premium Vault is now active.");
          await fetchDashboard();
          setIsPaying(false);
          return;
        }
      }
      setNotice("Payment is still processing. Check your plan status shortly.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to process payment.");
    } finally {
      setIsPaying(false);
    }
  };

  // --- Derived data ---
  const upcomingAppointments = useMemo(
    () => appointments.filter((a) => a.status === "SCHEDULED" || a.status === "CONFIRMED"),
    [appointments]
  );

  const pastAppointments = useMemo(
    () =>
      appointments.filter(
        (a) => a.status === "COMPLETED" || a.status === "CANCELLED" || a.status === "NO_SHOW"
      ),
    [appointments]
  );

  const profileOptions = useMemo(() => {
    if (!dashboard) return [];
    const list = [
      {
        id: dashboard.patient.id,
        name: `${dashboard.patient.firstName} ${dashboard.patient.lastName}`,
        isDependent: false,
      },
    ];
    dashboard.patient.dependents?.forEach((d) => {
      list.push({
        id: d.id,
        name: `${d.firstName} ${d.lastName}`,
        isDependent: true,
      });
    });
    return list;
  }, [dashboard]);

  // --- Loading / Error screens ---
  if (isLoading) {
    return (
      <div className="h-dvh flex items-center justify-center bg-[#F6F8FA]">
        <div className="text-center">
          <LoaderCircle className="animate-spin text-[#007C8C] mx-auto mb-3" size={36} />
          <p className="text-[#0F2942] text-[14px] font-medium">Loading your Patient Vault...</p>
        </div>
      </div>
    );
  }

  if (!dashboard || !selectedProfile || !profileForm) {
    return (
      <main className="h-dvh bg-[#F6F8FA] px-4 flex items-center justify-center">
        <div className="max-w-md w-full rounded-xl border border-[#E4EBF0] bg-white p-6 text-center">
          <AlertCircle size={40} className="text-red-500 mx-auto mb-3" />
          <h1 className="text-[18px] font-semibold text-[#0F2942]">Patient Vault Unavailable</h1>
          <p className="mt-1.5 text-[13px] text-[#475B6B]">
            {error || "We could not load your account session."}
          </p>
          <button
            onClick={() => window.location.assign("/patient-vault/login")}
            className="mt-5 w-full rounded-lg bg-[#003F66] hover:bg-[#003252] px-4 py-2.5 text-[13px] font-semibold text-white transition-colors"
          >
            Sign in again
          </button>
        </div>
      </main>
    );
  }

  const subscription = dashboard.subscription;
  const isPremium = subscription?.plan === "PREMIUM";

  return (
    <AppLayout
      currentRole="patient"
      activeNavId={activeTab}
      onNavSelect={(id) => setActiveTab(id as TabId)}
      userDisplayName={`${dashboard.patient.firstName} ${dashboard.patient.lastName}`}
      userEmail={dashboard.patient.email || undefined}
      profiles={profileOptions}
      selectedProfileId={selectedProfileId}
      onSelectProfileId={(id) => setSelectedProfileId(id)}
      onBookAppointmentClick={() => {
        setActiveTab("appointments");
        setShowBookingModal(true);
      }}
      onNotificationsClick={() => setActiveTab("notifications")}
      hasUnreadNotifications={false}
    >
      <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
        {/* Status / Notice alerts */}
        {(error || notice) && (
          <div
            role={error ? "alert" : "status"}
            className={`flex items-start justify-between gap-3 p-3.5 rounded-xl text-[13px] border ${
              error
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}
          >
            <div className="flex items-start gap-2">
              {error ? (
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
              ) : (
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
              )}
              <span>{error || notice}</span>
            </div>
            <button
              onClick={() => {
                setError("");
                setNotice("");
              }}
              className="text-[12px] font-semibold opacity-60 hover:opacity-100 p-0.5"
              aria-label="Dismiss alert"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Tab content */}
        {activeTab === "overview" && (
          <VaultOverviewTab
            dashboard={dashboard}
            selectedProfile={selectedProfile}
            upcomingAppointments={upcomingAppointments}
            consultations={consultations}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenBooking={() => setShowBookingModal(true)}
            onCancelAppointment={handleCancelAppointment}
            cancellingAppointmentId={cancellingAppointmentId}
          />
        )}

        {activeTab === "appointments" && (
          <VaultAppointmentsTab
            upcomingAppointments={upcomingAppointments}
            pastAppointments={pastAppointments}
            clinics={clinics}
            onOpenBookingModal={(facilityId) => {
              setBookingInitialClinicId(facilityId || clinics[0]?.id || "");
              setShowBookingModal(true);
            }}
            onCancelAppointment={handleCancelAppointment}
            cancellingAppointmentId={cancellingAppointmentId}
          />
        )}

        {activeTab === "history" && (
          <VaultHistoryTab
            selectedProfile={selectedProfile}
            isSaving={isSaving}
            onOpenAllergyModal={() => setShowAllergyModal(true)}
            onOpenConditionModal={() => setShowConditionModal(true)}
            onDeleteAllergy={deleteAllergy}
            onDeleteCondition={deleteCondition}
          />
        )}

        {activeTab === "consultations" && (
          <VaultConsultationsTab consultations={consultations} />
        )}

        {activeTab === "prescriptions" && (
          <VaultPrescriptionsTab prescriptions={prescriptions} labResults={labResults} />
        )}

        {activeTab === "documents" && (
          <VaultDocumentsTab
            selectedProfile={selectedProfile}
            isPremium={isPremium}
            isSaving={isSaving}
            onUploadDocument={(file, title, type, description) =>
              uploadDocument(selectedProfile.id, file, title, type, description)
            }
            onDeleteDocument={(documentId) =>
              deleteDocument(selectedProfile.id, documentId)
            }
            onGetDownloadUrl={(documentId) =>
              getDocumentUrl(selectedProfile.id, documentId)
            }
          />
        )}

        {activeTab === "notifications" && (
          <VaultNotificationsTab upcomingAppointments={upcomingAppointments} />
        )}

        {activeTab === "family" && (
          <VaultFamilyTab
            dashboard={dashboard}
            selectedProfileId={selectedProfileId}
            onSelectProfileId={(id) => setSelectedProfileId(id)}
            onOpenDependentModal={() => setShowDependentModal(true)}
          />
        )}

        {activeTab === "profile" && (
          <VaultProfileTab
            selectedProfile={selectedProfile}
            profileForm={profileForm}
            isSaving={isSaving}
            onFormChange={(updates) =>
              setProfileForm((prev) => (prev ? { ...prev, ...updates } : prev))
            }
            onSave={saveProfile}
          />
        )}

        {activeTab === "billing" && (
          <VaultBillingTab
            subscription={subscription}
            isPremium={isPremium}
            isPaying={isPaying}
            paymentPhone={paymentPhone}
            onPaymentPhoneChange={setPaymentPhone}
            onUpgradePlan={upgradePlan}
          />
        )}
      </div>

      {/* Modals */}
      <BookAppointmentModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        clinics={clinics}
        initialClinicId={bookingInitialClinicId}
        isSubmitting={isSubmittingBooking}
        onSubmit={handleBookAppointment}
      />

      <AddAllergyModal
        isOpen={showAllergyModal}
        onClose={() => setShowAllergyModal(false)}
        isSaving={isSaving}
        onSubmit={addAllergy}
      />

      <AddConditionModal
        isOpen={showConditionModal}
        onClose={() => setShowConditionModal(false)}
        isSaving={isSaving}
        onSubmit={addCondition}
      />

      <AddDependentModal
        isOpen={showDependentModal}
        onClose={() => setShowDependentModal(false)}
        isSaving={isSaving}
        onSubmit={addDependent}
      />
    </AppLayout>
  );
}
