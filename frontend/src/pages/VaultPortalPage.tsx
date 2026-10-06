import { FileText, ShieldCheck, Download, Upload, FolderOpen, Clock } from "lucide-react";

export default function VaultPortalPage() {
  return (
    <div className="min-h-screen bg-section-tint py-8 md:py-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-navy mb-2">Patient Vault Portal</h1>
            <p className="text-body-text">Your secure health records storage</p>
          </div>
          <button
            onClick={() => window.location.href = "/"}
            className="text-sm text-body-text hover:text-navy inline-flex items-center gap-1"
          >
            Back to Home
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-pale-cyan rounded-full flex items-center justify-center">
                <FileText size={20} className="text-teal" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy">12</p>
                <p className="text-xs text-body-text">Records</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-pale-cyan rounded-full flex items-center justify-center">
                <FolderOpen size={20} className="text-teal" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy">5</p>
                <p className="text-xs text-body-text">Documents</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-pale-cyan rounded-full flex items-center justify-center">
                <ShieldCheck size={20} className="text-teal" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy">Active</p>
                <p className="text-xs text-body-text">Security</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-navy">Your Records</h2>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-teal rounded-lg hover:bg-teal/90 transition-colors">
              <Upload size={16} />
              Upload
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-section-tint rounded-lg">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-teal" />
                <div>
                  <p className="font-semibold text-navy text-sm">Clinical Record - OPD Visit</p>
                  <p className="text-xs text-body-text">March 15, 2026</p>
                </div>
              </div>
              <button className="p-2 hover:bg-white rounded-lg transition-colors">
                <Download size={16} className="text-body-text" />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-section-tint rounded-lg">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-teal" />
                <div>
                  <p className="font-semibold text-navy text-sm">Laboratory Results - CBC Panel</p>
                  <p className="text-xs text-body-text">March 10, 2026</p>
                </div>
              </div>
              <button className="p-2 hover:bg-white rounded-lg transition-colors">
                <Download size={16} className="text-body-text" />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-section-tint rounded-lg">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-teal" />
                <div>
                  <p className="font-semibold text-navy text-sm">Prescription - Antibiotics</p>
                  <p className="text-xs text-body-text">March 5, 2026</p>
                </div>
              </div>
              <button className="p-2 hover:bg-white rounded-lg transition-colors">
                <Download size={16} className="text-body-text" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white border border-border rounded-lg p-6">
          <div className="flex items-center gap-2 text-sm text-body-text">
            <Clock size={14} />
            <span>Last synced: Just now</span>
          </div>
        </div>
      </div>
    </div>
  );
}
