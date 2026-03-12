import { ShieldX } from "lucide-react";

export default function SuspendedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
          <ShieldX className="h-10 w-10 text-red-500" />
        </div>
        <h1 className="mb-3 text-2xl font-bold text-slate-900">Account Suspended</h1>
        <p className="mb-6 text-slate-500">
          Your account has been suspended by an administrator. If you believe this
          is a mistake, please contact support.
        </p>
        <a
          href="mailto:support@deh-sl.lk"
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Contact Support
        </a>
      </div>
    </div>
  );
}