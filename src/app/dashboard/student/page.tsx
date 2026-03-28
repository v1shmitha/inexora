"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen, GraduationCap, Layers, Clock, CheckCircle2,
  ArrowRight, Search, PlayCircle, FileText, Users,
  Loader2, BarChart3,
} from "lucide-react";
import { api } from "~/trpc/react";

// ── Helpers ───────────────────────────────────────────────────────────────

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-slate-100">
      <div
        className={`h-1.5 rounded-full transition-all ${
          percent === 100 ? "bg-emerald-500" : "bg-blue-500"
        }`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE:    "bg-blue-100 text-blue-700",
    COMPLETED: "bg-emerald-100 text-emerald-700",
    FAILED:    "bg-red-100 text-red-600",
    WITHDRAWN: "bg-slate-100 text-slate-500",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${map[status] ?? map.ACTIVE}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────

export default function MyLearningPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"ALL" | "IN_PROGRESS" | "COMPLETED">("ALL");

  const { data: enrollments = [], isLoading } =
    api.studentCourse.getMyEnrollments.useQuery(undefined, { staleTime: 0 });

  const filtered = enrollments.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch =
      e.course.title.toLowerCase().includes(q) ||
      (e.course.code?.toLowerCase().includes(q) ?? false) ||
      (e.course.program?.title.toLowerCase().includes(q) ?? false);
    const matchTab =
      tab === "ALL" ||
      (tab === "IN_PROGRESS" && e.progressPercent < 100 && e.status === "ACTIVE") ||
      (tab === "COMPLETED" && (e.progressPercent === 100 || e.status === "COMPLETED"));
    return matchSearch && matchTab;
  });

  const inProgress = enrollments.filter((e) => e.progressPercent < 100 && e.status === "ACTIVE").length;
  const completed = enrollments.filter((e) => e.progressPercent === 100 || e.status === "COMPLETED").length;
  const totalPercent = enrollments.length > 0
    ? Math.round(enrollments.reduce((s, e) => s + e.progressPercent, 0) / enrollments.length)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">My Learning</h1>
          <p className="mt-1 text-sm text-slate-500">
            Your enrolled courses and modules
          </p>
        </div>

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-4">
          {[
            { label: "Enrolled",    value: enrollments.length, icon: BookOpen,     color: "text-blue-600",   bg: "bg-blue-50" },
            { label: "In Progress", value: inProgress,          icon: PlayCircle,   color: "text-amber-600",  bg: "bg-amber-50" },
            { label: "Completed",   value: completed,           icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Overall",     value: `${totalPercent}%`,  icon: BarChart3,    color: "text-violet-600", bg: "bg-violet-50" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search + tabs */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search courses…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
            {(["ALL", "IN_PROGRESS", "COMPLETED"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-md px-4 py-1.5 text-xs font-semibold transition ${
                  tab === t ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t === "ALL" ? "All" : t === "IN_PROGRESS" ? "In Progress" : "Completed"}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center">
            <GraduationCap className="mx-auto mb-4 h-12 w-12 text-slate-200" />
            <p className="font-medium text-slate-600">
              {search ? "No courses match your search" : "No courses enrolled yet"}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Courses you enroll in will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((e) => {
              const lecturer = e.course.courseLecturers[0]?.lecturer;
              const lecturerName = lecturer?.profile?.fullName
                ? `${lecturer.title ? `${lecturer.title} ` : ""}${lecturer.profile.fullName}`
                : null;
              const isModule = !e.course.isStandalone;

              return (
                <div
                  key={e.id}
                  className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-200 hover:shadow-md"
                >
                  {/* Card top — colored band */}
                  <div className={`h-2 rounded-t-xl ${
                    e.progressPercent === 100
                      ? "bg-emerald-400"
                      : e.progressPercent > 0
                        ? "bg-blue-400"
                        : "bg-slate-200"
                  }`} />

                  <div className="flex flex-1 flex-col p-5">
                    {/* Type + status */}
                    <div className="mb-3 flex items-center justify-between">
                      <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        isModule
                          ? "bg-blue-50 text-blue-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}>
                        {isModule
                          ? <><Layers className="h-3 w-3" /> Module</>
                          : <><GraduationCap className="h-3 w-3" /> Course</>
                        }
                      </span>
                      <StatusBadge status={e.status} />
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold leading-snug text-slate-900">
                      {e.course.title}
                    </h3>

                    {/* Program or code */}
                    <div className="mt-1 flex items-center gap-2">
                      {e.course.code && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-500">
                          {e.course.code}
                        </span>
                      )}
                      {e.course.program && (
                        <span className="text-xs text-slate-400 truncate">
                          {e.course.program.title}
                        </span>
                      )}
                    </div>

                    {/* Lecturer */}
                    {lecturerName && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                        <Users className="h-3.5 w-3.5" /> {lecturerName}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" />
                        {e.totalResources} resources
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        {e.completedResources} done
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="mt-4 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Progress</span>
                        <span className={`font-bold ${
                          e.progressPercent === 100 ? "text-emerald-600" : "text-blue-600"
                        }`}>
                          {e.progressPercent}%
                        </span>
                      </div>
                      <ProgressBar percent={e.progressPercent} />
                    </div>

                    {/* CTA */}
                    <button
                      onClick={() => router.push(`/dashboard/student/courses/${e.courseId}`)}
                      className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${
                        e.progressPercent === 100
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {e.progressPercent === 0
                        ? "Start Learning"
                        : e.progressPercent === 100
                          ? "Review Course"
                          : "Continue"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}