import { useState, useEffect, type FormEvent } from "react";
import AppLayout from "../../components/layout/AppLayout";
import { fetchCards, linkCard, updateCardStatus, getAdminData } from "../../services/admin";
import {
  CreditCard,
  Search,
  Plus,
  X,
  LoaderCircle,
} from "lucide-react";

interface CardItem {
  id: string;
  cardUid: string;
  status: "ACTIVE" | "BLOCKED" | "LOST" | "EXPIRED" | "REPLACED";
  issuedAt: string;
  lastUsedAt: string | null;
  patient: {
    id: string;
    patientNumber: string;
    name: string;
    maskedPhone: string;
    maskedNationalId: string;
  } | null;
}

export default function AdminCardsPage() {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [cardUidInput, setCardUidInput] = useState("");
  const [patientIdInput, setPatientIdInput] = useState("");
  const [isLinking, setIsLinking] = useState(false);

  const admin = getAdminData();

  const loadCards = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchCards({ search, status: statusFilter });
      setCards(data.cards);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cards");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, [statusFilter]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    loadCards();
  };

  const handleLinkCard = async (e: FormEvent) => {
    e.preventDefault();
    setIsLinking(true);
    try {
      await linkCard(cardUidInput.trim(), patientIdInput.trim());
      setShowModal(false);
      setCardUidInput("");
      setPatientIdInput("");
      loadCards();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to link card");
    } finally {
      setIsLinking(false);
    }
  };

  const handleStatusChange = async (cardUid: string, nextStatus: string) => {
    try {
      await updateCardStatus(cardUid, nextStatus);
      setCards((prev) =>
        prev.map((c) => (c.cardUid === cardUid ? { ...c, status: nextStatus as CardItem["status"] } : c))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update card status");
    }
  };

  const renderStatusBadge = (status: CardItem["status"]) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        );
      case "BLOCKED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Blocked
          </span>
        );
      case "LOST":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Lost
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  return (
    <AppLayout
      currentRole="platform_admin"
      pageTitle="NFC card inventory"
      pageSubtitle="Physical MedCard tags, linked patient profiles, and card status"
      activeNavId="cards"
      userDisplayName={admin.firstName ? `${admin.firstName} ${admin.lastName}` : "Platform Admin"}
      userEmail={admin.email || "admin@medcard.rw"}
      actionButton={{
        label: "Link card",
        onClick: () => setShowModal(true),
        icon: <Plus size={14} />,
      }}
    >
      <div className="p-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={loadCards} className="text-xs font-semibold underline">
              Try again
            </button>
          </div>
        )}

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8D9B]" />
              <input
                type="text"
                placeholder="Search by card UID or patient..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 bg-white border border-[#E4EBF0] rounded-lg text-sm text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#00A3B8] placeholder:text-[#7A8D9B]"
              />
            </div>
            <button
              type="submit"
              className="h-9 px-3 rounded-lg text-xs font-semibold bg-[#0B1F3A] text-white hover:bg-[#0B1F3A]/90 transition-colors"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 rounded-lg text-xs font-medium border border-[#E4EBF0] bg-white text-[#475B6B] focus:outline-none focus:ring-2 focus:ring-[#00A3B8]"
            >
              <option value="ALL">All card statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="BLOCKED">Blocked</option>
              <option value="LOST">Lost</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
        </div>

        {/* Cards Table Card */}
        <div className="bg-white border border-[#E4EBF0] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F6F8FA] border-b border-[#E4EBF0] text-xs font-semibold text-[#7A8D9B]">
                <tr>
                  <th className="py-3 px-4">Card UID</th>
                  <th className="py-3 px-4">Linked patient</th>
                  <th className="py-3 px-4">Contact (Masked)</th>
                  <th className="py-3 px-4">Issued date</th>
                  <th className="py-3 px-4">Last tap</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4EBF0]">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-[#7A8D9B]">
                      <LoaderCircle size={20} className="animate-spin mx-auto mb-2 text-[#00A3B8]" />
                      Loading card inventory...
                    </td>
                  </tr>
                ) : cards.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-[#7A8D9B]">
                      <CreditCard size={24} className="mx-auto mb-2 text-[#7A8D9B]" />
                      No cards found matching your query.
                    </td>
                  </tr>
                ) : (
                  cards.map((card) => (
                    <tr key={card.id} className="hover:bg-[#F6F8FA]/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#F0F4F8] text-[#0B1F3A] font-semibold">
                          {card.cardUid}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {card.patient ? (
                          <div>
                            <span className="font-semibold text-[#0B1F3A] block">
                              {card.patient.name}
                            </span>
                            <span className="text-xs text-[#7A8D9B] font-mono">
                              {card.patient.patientNumber}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-[#7A8D9B] italic">Unassigned card</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#475B6B]">
                        {card.patient?.maskedPhone || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#7A8D9B]">
                        {new Date(card.issuedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#7A8D9B]">
                        {card.lastUsedAt ? new Date(card.lastUsedAt).toLocaleDateString() : "Never tapped"}
                      </td>
                      <td className="py-3.5 px-4">{renderStatusBadge(card.status)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {card.status === "ACTIVE" ? (
                            <>
                              <button
                                onClick={() => handleStatusChange(card.cardUid, "BLOCKED")}
                                className="h-7 px-2.5 rounded text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200"
                              >
                                Block
                              </button>
                              <button
                                onClick={() => handleStatusChange(card.cardUid, "LOST")}
                                className="h-7 px-2.5 rounded text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200"
                              >
                                Mark lost
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleStatusChange(card.cardUid, "ACTIVE")}
                              className="h-7 px-2.5 rounded text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                            >
                              Reactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Link Card Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F3A]/40 backdrop-blur-xs">
            <div className="bg-white border border-[#E4EBF0] rounded-xl w-full max-w-md p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#E4EBF0] pb-3">
                <h3 className="text-base font-semibold text-[#0B1F3A]">Link card to patient</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg text-[#7A8D9B] hover:text-[#0B1F3A] hover:bg-[#F6F8FA]"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleLinkCard} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0B1F3A] mb-1">
                    Card UID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 04A1B2C3D4E5"
                    value={cardUidInput}
                    onChange={(e) => setCardUidInput(e.target.value)}
                    className="w-full h-9 px-3 border border-[#E4EBF0] rounded-lg text-sm text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#00A3B8] font-mono"
                  />
                  <p className="text-[11px] text-[#7A8D9B] mt-1">
                    Hardware tag identifier from NFC reader.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B1F3A] mb-1">
                    Patient number or national ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MC-2026-0811 or 1 1995..."
                    value={patientIdInput}
                    onChange={(e) => setPatientIdInput(e.target.value)}
                    className="w-full h-9 px-3 border border-[#E4EBF0] rounded-lg text-sm text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#00A3B8]"
                  />
                  <p className="text-[11px] text-[#7A8D9B] mt-1">
                    Can be patient record number (MC-...) or National ID.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E4EBF0]">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="h-9 px-4 rounded-lg text-xs font-semibold text-[#475B6B] border border-[#E4EBF0] hover:bg-[#F6F8FA]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLinking}
                    className="h-9 px-4 rounded-lg text-xs font-semibold text-white bg-[#00A3B8] hover:bg-[#008FA2] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isLinking && <LoaderCircle size={14} className="animate-spin" />}
                    <span>Link card</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
