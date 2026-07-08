"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Pin } from "lucide-react";

interface NoticeItem {
  _id: string;
  title: string;
  body: string;
  pinned: boolean;
  createdAt: string;
}

function formatDate(dateString: string) {
  try {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

export function NoticeBoard() {
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notices", { credentials: "include" })
      .then((response) => (response.ok ? response.json() : []))
      .then(setNotices)
      .catch(() => setNotices([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader><CardTitle>Notice board</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((skeletonIdx) => (
              <div key={skeletonIdx} className="p-3 rounded-xl bg-gray-50 space-y-1.5">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-3/4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <CardTitle>Notice board</CardTitle>
      </CardHeader>
      <CardContent>
        {notices.length === 0 ? (
          <p className="text-gray-500 text-sm">No notices yet.</p>
        ) : (
          <ul className="space-y-3">
            {notices.map((notice) => (
              <li
                key={notice._id}
                className={`rounded-xl p-4 border transition-colors ${
                  notice.pinned
                    ? "bg-amber-50 border-amber-200"
                    : "bg-gray-50 border-gray-100 hover:border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm text-gray-800">{notice.title}</p>
                  {notice.pinned && (
                    <span className="flex items-center gap-1 text-xs font-medium bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full shrink-0">
                      <Pin size={10} />
                      Pinned
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1.5 whitespace-pre-wrap leading-relaxed">
                  {notice.body}
                </p>
                <p className="text-xs text-gray-400 mt-2">{formatDate(notice.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
