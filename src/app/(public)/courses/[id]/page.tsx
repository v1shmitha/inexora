"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import {
  Layers, GraduationCap, Clock, BookOpen, CheckCircle2,
  ArrowLeft, Loader2, Users, Calendar,
} from "lucide-react";
import { api } from "~/trpc/react";

export default function PublicCourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const { data: course, isLoading } = api.course.getPublicById.useQuery(
    { id },
    { staleTime: 60_000 },
  );

  const styles = (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
      .font-display { font-family: 'Sora', sans-serif; }
      .font-body    { font-family: 'Inter', sans-serif; }

      :root {
        --navy-base:    #0A0F1E;
        --navy-surface: #141C36;
        --navy-card:    #1E2B55;
        --navy-border:  rgba(136,153,187,0.12);
        --gold:         #22C55E;
        --gold-dim:     #16A34A;
        --blue-acc:     #38BDF8;
        --text-primary: #F5F5F0;
        --text-secondary: rgba(136,153,187,0.70);
        --text-muted:   rgba(136,153,187,0.40);
      }

      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(20px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .anim-fade-up { animation: fadeUp 0.6s cubic-bezier(.16,1,.3,1) both; }

      .panel {
        background: var(--navy-card);
        border: 1px solid var(--navy-border);
        border-radius: 18px;
        transition: border-color 0.3s ease;
      }
      .panel:hover { border-color: rgba(34,197,94,0.20); }

      .stat-box {
        background: rgba(10,15,30,0.40);
        border: 1px solid var(--navy-border);
        border-radius: 12px;
        padding: 14px 10px;
        text-align: center;
      }

      .section-row {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        border-radius: 12px;
        padding: 12px 16px;
        background: rgba(10,15,30,0.40);
        border: 1px solid var(--navy-border);
        transition: border-color 0.2s ease;
      }
      .section-row:hover { border-color: rgba(34,197,94,0.22); }

      .num-badge {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 24px; width: 24px;
        border-radius: 9999px;
        background: rgba(34,197,94,0.12);
        color: #22C55E;
        border: 1px solid rgba(34,197,94,0.25);
        font-size: 11px;
        font-weight: 700;
        font-family: 'Sora', sans-serif;
        flex-shrink: 0;
      }

      .gold-btn {
        background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%);
        color: #0A0F1E;
        transition: box-shadow 0.3s ease, transform 0.2s ease;
      }
      .gold-btn:hover {
        box-shadow: 0 0 0 6px rgba(34,197,94,0.15), 0 8px 30px rgba(34,197,94,0.35);
        transform: translateY(-2px);
      }

      .ghost-btn {
        background: rgba(228,228,228,0.06);
        border: 1.5px solid rgba(136,153,187,0.20);
        color: var(--text-primary);
        transition: background 0.2s ease, border-color 0.2s ease;
      }
      .ghost-btn:hover {
        background: rgba(34,197,94,0.10);
        border-color: rgba(34,197,94,0.40);
      }

      .back-link {
        display: flex;
        align-items: center;
        gap: 8px;
        color: rgba(136,153,187,0.60);
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        transition: color 0.2s ease;
      }
      .back-link:hover { color: #F5F5F0; }

      .badge-pill {
        border-radius: 9999px;
        padding: 5px 12px;
        font-size: 11px;
        font-weight: 600;
        font-family: 'Inter', sans-serif;
      }

      .code-tag {
        font-family: 'Inter', sans-serif;
        font-size: 11px;
        background: rgba(136,153,187,0.10);
        color: rgba(136,153,187,0.65);
        border: 1px solid rgba(136,153,187,0.16);
        border-radius: 6px;
        padding: 3px 9px;
      }
    `}</style>
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#0A0F1E" }}>
        {styles}
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#22C55E" }} />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4" style={{ background: "#0A0F1E" }}>
        {styles}
        <p className="font-body font-medium" style={{ color: "rgba(136,153,187,0.70)" }}>Course not found.</p>
        <button onClick={() => router.push("/courses")} className="font-body text-sm" style={{ color: "#22C55E" }}>
          Back to Courses
        </button>
      </div>
    );
  }

  const isModule = !course.isStandalone;
  const accentColor = isModule ? "#38BDF8" : "#22C55E";
  const lecturer = course.courseLecturers?.[0]?.lecturer;
  const lecturerName = lecturer?.profile?.fullName
    ? `${lecturer.title ? `${lecturer.title} ` : ""}${lecturer.profile.fullName}`
    : null;

  return (
    <div className="overflow-x-hidden font-sans" style={{ background: "#0A0F1E", minHeight: "100vh" }}>
      {styles}

      {/* Back bar */}
      <div style={{ borderBottom: "1px solid rgba(136,153,187,0.10)" }}>
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <button onClick={() => router.push("/courses")} className="back-link">
            <ArrowLeft className="h-4 w-4" /> Back to Courses
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-15 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Main content */}
          <div className="anim-fade-up space-y-5 lg:col-span-2">

            {/* Header panel */}
            <div className="panel p-7">
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="badge-pill"
                  style={{
                    background: isModule ? "rgba(56,189,248,0.12)" : "rgba(34,197,94,0.10)",
                    color: isModule ? "#38BDF8" : "#22C55E",
                    border: `1px solid ${isModule ? "rgba(56,189,248,0.25)" : "rgba(34,197,94,0.25)"}`,
                  }}>
                  {isModule ? "Module" : "Standalone Course"}
                </span>
                {course.code && <span className="code-tag">{course.code}</span>}
              </div>

              <h1 className="font-display text-2xl font-bold leading-snug" style={{ color: "#F5F5F0" }}>
                {course.title}
              </h1>

              {course.program && (
                <div className="mt-3 flex items-center gap-2" style={{ color: "rgba(136,153,187,0.60)" }}>
                  <Layers className="h-4 w-4" />
                  <span className="font-body text-sm font-medium">
                    Part of: {course.program.title}
                  </span>
                </div>
              )}

              {lecturerName && (
                <div className="mt-2 flex items-center gap-2" style={{ color: "rgba(136,153,187,0.55)" }}>
                  <Users className="h-4 w-4" />
                  <span className="font-body text-sm">{lecturerName}</span>
                </div>
              )}

              {course.description && (
                <p className="font-body mt-4 text-sm leading-relaxed" style={{ color: "rgba(136,153,187,0.65)" }}>
                  {course.description}
                </p>
              )}

              {/* Quick stats */}
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {course.creditHours && (
                  <div className="stat-box">
                    <Clock className="mx-auto mb-1.5 h-4 w-4" style={{ color: accentColor }} />
                    <p className="font-display text-xs font-semibold" style={{ color: "#F5F5F0" }}>
                      {course.creditHours} hrs
                    </p>
                    <p className="font-body mt-0.5 text-xs" style={{ color: "rgba(136,153,187,0.45)" }}>Credit Hours</p>
                  </div>
                )}
                {course.semester && (
                  <div className="stat-box">
                    <Calendar className="mx-auto mb-1.5 h-4 w-4" style={{ color: "#38BDF8" }} />
                    <p className="font-display text-xs font-semibold" style={{ color: "#F5F5F0" }}>
                      Sem {course.semester}
                    </p>
                    <p className="font-body mt-0.5 text-xs" style={{ color: "rgba(136,153,187,0.45)" }}>Semester</p>
                  </div>
                )}
                {course.year && (
                  <div className="stat-box">
                    <GraduationCap className="mx-auto mb-1.5 h-4 w-4" style={{ color: "#8899BB" }} />
                    <p className="font-display text-xs font-semibold" style={{ color: "#F5F5F0" }}>
                      Year {course.year}
                    </p>
                    <p className="font-body mt-0.5 text-xs" style={{ color: "rgba(136,153,187,0.45)" }}>Level</p>
                  </div>
                )}
                <div className="stat-box">
                  <BookOpen className="mx-auto mb-1.5 h-4 w-4" style={{ color: "#16A34A" }} />
                  <p className="font-display text-xs font-semibold" style={{ color: "#F5F5F0" }}>
                    {course.sections?.length ?? 0}
                  </p>
                  <p className="font-body mt-0.5 text-xs" style={{ color: "rgba(136,153,187,0.45)" }}>Sections</p>
                </div>
              </div>
            </div>

            {/* Sections preview */}
            {course.sections && course.sections.length > 0 && (
              <div className="panel p-7">
                <h2 className="font-display mb-4 text-base font-bold" style={{ color: "#F5F5F0" }}>
                  Course Content ({course.sections.length})
                </h2>
                <div className="space-y-2">
                  {course.sections.slice(0, 5).map((section, i) => (
                    <div key={section.id} className="section-row">
                      <span className="num-badge">{i + 1}</span>
                      <span className="font-body text-sm font-medium" style={{ color: "#F5F5F0" }}>
                        {section.title}
                      </span>
                    </div>
                  ))}
                  {course.sections.length > 5 && (
                    <p className="font-body pt-2 text-center text-xs" style={{ color: "rgba(136,153,187,0.40)" }}>
                      +{course.sections.length - 5} more sections — enroll to see all
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="panel p-7" style={{ position: "sticky", top: "96px", borderColor: "rgba(34,197,94,0.22)" }}>
              {course.localPrice ? (
                <div className="mb-5">
                  <p className="font-display text-2xl font-bold" style={{ color: "#F5F5F0" }}>
                    LKR {Number(course.localPrice).toLocaleString()}
                  </p>
                  {course.foreignPrice && (
                    <p className="font-body mt-1 text-sm" style={{ color: "rgba(136,153,187,0.45)" }}>
                      USD {Number(course.foreignPrice).toLocaleString()} for international students
                    </p>
                  )}
                </div>
              ) : (
                <p className="font-body mb-5 text-sm" style={{ color: "rgba(136,153,187,0.55)" }}>
                  Contact institution for pricing
                </p>
              )}

              <button onClick={() => router.push("/login")} className="gold-btn font-display w-full rounded-xl py-3 text-sm font-bold shadow-lg">
                Login to Enroll
              </button>
              <button onClick={() => router.push("/signup")} className="ghost-btn font-display mt-2.5 w-full rounded-xl py-3 text-sm font-semibold">
                Create Free Account
              </button>

              <div className="mt-5 space-y-2.5">
                {[
                  "Full course access",
                  "Progress tracking",
                  "Certificate on completion",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#22C55E" }} />
                    <span className="font-body text-xs" style={{ color: "rgba(136,153,187,0.60)" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel p-6">
              <h3 className="font-display mb-4 text-sm font-bold" style={{ color: "#F5F5F0" }}>
                Quick Facts
              </h3>
              <div>
                {[
                  { label: "Type", value: isModule ? "Module" : "Standalone Course" },
                  ...(course.code ? [{ label: "Code", value: course.code }] : []),
                  ...(course.creditHours ? [{ label: "Credit Hours", value: `${course.creditHours} hrs` }] : []),
                  ...(course.semester ? [{ label: "Semester", value: `Semester ${course.semester}` }] : []),
                  ...(course.year ? [{ label: "Year", value: `Year ${course.year}` }] : []),
                  { label: "Mandatory", value: course.isMandatory ? "Core" : "Elective" },
                ].map(({ label, value }, i, arr) => (
                  <div key={label} className="flex items-center justify-between py-2.5 text-sm"
                    style={{ borderBottom: i === arr.length - 1 ? "none" : "1px solid rgba(136,153,187,0.08)" }}>
                    <span className="font-body" style={{ color: "rgba(136,153,187,0.45)" }}>{label}</span>
                    <span className="font-display text-right text-xs font-semibold" style={{ color: "#F5F5F0" }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}