"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen, Search, GraduationCap, Layers, Clock,
  Users, ChevronRight, Loader2, X, SlidersHorizontal,
} from "lucide-react";
import { api } from "~/trpc/react";

export default function PublicCoursesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"ALL" | "STANDALONE" | "MODULE">("ALL");

  const { data: courses = [], isLoading } = api.course.listPublic.useQuery({
    search: search || undefined,
    isStandalone: type === "ALL" ? undefined : type === "STANDALONE",
  }, { staleTime: 60_000 });

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Hero */}
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-semibold text-emerald-600 uppercase tracking-wide">Browse Courses</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Explore Courses & Modules</h1>
          <p className="text-slate-500 max-w-xl">
            Browse standalone courses and program modules. Sign in to enroll and start learning.
          </p>

          {/* Search + filter */}
          <div className="mt-6 flex flex-col gap-3 max-w-2xl sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search courses…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
              {(["ALL", "STANDALONE", "MODULE"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    type === t ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {t === "ALL" ? "All" : t === "STANDALONE" ? "Courses" : "Modules"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : courses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-slate-200" />
            <p className="font-medium text-slate-600">No courses found</p>
            <p className="mt-1 text-sm text-slate-400">Try a different search term.</p>
          </div>
        ) : (
          <>
            <p className="mb-5 text-sm text-slate-500">
              {courses.length} course{courses.length !== 1 ? "s" : ""} found
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => {
                const isModule = !course.isStandalone;
                const lecturer = course.courseLecturers?.[0]?.lecturer;
                const lecturerName = lecturer?.profile?.fullName
                  ? `${lecturer.title ? `${lecturer.title} ` : ""}${lecturer.profile.fullName}`
                  : null;

                return (
                  <div
                    key={course.id}
                    className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-200 hover:shadow-md"
                  >
                    <div className={`h-1.5 rounded-t-xl ${isModule ? "bg-blue-500" : "bg-emerald-500"}`} />
                    <div className="flex flex-1 flex-col p-5">

                      {/* Type badge */}
                      <div className="mb-3">
                        <span className={`flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          isModule ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"
                        }`}>
                          {isModule ? <><Layers className="h-3 w-3" /> Module</> : <><GraduationCap className="h-3 w-3" /> Course</>}
                        </span>
                      </div>

                      <h3 className="font-bold leading-snug text-slate-900">{course.title}</h3>

                      {course.code && (
                        <span className="mt-1 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-500 w-fit">
                          {course.code}
                        </span>
                      )}

                      {course.program && (
                        <p className="mt-1.5 text-xs text-slate-400 truncate">
                          Part of: {course.program.title}
                        </p>
                      )}

                      {lecturerName && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                          <Users className="h-3.5 w-3.5" /> {lecturerName}
                        </p>
                      )}

                      {course.description && (
                        <p className="mt-3 text-xs leading-relaxed text-slate-500 line-clamp-2">
                          {course.description}
                        </p>
                      )}

                      {course.localPrice && (
                        <p className="mt-3 text-sm font-bold text-slate-900">
                          LKR {Number(course.localPrice).toLocaleString()}
                        </p>
                      )}

                      <button
                        onClick={() => router.push("/login")}
                        className="mt-auto pt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        Login to Enroll <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}