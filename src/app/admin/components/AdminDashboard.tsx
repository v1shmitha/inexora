"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Building2,
  BookOpen,
  Briefcase,
  CheckCircle,
  XCircle,
  BarChart3,
  Shield,
  LogOut,
  Menu,
  X,
  TrendingUp,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "~/lib/supabase/client";

interface Stats {
  totalUsers: number;
  totalInstitutions: number;
  totalPrograms: number;
  totalJobs: number;
}

interface RecentUser {
  id: string;
  fullName: string | null;
  role: string | null;
  createdAt: string;
}

interface PendingInstitution {
  id: string;
  name: string;
  type: string | null;
  country: string | null;
  createdAt: string;
}

interface Props {
  stats: Stats;
  recentUsers: RecentUser[];
  pendingInstitutions: PendingInstitution[];
}

type TabType = "overview" | "users" | "institutions" | "programs" | "jobs";

export default function AdminDashboard({ stats, recentUsers, pendingInstitutions }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const handleApproveInstitution = async (id: string) => {
    await supabase
      .from("Institution")
      .update({ isVerified: true })
      .eq("id", id);
    router.refresh();
  };

  const handleRejectInstitution = async (id: string) => {
    await supabase
      .from("Institution")
      .update({ isActive: false })
      .eq("id", id);
    router.refresh();
  };

  const statCards = [
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      bg: "bg-blue-50",
      text: "text-blue-600",
    },
    {
      label: "Institutions",
      value: stats.totalInstitutions,
      icon: Building2,
      bg: "bg-violet-50",
      text: "text-violet-600",
    },
    {
      label: "Programs",
      value: stats.totalPrograms,
      icon: BookOpen,
      bg: "bg-emerald-50",
      text: "text-emerald-600",
    },
    {
      label: "Job Listings",
      value: stats.totalJobs,
      icon: Briefcase,
      bg: "bg-orange-50",
      text: "text-orange-600",
    },
  ];

  const navItems: { id: TabType; label: string; icon: typeof Users }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "users", label: "Users", icon: Users },
    { id: "institutions", label: "Institutions", icon: Building2 },
    { id: "programs", label: "Programs", icon: BookOpen },
    { id: "jobs", label: "Jobs", icon: Briefcase },
  ];

  const roleColors: Record<string, string> = {
    STUDENT: "bg-blue-100 text-blue-700",
    LECTURER: "bg-violet-100 text-violet-700",
    INSTITUTION_ADMIN: "bg-emerald-100 text-emerald-700",
    EMPLOYER: "bg-orange-100 text-orange-700",
    ADMIN: "bg-red-100 text-red-700",
  };

  return (
    <div className="flex h-screen bg-slate-50">

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-0 overflow-hidden"
        } flex flex-col bg-slate-900 text-white transition-all duration-300 md:w-64`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-slate-700 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-wide text-white">DEH-SL</p>
            <p className="text-xs text-slate-400">Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                activeTab === id
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>

        {/* Sign Out */}
        <div className="border-t border-slate-700 p-3">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Top Bar */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div>
              <h1 className="text-lg font-bold capitalize text-slate-900">
                {activeTab === "overview" ? "Dashboard Overview" : activeTab}
              </h1>
              <p className="text-xs text-slate-500">DEH-SL Platform Administration</p>
            </div>
          </div>

          {pendingInstitutions.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
              <AlertTriangle className="h-4 w-4" />
              {pendingInstitutions.length} pending approval
            </div>
          )}
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">

          {/* ── Overview ── */}
          {activeTab === "overview" && (
            <div className="space-y-6">

              {/* Stat Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map(({ label, value, icon: Icon, bg, text }) => (
                  <div
                    key={label}
                    className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500">{label}</p>
                        <p className="mt-1 text-3xl font-bold text-slate-900">
                          {value.toLocaleString()}
                        </p>
                      </div>
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bg}`}>
                        <Icon className={`h-6 w-6 ${text}`} />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-xs text-emerald-600">
                      <TrendingUp className="h-3 w-3" />
                      <span>Active on platform</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 lg:grid-cols-2">

                {/* Recent Users */}
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-6 py-4">
                    <h2 className="font-bold text-slate-900">Recent Signups</h2>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {recentUsers.length === 0 ? (
                      <p className="px-6 py-8 text-center text-sm text-slate-500">No users yet</p>
                    ) : (
                      recentUsers.map((user) => (
                        <div key={user.id} className="flex items-center justify-between px-6 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                              {user.fullName?.charAt(0).toUpperCase() ?? "?"}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {user.fullName ?? "Unknown"}
                              </p>
                              <div className="flex items-center gap-1 text-xs text-slate-400">
                                <Clock className="h-3 w-3" />
                                {new Date(user.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              roleColors[user.role ?? ""] ?? "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {user.role ?? "unknown"}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Pending Institutions */}
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <h2 className="font-bold text-slate-900">Pending Approvals</h2>
                    {pendingInstitutions.length > 0 && (
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                        {pendingInstitutions.length} pending
                      </span>
                    )}
                  </div>
                  <div className="divide-y divide-slate-50">
                    {pendingInstitutions.length === 0 ? (
                      <p className="px-6 py-8 text-center text-sm text-slate-500">
                        No pending approvals
                      </p>
                    ) : (
                      pendingInstitutions.map((inst) => (
                        <div key={inst.id} className="px-6 py-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium text-slate-900">{inst.name}</p>
                              <p className="text-xs text-slate-500">
                                {inst.type} · {inst.country}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproveInstitution(inst.id)}
                                className="flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                              >
                                <CheckCircle className="h-3 w-3" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectInstitution(inst.id)}
                                className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                              >
                                <XCircle className="h-3 w-3" />
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Users Tab ── */}
          {activeTab === "users" && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-4">
                <h2 className="font-bold text-slate-900">Recent Users</h2>
                <p className="text-sm text-slate-500">
                  Full user management — use Supabase dashboard for bulk actions
                </p>
              </div>
              <div className="divide-y divide-slate-50">
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600">
                        {user.fullName?.charAt(0).toUpperCase() ?? "?"}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {user.fullName ?? "Unknown"}
                        </p>
                        <p className="text-xs text-slate-400">
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        roleColors[user.role ?? ""] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {user.role ?? "unknown"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Institutions Tab ── */}
          {activeTab === "institutions" && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-4">
                <h2 className="font-bold text-slate-900">Institution Approvals</h2>
              </div>
              <div className="divide-y divide-slate-50">
                {pendingInstitutions.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <CheckCircle className="mx-auto mb-3 h-12 w-12 text-emerald-400" />
                    <p className="font-medium text-slate-900">All caught up!</p>
                    <p className="text-sm text-slate-500">No pending institution approvals</p>
                  </div>
                ) : (
                  pendingInstitutions.map((inst) => (
                    <div key={inst.id} className="flex items-center justify-between px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100">
                          <Building2 className="h-5 w-5 text-violet-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{inst.name}</p>
                          <p className="text-xs text-slate-500">
                            {inst.type} · {inst.country} · Applied{" "}
                            {new Date(inst.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveInstitution(inst.id)}
                          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectInstitution(inst.id)}
                          className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── Programs & Jobs Tabs ── */}
          {(activeTab === "programs" || activeTab === "jobs") && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-20">
              {activeTab === "programs" ? (
                <BookOpen className="mb-4 h-12 w-12 text-slate-300" />
              ) : (
                <Briefcase className="mb-4 h-12 w-12 text-slate-300" />
              )}
              <h3 className="mb-2 font-bold text-slate-900">
                {activeTab === "programs" ? "Program Management" : "Job Management"}
              </h3>
              <p className="text-sm text-slate-500">
                Coming soon — build this out as your platform grows
              </p>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}