"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen, Search, GraduationCap, Clock,
  Users, ChevronRight, Loader2, SlidersHorizontal, X,
} from "lucide-react";
import { api } from "~/trpc/react";

export default function PublicCoursesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [priceFilter, setPriceFilter] = useState<"All" | "Free" | "Paid">("All");
  const [showFilters, setShowFilters] = useState(false);

  const { data: courses = [], isLoading } = api.course.listPublic.useQuery({
    search: search || undefined,
  }, { staleTime: 60_000 });

  const filteredCourses = courses.filter((c) => {
    if (priceFilter === "Free") return !c.localPrice || Number(c.localPrice) === 0;
    if (priceFilter === "Paid") return c.localPrice && Number(c.localPrice) > 0;
    return true;
  });

  const hasFilters = priceFilter !== "All";
  const clearFilters = () => setPriceFilter("All");

  return (
    <div className="overflow-x-hidden font-sans" style={{ background: "#0A0F1E", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
        .font-display { font-family: 'Sora', sans-serif; }
        .font-body    { font-family: 'Inter', sans-serif; }

        :root {
          --navy-base:    #0A0F1E;
          --navy-surface: #141C36;
          --navy-card:    #1E2B55;
          --navy-border:  rgba(136,153,187,0.12);
          --navy-border-strong: rgba(136,153,187,0.20);
          --gold:         #22C55E;
          --gold-dim:     #16A34A;
          --gold-glow:    rgba(34,197,94,0.18);
          --gold-subtle:  rgba(34,197,94,0.08);
          --accent:       #A3E635;
          --accent-dim:   #84CC16;
          --blue-acc:     #38BDF8;
          --blue-dim:     rgba(56,189,248,0.15);
          --text-primary: #F5F5F0;
          --text-secondary: rgba(136,153,187,0.70);
          --text-muted:   rgba(136,153,187,0.40);
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .anim-fade-up   { animation: fadeUp 0.8s cubic-bezier(.16,1,.3,1) both; }
        .anim-fade-up-2 { animation: fadeUp 0.8s cubic-bezier(.16,1,.3,1) 0.12s both; }
        .anim-fade-up-3 { animation: fadeUp 0.8s cubic-bezier(.16,1,.3,1) 0.24s both; }
        .anim-fade-in   { animation: fadeIn 1s ease both; }

        .search-input {
          width: 100%;
          background: rgba(30,43,85,0.6);
          border: 1px solid rgba(136,153,187,0.20);
          border-radius: 14px;
          padding: 14px 16px 14px 44px;
          color: #F5F5F0;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          backdrop-filter: blur(8px);
        }
        .search-input::placeholder { color: rgba(136,153,187,0.40); }
        .search-input:focus {
          border-color: rgba(34,197,94,0.45);
          box-shadow: 0 0 0 3px rgba(34,197,94,0.08);
        }

        .filter-select {
          background: rgba(30,43,85,0.8);
          border: 1px solid rgba(136,153,187,0.18);
          border-radius: 10px;
          padding: 10px 14px;
          color: #F5F5F0;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s ease;
          cursor: pointer;
        }
        .filter-select:focus { border-color: rgba(34,197,94,0.40); }
        .filter-select option { background: #1E2B55; color: #F5F5F0; }

        .filter-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          border-radius: 12px;
          border: 1px solid rgba(136,153,187,0.20);
          background: rgba(30,43,85,0.6);
          color: rgba(136,153,187,0.80);
          padding: 12px 18px;
          font-family: 'Sora', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
          backdrop-filter: blur(8px);
          white-space: nowrap;
        }
        .filter-btn.active {
          border-color: rgba(34,197,94,0.45);
          background: rgba(34,197,94,0.10);
          color: #22C55E;
        }
        .filter-btn:hover:not(.active) {
          border-color: rgba(136,153,187,0.35);
          color: #F5F5F0;
        }

        .clear-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          border-radius: 10px;
          padding: 10px 14px;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.20);
          color: rgba(239,68,68,0.70);
          font-size: 13px;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease;
        }
        .clear-btn:hover {
          background: rgba(239,68,68,0.14);
          color: #f87171;
        }

        .course-card {
          background: var(--navy-card);
          border: 1px solid var(--navy-border);
          border-radius: 18px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s cubic-bezier(.16,1,.3,1);
        }
        .course-card:hover {
          border-color: rgba(34,197,94,0.28);
          box-shadow: 0 20px 60px -10px rgba(34,197,94,0.12), 0 4px 20px rgba(0,0,0,0.5);
          transform: translateY(-4px);
        }

        .badge-type {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border-radius: 9999px;
          font-size: 10.5px;
          font-weight: 700;
          font-family: 'Sora', sans-serif;
          padding: 4px 11px;
        }

        .code-tag {
          font-family: 'Inter', sans-serif;
          font-size: 10.5px;
          background: rgba(136,153,187,0.10);
          color: rgba(136,153,187,0.65);
          border: 1px solid rgba(136,153,187,0.16);
          border-radius: 6px;
          padding: 2px 7px;
        }

        .view-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          padding: 11px;
          border-radius: 10px;
          background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%);
          color: #0A0F1E;
          font-family: 'Sora', sans-serif;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          transition: box-shadow 0.3s ease, transform 0.2s ease;
        }
        .view-btn:hover {
          box-shadow: 0 0 0 4px rgba(34,197,94,0.15), 0 6px 20px rgba(34,197,94,0.30);
          transform: translateY(-1px);
        }

        .dot-grid {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle at 1.5px 1.5px, #A3E635 1.5px, transparent 0);
          background-size: 36px 36px;
          opacity: 0.04;
          pointer-events: none;
        }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0A0F1E 0%, #0E1426 50%, #141C36 100%)" }}
      >
        <div className="dot-grid" />

        <div className="pointer-events-none absolute right-0 top-0 h-[340px] w-[500px] rounded-full"
          style={{ background: "radial-gradient(ellipse at top right, rgba(56,189,248,0.06) 0%, transparent 65%)" }} />
        <div className="pointer-events-none absolute bottom-0 left-0 h-[260px] w-[380px] rounded-full"
          style={{ background: "radial-gradient(ellipse at bottom left, rgba(163,230,53,0.05) 0%, transparent 65%)" }} />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">

          <h1 className="font-display anim-fade-up mb-4 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl"
            style={{ color: "#F5F5F0" }}>
            Explore
            <span style={{ color: "#22C55E" }}> Courses</span>
          </h1>

          <p className="anim-fade-up-2 font-body mb-10 max-w-xl text-base leading-relaxed sm:text-lg"
            style={{ color: "rgba(136,153,187,0.70)" }}>
            Browse standalone certificate courses from Sri Lanka's leading lecturers. Sign in to enroll and start learning.
          </p>

          {/* Search + filter row */}
          <div className="anim-fade-up-3 flex flex-col gap-3 sm:flex-row sm:items-center max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4"
                style={{ color: "rgba(136,153,187,0.40)" }} />
              <input
                type="text"
                placeholder="Search courses…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`filter-btn ${hasFilters || showFilters ? "active" : ""}`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {hasFilters && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold"
                  style={{ background: "#22C55E", color: "#0A0F1E" }}>
                  1
                </span>
              )}
            </button>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="mt-4 flex flex-wrap items-center gap-3 max-w-2xl rounded-2xl p-5"
              style={{ background: "rgba(30,43,85,0.50)", border: "1px solid rgba(136,153,187,0.14)", backdropFilter: "blur(12px)" }}>
              <select value={priceFilter} onChange={(e) => setPriceFilter(e.target.value as "All" | "Free" | "Paid")} className="filter-select">
                <option value="All">All Courses</option>
                <option value="Free">Free</option>
                <option value="Paid">Paid</option>
              </select>
              {hasFilters && (
                <button onClick={clearFilters} className="clear-btn">
                  <X className="h-3.5 w-3.5" /> Clear
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── RESULTS ──────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-28 gap-4">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#22C55E" }} />
            <p className="font-body text-sm" style={{ color: "rgba(136,153,187,0.50)" }}>Loading courses…</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl py-24 text-center"
            style={{ background: "var(--navy-card)", border: "1px dashed rgba(136,153,187,0.18)" }}>
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: "rgba(163,230,53,0.08)", border: "1px solid rgba(163,230,53,0.18)" }}>
              <BookOpen className="h-8 w-8" style={{ color: "rgba(163,230,53,0.45)" }} />
            </div>
            <p className="font-display font-semibold text-base mb-2" style={{ color: "#F5F5F0" }}>No courses found</p>
            <p className="font-body text-sm" style={{ color: "rgba(136,153,187,0.45)" }}>Try a different search term or filter.</p>
          </div>
        ) : (
          <>
            <p className="font-body mb-6 text-sm" style={{ color: "rgba(136,153,187,0.45)" }}>
              {filteredCourses.length} course{filteredCourses.length !== 1 ? "s" : ""} found
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course) => {
                const lecturer = course.courseLecturers?.[0]?.lecturer;
                const lecturerName = lecturer?.profile?.fullName
                  ? `${lecturer.title ? `${lecturer.title} ` : ""}${lecturer.profile.fullName}`
                  : null;

                return (
                  <div key={course.id} className="course-card">
                    {/* Accent bar */}
                    <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #22C55E, transparent)" }} />

                    <div className="flex flex-1 flex-col p-6">
                      {/* Type badge */}
                      <div className="mb-4">
                        <span className="badge-type"
                          style={{
                            background: "rgba(34,197,94,0.10)",
                            color: "#22C55E",
                            border: "1px solid rgba(34,197,94,0.25)",
                          }}>
                          <GraduationCap className="h-3 w-3" /> Course
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-display font-bold leading-snug mb-2 text-base"
                        style={{ color: "#F5F5F0" }}>
                        {course.title}
                      </h3>

                      {/* Code */}
                      {course.code && (
                        <div className="mb-3">
                          <span className="code-tag">{course.code}</span>
                        </div>
                      )}

                      {/* Lecturer */}
                      {lecturerName && (
                        <div className="mb-3 flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "rgba(136,153,187,0.45)" }} />
                          <span className="font-body truncate text-xs" style={{ color: "rgba(136,153,187,0.55)" }}>
                            {lecturerName}
                          </span>
                        </div>
                      )}

                      {/* Description */}
                      {course.description && (
                        <p className="font-body mb-4 text-xs leading-relaxed line-clamp-2"
                          style={{ color: "rgba(136,153,187,0.50)" }}>
                          {course.description}
                        </p>
                      )}

                      {/* Price */}
                      <p className="font-display mb-4 text-sm font-bold" style={{ color: "#F5F5F0" }}>
                        {!course.localPrice || Number(course.localPrice) === 0 ? (
                          <span style={{ color: "#22C55E" }}>Free</span>
                        ) : (
                          <>LKR {Number(course.localPrice).toLocaleString()}</>
                        )}
                      </p>

                      {/* Spacer */}
                      <div className="flex-1" />

                      {/* CTA */}
                      <button
                        onClick={() => router.push("/login")}
                        className="view-btn mt-2"
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
      </section>
    </div>
  );
}