import { useState, useRef, type ChangeEvent } from "react";
import {
  FileText,
  ShieldCheck,
  Upload,
  X,
  Download,
  Trash2,
  Lock,
  Eye,
  ExternalLink,
  RotateCw,
  Loader2,
} from "lucide-react";
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

/**
 * Compresses an image in-browser before upload to keep upload times well under 2-3 seconds.
 */
async function compressImageIfNeeded(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return file;
  }
  // If file is already small (<= 800 KB), skip compression
  if (file.size <= 800 * 1024) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.onload = () => {
        const maxDimension = 1920;
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              const compressed = new File([blob], file.name, {
                type: blob.type || file.type,
                lastModified: Date.now(),
              });
              resolve(compressed);
            } else {
              resolve(file);
            }
          },
          file.type === "image/png" ? "image/png" : "image/jpeg",
          0.85
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
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
  const [isCompressing, setIsCompressing] = useState(false);

  // Document preview modal state
  const [previewDoc, setPreviewDoc] = useState<{
    id: string;
    title: string;
    type: string;
    mimeType?: string | null;
    createdAt?: string;
    url: string;
    useGoogleViewer: boolean;
  } | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);

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
    setIsCompressing(true);
    try {
      const readyFile = await compressImageIfNeeded(file);
      await onUploadDocument(readyFile, title.trim(), type, description.trim());
      // Reset form
      setFile(null);
      setTitle("");
      setType("MEDICAL_REPORT");
      setDescription("");
      setShowUploadForm(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setIsCompressing(false);
    }
  };

  const handlePreview = async (doc: (typeof selectedProfile.medicalDocuments)[0]) => {
    setPreviewLoadingId(doc.id);
    try {
      const url = await onGetDownloadUrl(doc.id);
      if (url) {
        const isMobile =
          typeof navigator !== "undefined" &&
          /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const isPdf =
          doc.mimeType?.includes("pdf") || doc.title.toLowerCase().endsWith(".pdf");
        setPreviewDoc({
          id: doc.id,
          title: doc.title,
          type: doc.type,
          mimeType: doc.mimeType,
          createdAt: doc.createdAt,
          url,
          useGoogleViewer: !!(isMobile && isPdf),
        });
      }
    } finally {
      setPreviewLoadingId(null);
    }
  };

  const handleDownload = async (docId: string) => {
    setDownloadingId(docId);
    try {
      const url = await onGetDownloadUrl(docId);
      if (url) {
        // Trigger download via anchor
        const a = document.createElement("a");
        a.href = url;
        a.download = "";
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
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
                disabled={!file || !title.trim() || isSaving || isCompressing}
                onClick={handleUpload}
                className="h-9 px-4 rounded-lg bg-[#003F66] hover:bg-[#003252] text-white text-[13px] font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-colors shrink-0"
              >
                {isCompressing ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Optimizing...</span>
                  </>
                ) : isSaving ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <span>Upload</span>
                )}
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
                <div
                  className="flex-1 min-w-0 cursor-pointer group"
                  onClick={() => handlePreview(doc)}
                  title="Click to preview document"
                >
                  <span className="text-[14px] font-semibold text-[#0F2942] group-hover:text-[#007C8C] transition-colors block truncate">
                    {doc.title}
                  </span>
                  <span className="text-[12px] text-[#7A8D9B]">
                    {doc.type.replace(/_/g, " ")} · {formatDate(doc.createdAt)}
                    {doc.mimeType && ` · ${doc.mimeType.split("/")[1]?.toUpperCase()}`}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {/* Preview button */}
                  <button
                    type="button"
                    onClick={() => handlePreview(doc)}
                    disabled={previewLoadingId === doc.id}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-[#475B6B] hover:text-[#003F66] hover:bg-[#F0F4F8] transition-colors disabled:opacity-50"
                    title="Preview document"
                  >
                    {previewLoadingId === doc.id ? (
                      <Loader2 size={15} className="animate-spin text-[#007C8C]" />
                    ) : (
                      <Eye size={15} />
                    )}
                  </button>
                  {/* Download button */}
                  <button
                    type="button"
                    onClick={() => handleDownload(doc.id)}
                    disabled={downloadingId === doc.id}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-[#475B6B] hover:text-[#003F66] hover:bg-[#F0F4F8] transition-colors disabled:opacity-50"
                    title="Download file"
                  >
                    {downloadingId === doc.id ? (
                      <Loader2 size={15} className="animate-spin text-[#007C8C]" />
                    ) : (
                      <Download size={15} />
                    )}
                  </button>
                  {/* Delete button – only for patient-uploaded docs */}
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

      {/* Universal Document Preview Modal (Mobile & Desktop) */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity"
          onClick={() => setPreviewDoc(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-[#E4EBF0]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-[#E4EBF0] flex items-center justify-between gap-3 bg-[#F8FAFC]">
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={18} className="text-[#007C8C] shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-semibold text-[#0F2942] truncate">
                    {previewDoc.title}
                  </h3>
                  <p className="text-[11px] text-[#7A8D9B]">
                    {previewDoc.type.replace(/_/g, " ")} · {previewDoc.mimeType?.toUpperCase() || "DOCUMENT"}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* PDF Alternate Viewer Toggle */}
                {(previewDoc.mimeType?.includes("pdf") || previewDoc.title.toLowerCase().endsWith(".pdf")) && (
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewDoc((prev) =>
                        prev ? { ...prev, useGoogleViewer: !prev.useGoogleViewer } : null
                      )
                    }
                    className="h-8 px-2.5 rounded-lg border border-[#E4EBF0] bg-white hover:bg-[#F0F4F8] text-[12px] font-medium text-[#475B6B] flex items-center gap-1.5 transition-colors"
                    title={previewDoc.useGoogleViewer ? "Switch to native PDF view" : "Switch to mobile PDF viewer"}
                  >
                    <RotateCw size={12} />
                    <span className="hidden sm:inline">
                      {previewDoc.useGoogleViewer ? "Native view" : "Mobile viewer"}
                    </span>
                  </button>
                )}

                {/* Open in new tab / fullscreen */}
                <a
                  href={previewDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 px-2.5 rounded-lg border border-[#E4EBF0] bg-white hover:bg-[#F0F4F8] text-[12px] font-medium text-[#475B6B] flex items-center gap-1.5 transition-colors"
                  title="Open original in new tab"
                >
                  <ExternalLink size={13} />
                  <span className="hidden sm:inline">Fullscreen</span>
                </a>

                {/* Direct Download */}
                <button
                  type="button"
                  onClick={() => handleDownload(previewDoc.id)}
                  className="h-8 px-2.5 rounded-lg bg-[#003F66] hover:bg-[#003252] text-white text-[12px] font-medium flex items-center gap-1.5 transition-colors"
                  title="Download file"
                >
                  <Download size={13} />
                  <span className="hidden sm:inline">Download</span>
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-[#7A8D9B] hover:text-[#0F2942] hover:bg-[#F0F4F8] transition-colors"
                  aria-label="Close preview"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 min-h-[50vh] sm:min-h-[68vh] max-h-[78vh] p-2 sm:p-4 overflow-auto flex items-center justify-center bg-[#F1F5F9]">
              {previewDoc.mimeType?.startsWith("image/") ? (
                <img
                  src={previewDoc.url}
                  alt={previewDoc.title}
                  className="max-h-[72vh] max-w-full w-auto h-auto object-contain rounded-lg shadow-md bg-white"
                />
              ) : previewDoc.mimeType?.includes("pdf") || previewDoc.title.toLowerCase().endsWith(".pdf") ? (
                <div className="w-full h-full flex flex-col">
                  <iframe
                    src={
                      previewDoc.useGoogleViewer
                        ? `https://docs.google.com/viewer?url=${encodeURIComponent(previewDoc.url)}&embedded=true`
                        : previewDoc.url
                    }
                    className="w-full h-full min-h-[55vh] sm:min-h-[68vh] rounded-lg border border-[#E4EBF0] bg-white shadow-inner"
                    title={previewDoc.title}
                  />
                  <p className="text-[11px] text-[#7A8D9B] text-center mt-2">
                    {previewDoc.useGoogleViewer ? "Using Mobile PDF Viewer." : "Using browser PDF engine."}{" "}
                    Can't see pages? Tap{" "}
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewDoc((prev) =>
                          prev ? { ...prev, useGoogleViewer: !prev.useGoogleViewer } : null
                        )
                      }
                      className="text-[#007C8C] underline font-medium hover:text-[#003F66]"
                    >
                      switch viewer
                    </button>{" "}
                    or{" "}
                    <a
                      href={previewDoc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#007C8C] underline font-medium hover:text-[#003F66]"
                    >
                      open fullscreen
                    </a>
                    .
                  </p>
                </div>
              ) : (
                <div className="text-center p-8 bg-white rounded-xl border border-[#E4EBF0] shadow-sm max-w-md">
                  <FileText size={40} className="mx-auto text-[#007C8C] mb-3" />
                  <p className="text-sm font-semibold text-[#0F2942] mb-1">{previewDoc.title}</p>
                  <p className="text-xs text-[#7A8D9B] mb-4">
                    Preview is not supported for this file format in the browser.
                  </p>
                  <a
                    href={previewDoc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#003F66] text-white text-xs font-semibold hover:bg-[#003252] transition-colors"
                  >
                    <Download size={13} />
                    Download to view
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
