"use client";

import { Loader2 } from "lucide-react";
import { api } from "~/trpc/react";

export default function AnnouncementList({ limit }: { limit?: number }) {
  const { data, isLoading } = api.enrollment.getMyAnnouncements.useQuery(
    limit ? { limit } : undefined,
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="text-brand h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        No announcements to show right now.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {data.map((a) => {
        const source = a.program?.title ?? a.institution?.name ?? "Platform";
        const date = (a.publishedAt ?? a.createdAt).toLocaleDateString();
        return (
          <li key={a.id} className="py-3 first:pt-0 last:pb-0">
            <p className="text-sm font-semibold text-slate-900">{a.title}</p>
            <p className="mt-0.5 text-xs text-slate-400">
              {source} · {date}
            </p>
            {a.content && (
              <p className="mt-1 line-clamp-3 text-sm text-slate-600">
                {a.content}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
