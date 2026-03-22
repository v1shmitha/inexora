"use client";

import { Clock, CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  status: "PENDING" | "APPROVED" | "REJECTED";
  role: "LECTURER" | "INSTITUTION_ADMIN" | "EMPLOYER";
}

const roleLabels = {
  LECTURER: "Lecturer",
  INSTITUTION_ADMIN: "Institution",
  EMPLOYER: "Employer",
};

export default function ApprovalStatusBanner({ status, role }: Props) {
  const router = useRouter();

  if (status === "APPROVED") return null;

  if (status === "PENDING") {
    return (
      <div className="mb-6 flex items-start gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
          <Clock className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <p className="font-semibold text-amber-800">Your {roleLabels[role]} account is pending approval</p>
          <p className="mt-0.5 text-sm text-amber-700">
            Our team is reviewing your application. You'll have full access once approved.
            This usually takes 1–2 hours.
          </p>
        </div>
      </div>
    );
  }

  if (status === "REJECTED") {
    return (
      <div className="mb-6 flex items-start gap-4 rounded-xl border border-red-200 bg-red-50 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
          <XCircle className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <p className="font-semibold text-red-800">Your {roleLabels[role]} application was not approved</p>
          <p className="mt-0.5 text-sm text-red-700">
            Unfortunately your application was rejected. Please contact support at{" "}
            <a href="mailto:support@deh-sl.lk" className="underline">support@deh-sl.lk</a>{" "}
            for more information.
          </p>
        </div>
      </div>
    );
  }

  return null;
}