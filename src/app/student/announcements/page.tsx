"use client";

import { Bell, Pin } from "lucide-react";
import { useFetch } from "@/hooks/useFetch";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

interface Notice {
  _id: string;
  title: string;
  body: string;
  pinned: boolean;
  createdAt: string;
}

function formatDate(dateString: string) {
  try {
    return new Date(dateString).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateString;
  }
}

export default function AnnouncementsPage() {
  const { data: notices, loading } = useFetch<Notice[]>("/api/notices", []);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Announcements" subtitle="Stay updated with college notices and announcements." />

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, skeletonIdx) => (
            <div key={skeletonIdx} className="rounded-xl border border-gray-100 bg-white p-5 animate-pulse space-y-2">
              <div className="h-4 bg-gray-100 rounded w-1/3" />
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : notices.length === 0 ? (
        <EmptyState
          icon={<Bell size={30} />}
          iconClassName="bg-red-50 text-red-500"
          title="No announcements"
          subtitle="College announcements and notices will appear here."
        />
      ) : (
        <ul className="space-y-3">
          {notices.map((notice) => (
            <li
              key={notice._id}
              className={`rounded-xl p-5 border shadow-sm transition-colors ${
                notice.pinned ? "bg-amber-50 border-amber-200" : "bg-white border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-gray-800">{notice.title}</p>
                {notice.pinned && (
                  <span className="flex items-center gap-1 text-xs font-medium bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full shrink-0">
                    <Pin size={10} />
                    Pinned
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap leading-relaxed">{notice.body}</p>
              <p className="text-xs text-gray-400 mt-3">{formatDate(notice.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
