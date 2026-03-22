"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3, BookOpen, Users, Megaphone, Settings, LogOut,
  Menu, X, Plus, Trash2, Eye, EyeOff, CheckCircle, Clock,
  Globe, MapPin, Phone, Mail, Loader2, TrendingUp, GraduationCap,
  AlertTriangle, ChevronRight,
} from "lucide-react";
import { createClient } from "~/lib/supabase/client";
import {
  createProgram,
  updateProgram,
  deleteProgram,
  toggleProgram,
  createAnnouncement,
  deleteAnnouncement,
  toggleAnnouncement,
  updateInstitutionProfile,
} from "../actions";

// ── Types ──────────────────────────────────────────────────────────────────

interface Profile {
  id: string;
  fullName: string | null;
  email: string | null;
  role: string;
}

interface Course {
  id: string;
  title: string;
  code: string | null;
  isMandatory: boolean;
  orderIndex: number;
}

interface Program {
  id: string;
  title: string;
  type: string;
  level: string;
  isPublished: boolean;
  approvalStatus: string;
  createdAt: string;
  durationMonths: number | null;
  deliveryMode: string;
  courses: Course[];
}

interface LecturerProfile {
  fullName: string | null;
  email: string | null;
}

interface Lecturer {
  id: string;
  title: string | null;
  specialization: string[];
  approvalStatus: string;
  profile: LecturerProfile[] | LecturerProfile | null;
}

interface Announcement {
  id: string;
  title: string;
  content: string | null;
  isPublished: boolean;
  createdAt: string;
}

interface Institution {
  id: string;
  name: string;
  type: string | null;
  description: string | null;
  logoUrl: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string;
  isVerified: boolean;
  isActive: boolean;
  programs: Program[];
  lecturers: Lecturer[];
  announcements: Announcement[];
}

interface Props {
  profile: Profile;
  institution: Institution;
}

type TabType = "overview" | "programs" | "lecturers" | "announcements" | "profile";

// ── Helpers ────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getProfile = (profile: any): LecturerProfile | null =>
  Array.isArray(profile) ? (profile[0] ?? null) : (profile ?? null);

const inputCls =
  "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export default function InstitutionDashboard({ profile, institution: initialInstitution }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [institution, setInstitution] = useState<Institution>(initialInstitution);
  const [, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  // Program form
  const [programModal, setProgramModal] = useState(false);
  const [programForm, setProgramForm] = useState({
    title: "", type: "", level: "", deliveryMode: "", durationMonths: "",
    description: "", localPrice: "", foreignPrice: "",
  });
  const [programFormLoading, setProgramFormLoading] = useState(false);
  const [programFormError, setProgramFormError] = useState<string | null>(null);

  // Announcement form
  const [announcementModal, setAnnouncementModal] = useState(false);
  const [announcementForm, setAnnounceForm] = useState({ title: "", content: "" });
  const [announcementLoading, setAnnouncementLoading] = useState(false);
  const [announcementError, setAnnouncementError] = useState<string | null>(null);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    name: institution.name,
    description: institution.description ?? "",
    website: institution.website ?? "",
    email: institution.email ?? "",
    phone: institution.phone ?? "",
    address: institution.address ?? "",
    city: institution.city ?? "",
    country: institution.country,
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const run = async (id: string, action: () => Promise<void>, optimistic: () => void) => {
    setLoadingId(id);
    setErrorMsg(null);
    optimistic();
    startTransition(async () => {
      try { await action(); }
      catch (err) { setErrorMsg(err instanceof Error ? err.message : "Action failed"); }
      finally { setLoadingId(null); }
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // ── Program actions ───────────────────────────────────────────────────────

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programForm.title.trim()) { setProgramFormError("Title is required."); return; }
    if (!programForm.type) { setProgramFormError("Type is required."); return; }
    if (!programForm.level) { setProgramFormError("Level is required."); return; }
    if (!programForm.deliveryMode) { setProgramFormError("Delivery mode is required."); return; }

    setProgramFormLoading(true);
    setProgramFormError(null);
    try {
      const newProgram = await createProgram({
        institutionId: institution.id,
        title: programForm.title,
        type: programForm.type,
        level: programForm.level,
        field: "OTHER",
        deliveryMode: programForm.deliveryMode,
        durationMonths: programForm.durationMonths ? parseInt(programForm.durationMonths) : undefined,
        description: programForm.description || undefined,
        localPrice: programForm.localPrice ? parseFloat(programForm.localPrice) : undefined,
        foreignPrice: programForm.foreignPrice ? parseFloat(programForm.foreignPrice) : undefined,
      });
      setInstitution((prev) => ({ ...prev, programs: [newProgram, ...prev.programs] }));
      setProgramModal(false);
      setProgramForm({ title: "", type: "", level: "", deliveryMode: "", durationMonths: "", description: "", localPrice: "", foreignPrice: "" });
    } catch (err) {
      setProgramFormError(err instanceof Error ? err.message : "Failed to create program.");
    } finally {
      setProgramFormLoading(false);
    }
  };

  const handleToggleProgram = (id: string, current: boolean) =>
    run(
      id,
      () => toggleProgram(id, current),
      () => setInstitution((prev) => ({ ...prev, programs: prev.programs.map((p) => p.id === id ? { ...p, isPublished: !current } : p) })),
    );

  const handleDeleteProgram = async (id: string) => {
    if (!confirm("Delete this program?")) return;
    run(
      `del-prog-${id}`,
      () => deleteProgram(id),
      () => setInstitution((prev) => ({ ...prev, programs: prev.programs.filter((p) => p.id !== id) })),
    );
  };

  // ── Announcement actions ──────────────────────────────────────────────────

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementForm.title.trim()) { setAnnouncementError("Title is required."); return; }
    setAnnouncementLoading(true);
    setAnnouncementError(null);
    try {
      const newAnn = await createAnnouncement({
        institutionId: institution.id,
        publishedBy: profile.id,
        title: announcementForm.title,
        content: announcementForm.content || undefined,
      });
      setInstitution((prev) => ({ ...prev, announcements: [newAnn, ...prev.announcements] }));
      setAnnouncementModal(false);
      setAnnounceForm({ title: "", content: "" });
    } catch (err) {
      setAnnouncementError(err instanceof Error ? err.message : "Failed to post announcement.");
    } finally {
      setAnnouncementLoading(false);
    }
  };

  const handleToggleAnnouncement = (id: string, current: boolean) =>
    run(
      id,
      () => toggleAnnouncement(id, current),
      () => setInstitution((prev) => ({ ...prev, announcements: prev.announcements.map((a) => a.id === id ? { ...a, isPublished: !current } : a) })),
    );

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    run(
      `del-ann-${id}`,
      () => deleteAnnouncement(id),
      () => setInstitution((prev) => ({ ...prev, announcements: prev.announcements.filter((a) => a.id !== id) })),
    );
  };

  // ── Profile save ──────────────────────────────────────────────────────────

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true); setProfileError(null); setProfileSuccess(false);
    try {
      await updateInstitutionProfile(institution.id, {
        name: profileForm.name,
        description: profileForm.description || undefined,
        website: profileForm.website || undefined,
        email: profileForm.email || undefined,
        phone: profileForm.phone || undefined,
        address: profileForm.address || undefined,
        city: profileForm.city || undefined,
        country: profileForm.country,
      });
      setInstitution((prev) => ({ ...prev, ...profileForm, description: profileForm.description || null }));
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setProfileLoading(false);
    }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────

  const totalPrograms = institution.programs.length;
  const publishedPrograms = institution.programs.filter((p) => p.isPublished).length;
  const totalCourses = institution.programs.reduce((acc, p) => acc + p.courses.length, 0);
  const totalLecturers = institution.lecturers.length;
  const approvedLecturers = institution.lecturers.filter((l) => l.approvalStatus === "APPROVED").length;
  const totalAnnouncements = institution.announcements.filter((a) => a.isPublished).length;

  const navItems: { id: TabType; label: string; icon: typeof BarChart3 }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "programs", label: "Programs", icon: BookOpen },
    { id: "lecturers", label: "Lecturers", icon: Users },
    { id: "announcements", label: "Announcements", icon: Megaphone },
    { id: "profile", label: "Institution Profile", icon: Settings },
  ];

  function ActionBtn({ id, onClick, color, children }: { id: string; onClick: () => void; color: string; children: React.ReactNode }) {
    return (
      <button onClick={onClick} disabled={loadingId === id}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${color}`}>
        {loadingId === id ? <Loader2 className="h-3 w-3 animate-spin" /> : children}
      </button>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">

      {/* ── Sidebar ── */}
      <aside className={`${sidebarOpen ? "w-64" : "w-0 overflow-hidden"} flex flex-col bg-slate-900 text-white transition-all duration-300 md:w-64`}>
        <div className="flex items-center gap-3 border-b border-slate-700 px-6 py-5">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">
            {institution.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{institution.name}</p>
            <p className="text-xs text-slate-400">{institution.type?.replace(/_/g, " ") ?? "Institution"}</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${activeTab === id ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
              <Icon className="h-4 w-4 flex-shrink-0" />{label}
            </button>
          ))}
        </nav>
        <div className="border-t border-slate-700 p-3">
          <div className="mb-2 px-3 py-2">
            <p className="truncate text-xs font-medium text-slate-300">{profile.fullName}</p>
            <p className="truncate text-xs text-slate-500">{profile.email}</p>
          </div>
          <button onClick={() => setShowSignOutConfirm(true)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-slate-800 hover:text-white">
            <LogOut className="h-4 w-4" />Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden">
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900">{navItems.find((n) => n.id === activeTab)?.label}</h1>
              <p className="text-xs text-slate-500">{institution.name} · Institution Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {errorMsg && <p className="max-w-xs truncate text-sm text-red-500">{errorMsg}</p>}
            {institution.isVerified && (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                <CheckCircle className="h-3.5 w-3.5" />Verified
              </span>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">

          {/* ══════ OVERVIEW ══════════════════════════════════════════════ */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Total Programs", value: totalPrograms, sub: `${publishedPrograms} published`, icon: BookOpen, bg: "bg-blue-50", text: "text-blue-600" },
                  { label: "Total Courses", value: totalCourses, sub: "across all programs", icon: GraduationCap, bg: "bg-violet-50", text: "text-violet-600" },
                  { label: "Lecturers", value: totalLecturers, sub: `${approvedLecturers} approved`, icon: Users, bg: "bg-emerald-50", text: "text-emerald-600" },
                  { label: "Announcements", value: totalAnnouncements, sub: "published", icon: Megaphone, bg: "bg-orange-50", text: "text-orange-600" },
                ].map(({ label, value, sub, icon: Icon, bg, text }) => (
                  <div key={label} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500">{label}</p>
                        <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
                      </div>
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bg}`}>
                        <Icon className={`h-6 w-6 ${text}`} />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-xs text-slate-400">
                      <TrendingUp className="h-3 w-3" />{sub}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <h2 className="font-bold text-slate-900">Recent Programs</h2>
                    <button onClick={() => setActiveTab("programs")} className="text-xs font-semibold text-blue-600 hover:text-blue-700">View all →</button>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {institution.programs.length === 0 ? (
                      <div className="px-6 py-10 text-center">
                        <BookOpen className="mx-auto mb-3 h-10 w-10 text-slate-200" />
                        <p className="text-sm text-slate-500">No programs yet</p>
                        <button onClick={() => { setActiveTab("programs"); setProgramModal(true); }} className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-700">
                          Add your first program →
                        </button>
                      </div>
                    ) : institution.programs.slice(0, 4).map((p) => (
                      <div key={p.id} className="flex items-center justify-between px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                            <BookOpen className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{p.title}</p>
                            <p className="text-xs text-slate-400">{p.type.replace(/_/g, " ")} · {p.courses.length} courses</p>
                          </div>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${p.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                          {p.isPublished ? "Published" : "Draft"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <h2 className="font-bold text-slate-900">Recent Announcements</h2>
                    <button onClick={() => setActiveTab("announcements")} className="text-xs font-semibold text-blue-600 hover:text-blue-700">View all →</button>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {institution.announcements.length === 0 ? (
                      <div className="px-6 py-10 text-center">
                        <Megaphone className="mx-auto mb-3 h-10 w-10 text-slate-200" />
                        <p className="text-sm text-slate-500">No announcements yet</p>
                      </div>
                    ) : institution.announcements.slice(0, 4).map((a) => (
                      <div key={a.id} className="px-6 py-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-900">{a.title}</p>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${a.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                            {a.isPublished ? "Live" : "Hidden"}
                          </span>
                        </div>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="h-3 w-3" />{new Date(a.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                  <h2 className="font-bold text-slate-900">Lecturers</h2>
                  <button onClick={() => setActiveTab("lecturers")} className="text-xs font-semibold text-blue-600 hover:text-blue-700">View all →</button>
                </div>
                <div className="divide-y divide-slate-50">
                  {institution.lecturers.length === 0 ? (
                    <div className="px-6 py-10 text-center">
                      <Users className="mx-auto mb-3 h-10 w-10 text-slate-200" />
                      <p className="text-sm text-slate-500">No lecturers affiliated yet</p>
                    </div>
                  ) : institution.lecturers.slice(0, 3).map((lec) => {
                    const p = getProfile(lec.profile);
                    return (
                      <div key={lec.id} className="flex items-center justify-between px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                            {p?.fullName?.charAt(0).toUpperCase() ?? "?"}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{lec.title ? `${lec.title} ` : ""}{p?.fullName ?? "Unknown"}</p>
                            <p className="text-xs text-slate-400">{lec.specialization.slice(0, 2).join(", ")}</p>
                          </div>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${lec.approvalStatus === "APPROVED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                          {lec.approvalStatus}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ══════ PROGRAMS ══════════════════════════════════════════════ */}
          {activeTab === "programs" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{totalPrograms} programs · {publishedPrograms} published</p>
                <button onClick={() => setProgramModal(true)}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">
                  <Plus className="h-4 w-4" />Add Program
                </button>
              </div>
              {institution.programs.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                  <BookOpen className="mx-auto mb-4 h-14 w-14 text-slate-200" />
                  <p className="font-medium text-slate-700">No programs yet</p>
                  <button onClick={() => setProgramModal(true)} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                    Add Program
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {institution.programs.map((program) => (
                    <div key={program.id} className="rounded-xl border border-slate-200 bg-white shadow-sm">
                      <div className="flex items-center gap-4 px-6 py-4">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50">
                          <BookOpen className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-slate-900">{program.title}</p>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{program.type.replace(/_/g, " ")}</span>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{program.level}</span>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{program.deliveryMode.replace(/_/g, " ")}</span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-4 text-xs text-slate-400">
                            {program.durationMonths && <span>{program.durationMonths} months</span>}
                            <span>{program.courses.length} courses</span>
                            <span>Created {new Date(program.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${program.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                            {program.isPublished ? "Published" : "Draft"}
                          </span>
                          <ActionBtn id={program.id} onClick={() => handleToggleProgram(program.id, program.isPublished)}
                            color={program.isPublished ? "bg-slate-100 text-slate-700 hover:bg-slate-200" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}>
                            {program.isPublished ? <><EyeOff className="h-3.5 w-3.5" />Unpublish</> : <><Eye className="h-3.5 w-3.5" />Publish</>}
                          </ActionBtn>
                          <ActionBtn id={`del-prog-${program.id}`} onClick={() => handleDeleteProgram(program.id)} color="bg-red-50 text-red-700 hover:bg-red-100">
                            <Trash2 className="h-3.5 w-3.5" />Delete
                          </ActionBtn>
                        </div>
                      </div>
                      {program.courses.length > 0 && (
                        <div className="border-t border-slate-50 px-6 py-3">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Courses</p>
                          <div className="flex flex-wrap gap-2">
                            {program.courses.sort((a, b) => a.orderIndex - b.orderIndex).map((c) => (
                              <span key={c.id} className="flex items-center gap-1 rounded-lg bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
                                <ChevronRight className="h-3 w-3 text-slate-300" />
                                {c.code ? `${c.code} — ` : ""}{c.title}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══════ LECTURERS ═════════════════════════════════════════════ */}
          {activeTab === "lecturers" && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">{totalLecturers} lecturers · {approvedLecturers} approved</p>
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="divide-y divide-slate-50">
                  {institution.lecturers.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                      <Users className="mx-auto mb-4 h-14 w-14 text-slate-200" />
                      <p className="font-medium text-slate-700">No lecturers affiliated yet</p>
                      <p className="mt-1 text-sm text-slate-400">Lecturers will appear here once they register and select your institution.</p>
                    </div>
                  ) : institution.lecturers.map((lec) => {
                    const p = getProfile(lec.profile);
                    return (
                      <div key={lec.id} className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                            {p?.fullName?.charAt(0).toUpperCase() ?? "?"}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{lec.title ? `${lec.title} ` : ""}{p?.fullName ?? "Unknown"}</p>
                            <p className="text-xs text-slate-500">{p?.email}</p>
                            {lec.specialization.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {lec.specialization.slice(0, 3).map((s) => (
                                  <span key={s} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{s}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          lec.approvalStatus === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                          lec.approvalStatus === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                        }`}>{lec.approvalStatus}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ══════ ANNOUNCEMENTS ════════════════════════════════════════ */}
          {activeTab === "announcements" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{institution.announcements.length} announcements</p>
                <button onClick={() => setAnnouncementModal(true)}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">
                  <Plus className="h-4 w-4" />New Announcement
                </button>
              </div>
              {institution.announcements.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                  <Megaphone className="mx-auto mb-4 h-14 w-14 text-slate-200" />
                  <p className="font-medium text-slate-700">No announcements yet</p>
                  <p className="mt-1 text-sm text-slate-400">Post announcements to keep students and staff informed.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {institution.announcements.map((ann) => (
                    <div key={ann.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-slate-900">{ann.title}</p>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ann.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                              {ann.isPublished ? "Live" : "Hidden"}
                            </span>
                          </div>
                          {ann.content && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{ann.content}</p>}
                          <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                            <Clock className="h-3 w-3" />{new Date(ann.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-shrink-0 gap-2">
                          <ActionBtn id={ann.id} onClick={() => handleToggleAnnouncement(ann.id, ann.isPublished)}
                            color={ann.isPublished ? "bg-slate-100 text-slate-700 hover:bg-slate-200" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}>
                            {ann.isPublished ? <><EyeOff className="h-3.5 w-3.5" />Hide</> : <><Eye className="h-3.5 w-3.5" />Show</>}
                          </ActionBtn>
                          <ActionBtn id={`del-ann-${ann.id}`} onClick={() => handleDeleteAnnouncement(ann.id)} color="bg-red-50 text-red-700 hover:bg-red-100">
                            <Trash2 className="h-3.5 w-3.5" />Delete
                          </ActionBtn>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══════ PROFILE ═══════════════════════════════════════════════ */}
          {activeTab === "profile" && (
            <div className="max-w-2xl space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-4">
                  <h2 className="font-bold text-slate-900">Institution Details</h2>
                  <p className="mt-0.5 text-xs text-slate-500">Update your institution&apos;s public profile information</p>
                </div>
                <form onSubmit={handleProfileSave} className="space-y-4 p-6">
                  <Field label="Institution Name" required>
                    <input type="text" value={profileForm.name}
                      onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} />
                  </Field>
                  <Field label="Description">
                    <textarea value={profileForm.description} rows={3}
                      onChange={(e) => setProfileForm((f) => ({ ...f, description: e.target.value }))}
                      className={`${inputCls} resize-none`} placeholder="Brief description…" />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Email">
                      <div className="relative">
                        <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input type="email" value={profileForm.email}
                          onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))} className={`${inputCls} pl-9`} />
                      </div>
                    </Field>
                    <Field label="Phone">
                      <div className="relative">
                        <Phone className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input type="text" value={profileForm.phone}
                          onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))} className={`${inputCls} pl-9`} />
                      </div>
                    </Field>
                  </div>
                  <Field label="Website">
                    <div className="relative">
                      <Globe className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input type="url" value={profileForm.website} placeholder="https://…"
                        onChange={(e) => setProfileForm((f) => ({ ...f, website: e.target.value }))} className={`${inputCls} pl-9`} />
                    </div>
                  </Field>
                  <Field label="Address">
                    <input type="text" value={profileForm.address}
                      onChange={(e) => setProfileForm((f) => ({ ...f, address: e.target.value }))} className={inputCls} />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="City">
                      <div className="relative">
                        <MapPin className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input type="text" value={profileForm.city}
                          onChange={(e) => setProfileForm((f) => ({ ...f, city: e.target.value }))} className={`${inputCls} pl-9`} />
                      </div>
                    </Field>
                    <Field label="Country">
                      <input type="text" value={profileForm.country}
                        onChange={(e) => setProfileForm((f) => ({ ...f, country: e.target.value }))} className={inputCls} />
                    </Field>
                  </div>
                  {profileError && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{profileError}</p>}
                  {profileSuccess && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">Profile updated successfully.</p>}
                  <div className="flex justify-end pt-2">
                    <button type="submit" disabled={profileLoading}
                      className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">
                      {profileLoading && <Loader2 className="h-4 w-4 animate-spin" />}Save Changes
                    </button>
                  </div>
                </form>
              </div>
              <div className={`rounded-xl border p-5 ${institution.isVerified ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
                <div className="flex items-center gap-3">
                  {institution.isVerified
                    ? <CheckCircle className="h-5 w-5 text-emerald-600" />
                    : <AlertTriangle className="h-5 w-5 text-amber-600" />}
                  <div>
                    <p className={`text-sm font-semibold ${institution.isVerified ? "text-emerald-800" : "text-amber-800"}`}>
                      {institution.isVerified ? "Institution Verified" : "Verification Pending"}
                    </p>
                    <p className={`text-xs ${institution.isVerified ? "text-emerald-600" : "text-amber-600"}`}>
                      {institution.isVerified
                        ? "Your institution is verified and visible on the platform."
                        : "Contact the platform administrator to complete verification."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ══════ ADD PROGRAM MODAL ═════════════════════════════════════════ */}
      {programModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Add New Program</h2>
              </div>
              <button onClick={() => setProgramModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreateProgram} className="space-y-4 p-6">
              <Field label="Program Title" required>
                <input type="text" value={programForm.title}
                  onChange={(e) => setProgramForm((f) => ({ ...f, title: e.target.value }))}
                  className={inputCls} placeholder="e.g. Bachelor of Computer Science" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Type" required>
                  <select value={programForm.type} onChange={(e) => setProgramForm((f) => ({ ...f, type: e.target.value }))} className={inputCls}>
                    <option value="">Select…</option>
                    {["FOUNDATION","DIPLOMA","CERTIFICATE","BACHELOR","MASTER","PHD","PROFESSIONAL","MICROCREDENTIAL","SHORT_COURSE"].map((t) => (
                      <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Level" required>
                  <select value={programForm.level} onChange={(e) => setProgramForm((f) => ({ ...f, level: e.target.value }))} className={inputCls}>
                    <option value="">Select…</option>
                    {["ENTRY","UNDERGRADUATE","POSTGRADUATE","RESEARCH"].map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Delivery Mode" required>
                  <select value={programForm.deliveryMode} onChange={(e) => setProgramForm((f) => ({ ...f, deliveryMode: e.target.value }))} className={inputCls}>
                    <option value="">Select…</option>
                    {["ONLINE","ON_CAMPUS","HYBRID","BLENDED"].map((d) => (
                      <option key={d} value={d}>{d.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Duration (months)">
                  <input type="number" value={programForm.durationMonths} min="1" placeholder="e.g. 36"
                    onChange={(e) => setProgramForm((f) => ({ ...f, durationMonths: e.target.value }))} className={inputCls} />
                </Field>
              </div>
              <Field label="Description">
                <textarea value={programForm.description} rows={3} placeholder="Program overview…"
                  onChange={(e) => setProgramForm((f) => ({ ...f, description: e.target.value }))}
                  className={`${inputCls} resize-none`} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Local Price (LKR)">
                  <input type="number" value={programForm.localPrice} min="0" step="0.01" placeholder="0.00"
                    onChange={(e) => setProgramForm((f) => ({ ...f, localPrice: e.target.value }))} className={inputCls} />
                </Field>
                <Field label="Foreign Price (USD)">
                  <input type="number" value={programForm.foreignPrice} min="0" step="0.01" placeholder="0.00"
                    onChange={(e) => setProgramForm((f) => ({ ...f, foreignPrice: e.target.value }))} className={inputCls} />
                </Field>
              </div>
              {programFormError && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{programFormError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setProgramModal(false)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={programFormLoading}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                  {programFormLoading && <Loader2 className="h-4 w-4 animate-spin" />}Create Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════ ADD ANNOUNCEMENT MODAL ════════════════════════════════════ */}
      {announcementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100">
                  <Megaphone className="h-5 w-5 text-orange-600" />
                </div>
                <h2 className="text-base font-bold text-slate-900">New Announcement</h2>
              </div>
              <button onClick={() => setAnnouncementModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreateAnnouncement} className="space-y-4 p-6">
              <Field label="Title" required>
                <input type="text" value={announcementForm.title} placeholder="Announcement title…"
                  onChange={(e) => setAnnounceForm((f) => ({ ...f, title: e.target.value }))} className={inputCls} />
              </Field>
              <Field label="Content">
                <textarea value={announcementForm.content} rows={5} placeholder="Write your announcement here…"
                  onChange={(e) => setAnnounceForm((f) => ({ ...f, content: e.target.value }))}
                  className={`${inputCls} resize-none`} />
              </Field>
              {announcementError && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{announcementError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setAnnouncementModal(false)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={announcementLoading}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                  {announcementLoading && <Loader2 className="h-4 w-4 animate-spin" />}Post Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════ SIGN OUT CONFIRM ══════════════════════════════════════════ */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              <h3 className="text-lg font-bold text-slate-900">Sign Out?</h3>
            </div>
            <p className="mb-6 text-sm text-slate-600">Are you sure you want to sign out?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowSignOutConfirm(false)} className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200">Cancel</button>
              <button onClick={handleSignOut} className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700">Yes, Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}