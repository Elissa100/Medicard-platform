import { useState, useEffect } from "react";
import AppLayout from "../../components/layout/AppLayout";
import { fetchUsers, updateUserStatus, getAdminData } from "../../services/admin";
import {
  Users,
  Search,
  Shield,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

interface UserItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  facility: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const admin = getAdminData();

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchUsers({ search, role: roleFilter });
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers();
  };

  const handleToggleStatus = async (user: UserItem) => {
    const nextStatus = !user.isActive;
    try {
      await updateUserStatus(user.id, nextStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: nextStatus } : u))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update user status");
    }
  };

  const formatRole = (role: string) => {
    return role.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <AppLayout
      currentRole="platform_admin"
      pageTitle="User accounts and permissions"
      pageSubtitle="Staff, clinicians, and system user directory (account data only)"
      activeNavId="users"
      userDisplayName={admin.firstName ? `${admin.firstName} ${admin.lastName}` : "Platform Admin"}
      userEmail={admin.email || "admin@medcard.rw"}
      actionButton={{
        label: "Refresh",
        onClick: loadUsers,
        icon: <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />,
      }}
    >
      <div className="p-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={loadUsers} className="text-xs font-semibold underline">
              Try again
            </button>
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8D9B]" />
              <input
                type="text"
                placeholder="Search user by name or email..."
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
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-9 px-3 rounded-lg text-xs font-medium border border-[#E4EBF0] bg-white text-[#475B6B] focus:outline-none focus:ring-2 focus:ring-[#00A3B8]"
            >
              <option value="ALL">All roles</option>
              <option value="HOSPITAL_ADMIN">Hospital admin</option>
              <option value="DOCTOR">Doctor</option>
              <option value="NURSE">Nurse</option>
              <option value="PHARMACIST">Pharmacist</option>
              <option value="LABORATORY">Laboratory</option>
              <option value="RECEPTIONIST">Receptionist</option>
              <option value="CASHIER">Cashier</option>
              <option value="PLATFORM_ADMIN">Platform admin</option>
            </select>
          </div>
        </div>

        {/* Users Table Card */}
        <div className="bg-white border border-[#E4EBF0] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F6F8FA] border-b border-[#E4EBF0] text-xs font-semibold text-[#7A8D9B]">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Affiliated clinic</th>
                  <th className="py-3 px-4">Account status</th>
                  <th className="py-3 px-4">Joined date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4EBF0]">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-[#7A8D9B]">
                      <LoaderCircle size={20} className="animate-spin mx-auto mb-2 text-[#00A3B8]" />
                      Loading user accounts...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-[#7A8D9B]">
                      <Users size={24} className="mx-auto mb-2 text-[#7A8D9B]" />
                      No user accounts found matching your query.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-[#F6F8FA]/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-[#0B1F3A] block">
                          {user.firstName} {user.lastName}
                        </span>
                        <span className="text-xs text-[#7A8D9B]">{user.email}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-[#F0F4F8] text-[#0B1F3A]">
                          <Shield size={11} className="text-[#00A3B8]" />
                          {formatRole(user.role)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#475B6B]">
                        {user.facility ? (
                          <span>
                            {user.facility.name} ({user.facility.code})
                          </span>
                        ) : (
                          <span className="text-[#7A8D9B]">MedCard platform</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {user.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Suspended
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#7A8D9B]">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {user.role === "PLATFORM_ADMIN" ? (
                          <span className="text-xs text-[#7A8D9B] italic">Protected</span>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className={`h-8 px-3 rounded-lg text-xs font-medium border transition-colors ${
                              user.isActive
                                ? "bg-white text-rose-600 border-rose-200 hover:bg-rose-50"
                                : "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                            }`}
                          >
                            {user.isActive ? "Suspend" : "Reactivate"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

