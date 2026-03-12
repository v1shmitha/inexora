"use client";

import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight } from "lucide-react";

interface Props {
  role: "STUDENT" | "LECTURER" | "INSTITUTION_ADMIN" | "EMPLOYER";
}

const roleConfig = {
  STUDENT: {
    message: "Complete your student profile to access enrollments, career map, and job applications.",
    color: "border-blue-200 bg-blue-50",
    iconColor: "text-blue-500",
    buttonColor: "bg-blue-600 hover:bg-blue-700",
    textColor: "text-blue-800",
  },
  LECTURER: {
    message: "Complete your lecturer profile to get assigned to courses and upload resources.",
    color: "border-violet-200 bg-violet-50",
    iconColor: "text-violet-500",
    buttonColor: "bg-violet-600 hover:bg-violet-700",
    textColor: "text-violet-800",
  },
  INSTITUTION_ADMIN: {
    message: "Register your institution to start listing programs and managing enrollments.",
    color: "border-emerald-200 bg-emerald-50",
    iconColor: "text-emerald-500",
    buttonColor: "bg-emerald-600 hover:bg-emerald-700",
    textColor: "text-emerald-800",
  },
  EMPLOYER: {
    message: "Complete your company profile to post jobs and find qualified candidates.",
    color: "border-orange-200 bg-orange-50",
    iconColor: "text-orange-500",
    buttonColor: "bg-orange-500 hover:bg-orange-600",
    textColor: "text-orange-800",
  },
};

export default function SetupIncompleteBanner({ role }: Props) {
  const router = useRouter();
  const config = roleConfig[role];

  return (
    <div className={`mb-6 flex items-start justify-between gap-4 rounded-2xl border p-5 ${config.color}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className={`mt-0.5 h-5 w-5 shrink-0 ${config.iconColor}`} />
        <div>
          <p className={`font-semibold ${config.textColor}`}>Profile Setup Incomplete</p>
          <p className={`mt-0.5 text-sm ${config.textColor} opacity-80`}>{config.message}</p>
        </div>
      </div>
      <button
        onClick={() => router.push("/profile-setup")}
        className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition ${config.buttonColor}`}
      >
        Complete Setup <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}