import { useState, useRef, type ChangeEvent } from "react";
import { FileText, ShieldCheck, Upload, X, Download, Trash2, Lock } from "lucide-react";
import type { VaultProfile } from "./types";
import { formatDate } from "./types";
import { PageHeader, Card, StatusBadge, EmptyState } from "./components/ui";

export interface VaultDocumentsTabProps {
  selectedProfile: VaultProfile;
  isPremium: boolean;
  isSaving: boolean;
  onUploadDocument: (file: File, title: string, type: string, description: string) => Promise<void>;
  onDeleteDocument: (documentId: string) => Promise<void>;
  onGetDownloadUrl: (documentId: string) => Promise<string | null>;
}

const DOCUMENT_TYPES = [
  { value: "MEDICAL_REPORT", label: "Medical Report" },
  { value: "LAB_RESULT", label: "Lab Result" },
  { value: "RADIOLOGY_REPORT", label: "Radiology Report" },
  { value: "PRESCRIPTION", label: "Prescription" },
  { value: "REFERRAL", label: "Referral Letter" },
  { value: "INSURANCE_DOCUMENT", label: "Insurance Document" },
  { value: "IDENTIFICATION", label: "Identification" },
  { value: "OTHER", label: "Other" },
];

function insuranceVariant(status: string) {
  const s = status.toUpperCase();
  if (s === "ACTIVE") return "green";
  if (s === "EXPIRED") return "gray";
  if (s === "PENDING") return "amber";
  return "blue";
}

export default function VaultDocumentsTab({
  selectedProfile,
  isPremium,
  isSaving,
  onUploadDocument,
  onDeleteDocument,
  onGetDownloadUrl,
}: VaultDocumentsTabProps) {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("MEDICAL_REPORT");
  const [description, setDescription] = useState("");
  const [fileError, setFileError] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
  const MAX_SIZE = 15 * 1024 * 1024;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ALLOWED_TYPES.includes(f.type)) {
      setFileError("Only PDF, JPEG, PNG, or WebP files are allowed.");
      setFile(null);
      return;
    }
    if (f.size > MAX_SIZE) {
      setFileError("File must be smaller than 15 MB.");
      setFile(null);
      return;
    }
    setFileError("");
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) return;
    await onUploadDocument(file, title.trim(), type, description.trim());
    // Reset form
    setFile(null);
    setTitle("");
    setType("MEDICAL_REPORT");
    setDescription("");
    setShowUploadForm(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDownload = async (docId: string) => {
    setDownloadingId(docId);
    try {
      const url = await onGetDownloadUrl(docId);
      if (url) window.open(url, "_blank", "noopener noreferrer");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!window.confirm("Delete this document? This action cannot be undone.")) return;
    setDeletingId(docId);
    try {
      await onDeleteDocument(docId);
    } finally {
      setDeletingId(null);
    }
  };

  const INPUT_CLASS =
    "w-full h-9 text-[13px] bg-white rounded-lg border border-[#E4EBF0] px-3 text-[#0F2942] mt-1 focus:outline-none focus:ring-1 focus:ring-[#007C8C]";
  const LABEL_CLASS = "text-[13px] font-medium text-[#475B6B] block";

  return (
    <div className="space-y-4">
      <PageHeader
        title="Documents"
        description="Medical reports, referral letters, and linked insurance policies"
        action={
          isPremium ? (
            <button
              type="button"
              onClick={() => setShowUploadForm((v) => !v)}
              className="h-9 px-3.5 rounded-lg bg-[#003F66] hover:bg-[#003252] text-white text-[13px] font-semibold flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Upload size={14} />
              <span>{showUploadForm ? "Cancel" : "Upload document"}</span>
            </button>
          ) : (
            <span className="h-9 px-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[12px] font-medium flex items-center gap-1.5 shrink-0">
              <Lock size={13} />
              Premium feature
            </span>
          )
        }
      />

      {/* Upload Form (Premium only, shown inline) */}
      {isPremium && showUploadForm && (
        <Card title="Upload a new document">
          <div className="space-y-3.5">
            {/* File picker */}
            <div>
              <label className={LABEL_CLASS}>File (PDF, JPEG, PNG, WebP · max 15 MB)</label>
              <div
                className="mt-1 border-2 border-dashed border-[#E4EBF0] rounded-lg p-4 text-center cursor-pointer hover:border-[#007C8C] hover:bg-[#F6F8FA] transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {file ? (
                  <div className="flex items-center justify-center gap-2 text-[13px] text-[#0F2942] font-medium">
                    <FileText size={16} className="text-[#007C8C]" />
                    <span className="truncate max-w-[260px]">{file.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="text-[#7A8D9B] hover:text-red-600 p-0.5 rounded shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="text-[13px] text-[#7A8D9B]">
                    <Upload size={20} className="mx-auto mb-1 text-[#C4CFD8]" />
                    Click to choose a file
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              {fileError && <p className="text-[12px] text-red-600 mt-1">{fileError}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className={LABEL_CLASS}>Document title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Blood Test Results Jan 2025"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Document type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className={INPUT_CLASS}
                >
                  {DOCUMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={LABEL_CLASS}>Notes (optional)</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Issued by City Hospital, Dr. Kayitesi"
                className={INPUT_CLASS}
              />
            </div>

            <div className="flex justify-end gap-2 pt-1 border-t border-[#E4EBF0]">
              <button
                type="button"
                onClick={() => {
                  setShowUploadForm(false);
                  setFile(null);
                  setTitle("");
                  setFileError("");
                }}
                className="h-9 px-3.5 rounded-lg border border-[#E4EBF0] text-[13px] font-medium text-[#475B6B] hover:bg-[#F6F8FA] transition-colors shrink-0"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!file || !title.trim() || isSaving}
                onClick={handleUpload}
                className="h-9 px-4 rounded-lg bg-[#003F66] hover:bg-[#003252] text-white text-[13px] font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-colors shrink-0"
              >
                {isSaving ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Upgrade prompt for Basic plan users */}
      {!isPremium && (
        <Card title="Document uploads">
          <div className="py-2 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2.5 flex-1">
              <Lock size={16} className="text-amber-600 shrink-0" />
              <div>
                <p className="text-[14px] font-semibold text-[#0F2942]">Premium feature</p>
                <p className="text-[12px] text-[#7A8D9B] mt-0.5">
                  Upgrade to Premium to upload personal medical documents, reports, and referral letters securely.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Medical Documents List */}
      <Card
        title="Medical documents"
        subtitle={`${selectedProfile.medicalDocuments.length} file${selectedProfile.medicalDocuments.length !== 1 ? "s" : ""} on record`}
      >
        {selectedProfile.medicalDocuments.length > 0 ? (
          <div className="divide-y divide-[#E4EBF0]">
            {selectedProfile.medicalDocuments.map((doc) => (
              <div key={doc.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center gap-3">
                <FileText size={16} className="text-[#7A8D9B] shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-[14px] font-semibold text-[#0F2942] block truncate">
                    {doc.title}
                  </span>
                  <span className="text-[12px] text-[#7A8D9B]">
                    {doc.type.replace(/_/g, " ")} · {formatDate(doc.createdAt)}
                    {doc.mimeType && ` · ${doc.mimeType.split("/")[1]?.toUpperCase()}`}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {/* Download / view button */}
                  <button
                    type="button"
                    onClick={() => handleDownload(doc.id)}
                    disabled={downloadingId === doc.id}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-[#475B6B] hover:text-[#003F66] hover:bg-[#F0F4F8] transition-colors disabled:opacity-50"
                    title="Download / view"
                  >
                    <Download size={15} />
                  </button>
                  {/* Delete button – only for patient-uploaded docs (no uploadedById check needed; backend enforces it) */}
                  {isPremium && (
                    <button
                      type="button"
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id || isSaving}
                      className="h-8 w-8 flex items-center justify-center rounded-lg text-[#7A8D9B] hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      title="Delete document"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="No documents on file"
            hint={
              isPremium
                ? "Upload PDFs, lab results, or referral letters using the button above."
                : "Medical documents shared by clinics or uploaded by Premium members appear here."
            }
          />
        )}
      </Card>

      {/* Insurance Policies */}
      <Card
        title="Insurance policies"
        subtitle="Linked health insurance memberships and coverage numbers."
      >
        {selectedProfile.patientInsurances.length > 0 ? (
          <div className="divide-y divide-[#E4EBF0]">
            {selectedProfile.patientInsurances.map((ins) => (
              <div key={ins.id} className="py-2.5 first:pt-0 last:pb-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
                  <div className="min-w-0">
                    <span className="text-[14px] font-semibold text-[#0F2942] block">
                      {ins.plan.provider.name} — {ins.plan.name}
                    </span>
                    <span className="text-[12px] text-[#7A8D9B] font-mono">
                      Member ID: {ins.membershipNumber}
                    </span>
                  </div>
                  <StatusBadge
                    status={ins.status}
                    variant={insuranceVariant(ins.status)}
                    className="self-start sm:self-auto shrink-0"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={ShieldCheck}
            title="No insurance policies linked"
            hint={`Current payment method: ${selectedProfile.insuranceProvider || "Direct payer"}.`}
          />
        )}
      </Card>
    </div>
  );
}
