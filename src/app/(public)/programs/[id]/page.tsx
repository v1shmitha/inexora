"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Clock,
  Globe,
  BookOpen,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Award,
  Briefcase,
} from "lucide-react";
import { api } from "~/trpc/react";
import { createClient } from "~/lib/supabase/client";

const DELIVERY_LABELS: Record<string, string> = {
  ONLINE: "Online",
  ON_CAMPUS: "On Campus",
  HYBRID: "Hybrid",
  BLENDED: "Blended",
};
const DELIVERY_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  ONLINE: {
    bg: "rgba(34,197,94,0.10)",
    text: "#22C55E",
    border: "rgba(34,197,94,0.25)",
  },
  ON_CAMPUS: {
    bg: "rgba(56,189,248,0.12)",
    text: "#38BDF8",
    border: "rgba(56,189,248,0.25)",
  },
  HYBRID: {
    bg: "rgba(136,153,187,0.12)",
    text: "#8899BB",
    border: "rgba(136,153,187,0.25)",
  },
  BLENDED: {
    bg: "rgba(34,197,94,0.08)",
    text: "#16A34A",
    border: "rgba(34,197,94,0.20)",
  },
};
const TYPE_LABELS: Record<string, string> = {
  BACHELOR: "Bachelor's",
  MASTER: "Master's",
  PHD: "PhD",
  DIPLOMA: "Diploma",
  CERTIFICATE: "Certificate",
  FOUNDATION: "Foundation",
  PROFESSIONAL: "Professional",
  MICROCREDENTIAL: "Microcredential",
  SHORT_COURSE: "Short Course",
};

export default function PublicProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const check = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("Profile")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profile?.role === "STUDENT") {
        router.replace(`/dashboard/student/programs/${id}`);
      }
    };
    void check();
  }, [id]);

  const { data: program, isLoading } = api.program.getPublicById.useQuery(
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
        --navy-border-strong: rgba(136,153,187,0.20);
        --gold:         #22C55E;
        --gold-dim:     #16A34A;
        --gold-glow:    rgba(34,197,94,0.18);
        --gold-subtle:  rgba(34,197,94,0.08);
        --blue-acc:     #38BDF8;
        --blue-dim:     rgba(56,189,248,0.15);
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
        transition: border-color 0.3s ease, box-shadow 0.3s ease;
      }
      .panel:hover {
        border-color: rgba(34,197,94,0.20);
      }

      .stat-box {
        background: rgba(10,15,30,0.40);
        border: 1px solid var(--navy-border);
        border-radius: 12px;
        padding: 14px 10px;
        text-align: center;
      }

      .module-row {
        display: flex;
        align-items: center;
        gap: 12px;
        border-radius: 12px;
        padding: 12px 16px;
        background: rgba(10,15,30,0.40);
        border: 1px solid var(--navy-border);
        transition: border-color 0.2s ease;
      }
      .module-row:hover { border-color: rgba(34,197,94,0.22); }

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

      .core-tag {
        background: rgba(34,197,94,0.10);
        border: 1px solid rgba(34,197,94,0.25);
        color: #22C55E;
        border-radius: 9999px;
        padding: 2px 9px;
        font-size: 10px;
        font-weight: 600;
        font-family: 'Inter', sans-serif;
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

      .verified-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        font-family: 'Inter', sans-serif;
        color: #22C55E;
      }
    `}</style>
  );

  if (isLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "#0A0F1E" }}
      >
        {styles}
        <Loader2
          className="h-8 w-8 animate-spin"
          style={{ color: "#22C55E" }}
        />
      </div>
    );
  }

  if (!program) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-4"
        style={{ background: "#0A0F1E" }}
      >
        {styles}
        <p
          className="font-body font-medium"
          style={{ color: "rgba(136,153,187,0.70)" }}
        >
          Program not found.
        </p>
        <button
          onClick={() => router.push("/programs")}
          className="font-body text-sm"
          style={{ color: "#22C55E" }}
        >
          Back to Programs
        </button>
      </div>
    );
  }

  const deliveryStyle = DELIVERY_COLORS[program.deliveryMode] ?? {
    bg: "rgba(136,153,187,0.10)",
    text: "#8899BB",
    border: "rgba(136,153,187,0.20)",
  };

  return (
    <div
      className="overflow-x-hidden font-sans"
      style={{ background: "#0A0F1E", minHeight: "100vh" }}
    >
      {styles}

      {/* Back bar */}
      <div style={{ borderBottom: "1px solid rgba(136,153,187,0.10)" }}>
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <button
            onClick={() => router.push("/programs")}
            className="back-link"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Programs
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
                <span
                  className="badge-pill"
                  style={{
                    background: "rgba(136,153,187,0.10)",
                    color: "rgba(136,153,187,0.80)",
                    border: "1px solid rgba(136,153,187,0.18)",
                  }}
                >
                  {TYPE_LABELS[program.type] ?? program.type}
                </span>
                <span
                  className="badge-pill"
                  style={{
                    background: deliveryStyle.bg,
                    color: deliveryStyle.text,
                    border: `1px solid ${deliveryStyle.border}`,
                  }}
                >
                  {DELIVERY_LABELS[program.deliveryMode] ??
                    program.deliveryMode}
                </span>
                {program.scholarshipAvailable && (
                  <span
                    className="badge-pill"
                    style={{
                      background: "rgba(34,197,94,0.10)",
                      color: "#22C55E",
                      border: "1px solid rgba(34,197,94,0.25)",
                    }}
                  >
                    Scholarship Available
                  </span>
                )}
              </div>

              <h1
                className="font-display text-2xl leading-snug font-bold"
                style={{ color: "#F5F5F0" }}
              >
                {program.title}
              </h1>

              <div
                className="mt-3 flex items-center gap-2"
                style={{ color: "rgba(136,153,187,0.60)" }}
              >
                <Building2 className="h-4 w-4" />
                <span className="font-body text-sm font-medium">
                  {program.institution.name}
                </span>

                {program.institution.isVerified && (
                  <div className="verified-pill">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                    Institution
                  </div>
                )}
              </div>

              {program.description && (
                <p
                  className="font-body mt-4 text-sm leading-relaxed"
                  style={{ color: "rgba(136,153,187,0.65)" }}
                >
                  {program.description}
                </p>
              )}

              {/* Quick stats */}
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {program.durationMonths && (
                  <div className="stat-box">
                    <Clock
                      className="mx-auto mb-1.5 h-4 w-4"
                      style={{ color: "#22C55E" }}
                    />
                    <p
                      className="font-display text-xs font-semibold"
                      style={{ color: "#F5F5F0" }}
                    >
                      {program.durationMonths >= 12
                        ? `${Math.round(program.durationMonths / 12)} Year${program.durationMonths >= 24 ? "s" : ""}`
                        : `${program.durationMonths} Months`}
                    </p>
                    <p
                      className="font-body mt-0.5 text-xs"
                      style={{ color: "rgba(136,153,187,0.45)" }}
                    >
                      Duration
                    </p>
                  </div>
                )}
                {program.creditPoints && (
                  <div className="stat-box">
                    <Award
                      className="mx-auto mb-1.5 h-4 w-4"
                      style={{ color: "#38BDF8" }}
                    />
                    <p
                      className="font-display text-xs font-semibold"
                      style={{ color: "#F5F5F0" }}
                    >
                      {program.creditPoints}
                    </p>
                    <p
                      className="font-body mt-0.5 text-xs"
                      style={{ color: "rgba(136,153,187,0.45)" }}
                    >
                      Credits
                    </p>
                  </div>
                )}
                {program.language?.length > 0 && (
                  <div className="stat-box">
                    <Globe
                      className="mx-auto mb-1.5 h-4 w-4"
                      style={{ color: "#8899BB" }}
                    />
                    <p
                      className="font-display text-xs font-semibold"
                      style={{ color: "#F5F5F0" }}
                    >
                      {program.language.join(", ")}
                    </p>
                    <p
                      className="font-body mt-0.5 text-xs"
                      style={{ color: "rgba(136,153,187,0.45)" }}
                    >
                      Language
                    </p>
                  </div>
                )}
                <div className="stat-box">
                  <BookOpen
                    className="mx-auto mb-1.5 h-4 w-4"
                    style={{ color: "#16A34A" }}
                  />
                  <p
                    className="font-display text-xs font-semibold"
                    style={{ color: "#F5F5F0" }}
                  >
                    {program.courses?.length ?? 0}
                  </p>
                  <p
                    className="font-body mt-0.5 text-xs"
                    style={{ color: "rgba(136,153,187,0.45)" }}
                  >
                    Modules
                  </p>
                </div>
              </div>
            </div>

            {/* Entry Requirements */}
            {program.entryRequirements && (
              <div className="panel p-7">
                <h2
                  className="font-display mb-3 text-base font-bold"
                  style={{ color: "#F5F5F0" }}
                >
                  Entry Requirements
                </h2>
                <p
                  className="font-body text-sm leading-relaxed"
                  style={{ color: "rgba(136,153,187,0.65)" }}
                >
                  {program.entryRequirements}
                </p>
              </div>
            )}

            {/* Career Outcomes */}
            {program.careerOutcomes && (
              <div className="panel p-7">
                <div className="mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" style={{ color: "#22C55E" }} />
                  <h2
                    className="font-display text-base font-bold"
                    style={{ color: "#F5F5F0" }}
                  >
                    Career Outcomes
                  </h2>
                </div>
                <p
                  className="font-body text-sm leading-relaxed"
                  style={{ color: "rgba(136,153,187,0.65)" }}
                >
                  {program.careerOutcomes}
                </p>
              </div>
            )}

            {/* Modules preview */}
            {program.courses && program.courses.length > 0 && (
              <div className="panel p-7">
                <h2
                  className="font-display mb-4 text-base font-bold"
                  style={{ color: "#F5F5F0" }}
                >
                  Program Modules ({program.courses.length})
                </h2>
                <div className="space-y-2">
                  {program.courses.slice(0, 5).map((course, i) => (
                    <div key={course.id} className="module-row">
                      <span className="num-badge">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="font-body text-sm font-medium"
                            style={{ color: "#F5F5F0" }}
                          >
                            {course.title}
                          </span>
                          {course.isMandatory && (
                            <span className="core-tag flex-shrink-0">Core</span>
                          )}
                        </div>
                        {course.description && (
                          <p
                            className="font-body mt-1 text-xs leading-relaxed"
                            style={{ color: "rgba(136,153,187,0.50)" }}
                          >
                            {course.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {program.courses.length > 5 && (
                    <p
                      className="font-body pt-2 text-center text-xs"
                      style={{ color: "rgba(136,153,187,0.40)" }}
                    >
                      +{program.courses.length - 5} more modules — enroll to see
                      all
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div
              className="panel p-7"
              style={{
                position: "sticky",
                top: "96px",
                borderColor: "rgba(34,197,94,0.22)",
              }}
            >
              {program.localPrice ? (
                <div className="mb-5">
                  <p
                    className="font-display text-2xl font-bold"
                    style={{ color: "#F5F5F0" }}
                  >
                    LKR {Number(program.localPrice).toLocaleString()}
                  </p>
                  {program.foreignPrice && (
                    <p
                      className="font-body mt-1 text-sm"
                      style={{ color: "rgba(136,153,187,0.45)" }}
                    >
                      USD {Number(program.foreignPrice).toLocaleString()} for
                      international students
                    </p>
                  )}
                </div>
              ) : (
                <p
                  className="font-body mb-5 text-sm"
                  style={{ color: "rgba(136,153,187,0.55)" }}
                >
                  Contact institution for pricing
                </p>
              )}

              <button
                onClick={() => router.push("/login")}
                className="gold-btn font-display w-full rounded-xl py-3 text-sm font-bold shadow-lg"
              >
                Login to Enroll
              </button>
              <button
                onClick={() => router.push("/signup")}
                className="ghost-btn font-display mt-2.5 w-full rounded-xl py-3 text-sm font-semibold"
              >
                Create Free Account
              </button>

              <div className="mt-5 space-y-2.5">
                {[
                  "Full program access",
                  "Progress tracking",
                  "Certificate on completion",
                  program.scholarshipAvailable ? "Scholarship eligible" : null,
                ]
                  .filter(Boolean)
                  .map((item) => (
                    <div key={item} className="flex items-center gap-2.5">
                      <CheckCircle2
                        className="h-3.5 w-3.5 flex-shrink-0"
                        style={{ color: "#22C55E" }}
                      />
                      <span
                        className="font-body text-xs"
                        style={{ color: "rgba(136,153,187,0.60)" }}
                      >
                        {item}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="panel p-6">
              <h3
                className="font-display mb-4 text-sm font-bold"
                style={{ color: "#F5F5F0" }}
              >
                Quick Facts
              </h3>
              <div>
                {[
                  {
                    label: "Type",
                    value: TYPE_LABELS[program.type] ?? program.type,
                  },
                  {
                    label: "Level",
                    value: program.level.replace(/_/g, " "),
                  },
                  {
                    label: "Delivery",
                    value:
                      DELIVERY_LABELS[program.deliveryMode] ??
                      program.deliveryMode,
                  },
                  ...(program.durationMonths
                    ? [
                        {
                          label: "Duration",
                          value:
                            program.durationMonths >= 12
                              ? `${Math.round(program.durationMonths / 12)} Year${program.durationMonths >= 24 ? "s" : ""}`
                              : `${program.durationMonths} Months`,
                        },
                      ]
                    : []),
                  ...(program.creditPoints
                    ? [
                        {
                          label: "Credits",
                          value: `${program.creditPoints} points`,
                        },
                      ]
                    : []),
                  {
                    label: "Language",
                    value: program.language.join(", ") || "—",
                  },
                ].map(({ label, value }, i, arr) => (
                  <div
                    key={label}
                    className="flex items-center justify-between py-2.5 text-sm"
                    style={{
                      borderBottom:
                        i === arr.length - 1
                          ? "none"
                          : "1px solid rgba(136,153,187,0.08)",
                    }}
                  >
                    <span
                      className="font-body"
                      style={{ color: "rgba(136,153,187,0.45)" }}
                    >
                      {label}
                    </span>
                    <span
                      className="font-display text-right text-xs font-semibold"
                      style={{ color: "#F5F5F0" }}
                    >
                      {value}
                    </span>
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
