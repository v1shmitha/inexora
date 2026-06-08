"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Users,
  Loader2,
  Search,
  ChevronDown,
  GraduationCap,
  Layers,
  CheckCircle,
  Clock,
  XCircle,
  BarChart3,
  BookOpen,
  Mail,
} from "lucide-react";
import { api } from "~/trpc/react";

// ── Status badge ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    ACTIVE: { label: "Active", className: "bg-emerald-100 text-emerald-700" },
    COMPLETED: { label: "Completed", className: "bg-blue-100 text-blue-700" },
    FAILED: { label: "Failed", className: "bg-red-100 text-red-700" },
    WITHDRAWN: { label: "Withdrawn", className: "bg-slate-100 text-slate-500" },
  };
  const { label, className } = map[status] ?? map.ACTIVE!;
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export default function StudentsPage() {
  const searchParams = useSearchParams();
  const preselectedCourseId = searchParams.get("courseId");

  const [search, setSearch] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string | "ALL">(
    preselectedCourseId ?? "ALL",
  );
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(
    null,
  );

  // ── tRPC ──────────────────────────────────────────────────────────────────

  const { data: allStudents = [], isLoading: allLoading } =
    api.student.getMyStudents.useQuery();

  const { data: courseStudents = [], isLoading: courseLoading } =
    api.student.getStudentsByCourse.useQuery(
      { courseId: selectedCourseId === "ALL" ? "" : selectedCourseId },
      { enabled: selectedCourseId !== "ALL" && selectedCourseId !== "" },
    );

  const { data: modules = [] } = api.course.getMyModules.useQuery();
  const { data: courses = [] } = api.course.getMyCourses.useQuery();

  // Build course list for filter dropdown
  const allCourses = [
    ...modules.map((m) => ({
      id: m.course.id,
      title: m.course.title,
      type: "module" as const,
    })),
    ...courses.map((c) => ({
      id: c.id,
      title: c.title,
      type: "course" as const,
    })),
  ];

  const isLoading = selectedCourseId === "ALL" ? allLoading : courseLoading;

  // ── Derived data ───────────────────────────────────────────────────────────

  const displayStudents =
    selectedCourseId === "ALL"
      ? allStudents
          .filter((s) => s.student !== null)
          .filter((s) => {
            const q = search.toLowerCase();
            return (
              s.student!.profile?.fullName?.toLowerCase().includes(q) ||
              s.student!.profile?.email?.toLowerCase().includes(q)
            );
          })
      : courseStudents
          .filter((e) => e.student !== null)
          .filter((e) => {
            const q = search.toLowerCase();
            return (
              e.student!.profile?.fullName?.toLowerCase().includes(q) ||
              e.student!.profile?.email?.toLowerCase().includes(q)
            );
          })
          .map((e) => ({
            student: e.student!,
            enrolledCourses: [
              {
                courseId: selectedCourseId,
                courseTitle:
                  allCourses.find((c) => c.id === selectedCourseId)?.title ??
                  "Course",
                status: e.status,
                grade: e.grade,
                createdAt: e.createdAt,
              },
            ],
          }));

  const totalActive = allStudents.reduce(
    (sum, s) =>
      sum + s.enrolledCourses.filter((c) => c.status === "ACTIVE").length,
    0,
  );
  const totalCompleted = allStudents.reduce(
    (sum, s) =>
      sum + s.enrolledCourses.filter((c) => c.status === "COMPLETED").length,
    0,
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Students</h1>
          <p className="mt-1 text-sm text-slate-500">
            Students enrolled in your courses and modules
          </p>
        </div>

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {[
            {
              label: "Total Students",
              value: allStudents.length,
              icon: Users,
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              label: "Active Enrollments",
              value: totalActive,
              icon: CheckCircle,
              color: "text-emerald-600",
              bg: "bg-emerald-50",
            },
            {
              label: "Completed",
              value: totalCompleted,
              icon: GraduationCap,
              color: "text-violet-600",
              bg: "bg-violet-50",
            },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div
              key={label}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {value}
                  </p>
                </div>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg}`}
                >
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2.5 pr-4 pl-9 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="relative">
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full appearance-none rounded-lg border border-slate-200 py-2.5 pr-8 pl-3 text-sm outline-none focus:border-blue-400 sm:w-56"
            >
              <option value="ALL">All Courses & Modules</option>
              {allCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.type === "module" ? "📦 " : "🎓 "}
                  {c.title}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {/* Students list */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <p className="text-sm text-slate-500">
              {isLoading
                ? "Loading…"
                : `${displayStudents.length} student${displayStudents.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : displayStudents.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="mx-auto mb-4 h-12 w-12 text-slate-200" />
              <p className="font-medium text-slate-600">
                {search
                  ? "No students match your search"
                  : "No students enrolled yet"}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Students will appear here once they enroll in your courses.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {displayStudents.map(({ student, enrolledCourses }) => {
                if (!student) return null;
                const isExpanded = expandedStudentId === student.id;
                return (
                  <div key={student.id}>
                    {/* Student row */}
                    <button
                      onClick={() =>
                        setExpandedStudentId(isExpanded ? null : student.id)
                      }
                      className="flex w-full items-center gap-4 px-6 py-4 text-left transition hover:bg-slate-50"
                    >
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                        {student.profile?.fullName?.charAt(0).toUpperCase() ??
                          "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900">
                          {student.profile?.fullName ?? "Unknown"}
                        </p>
                        <p className="flex items-center gap-1 text-xs text-slate-400">
                          <Mail className="h-3 w-3" />
                          {student.profile?.email}
                        </p>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-3">
                        <div className="flex gap-2">
                          {enrolledCourses.slice(0, 2).map((ec, i) => (
                            <StatusBadge key={i} status={ec.status} />
                          ))}
                          {enrolledCourses.length > 2 && (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500">
                              +{enrolledCourses.length - 2} more
                            </span>
                          )}
                        </div>
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                          {enrolledCourses.length} course
                          {enrolledCourses.length !== 1 ? "s" : ""}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </div>
                    </button>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="border-t border-slate-50 bg-slate-50 px-6 py-4">
                        <div className="space-y-3">
                          <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
                            Enrolled Courses
                          </p>
                          {enrolledCourses.map((ec, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-4 py-3"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                                  <BookOpen className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-slate-900">
                                    {ec.courseTitle}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    Enrolled{" "}
                                    {new Date(
                                      ec.createdAt,
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {ec.grade && (
                                  <span className="flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                                    <BarChart3 className="h-3 w-3" /> Grade:{" "}
                                    {ec.grade}
                                  </span>
                                )}
                                <StatusBadge status={ec.status} />
                              </div>
                            </div>
                          ))}

                          {/* Submission summary if available */}
                          {"submissions" in student &&
                            Array.isArray((student as any).submissions) &&
                            (student as any).submissions.length > 0 && (
                              <div className="mt-2">
                                <p className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">
                                  Recent Submissions
                                </p>
                                {(student as any).submissions
                                  .slice(0, 3)
                                  .map((sub: any) => (
                                    <div
                                      key={sub.id}
                                      className="mb-2 flex items-center justify-between rounded-lg border border-slate-100 bg-white px-4 py-2.5"
                                    >
                                      <p className="text-sm text-slate-700">
                                        {sub.assessment?.title}
                                      </p>
                                      <div className="flex items-center gap-2">
                                        {sub.marksObtained != null && (
                                          <span className="text-xs font-semibold text-emerald-700">
                                            {sub.marksObtained}/
                                            {sub.assessment?.totalMarks}
                                          </span>
                                        )}
                                        <StatusBadge status={sub.status} />
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
