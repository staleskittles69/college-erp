"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

interface NoticeItem {
  _id: string;
  title: string;
  body: string;
  pinned: boolean;
  createdAt: string;
}

export function NoticeBoard() {
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notices", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then(setNotices)
      .catch(() => setNotices([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notice board</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Loading…</p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return d;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notice board</CardTitle>
      </CardHeader>
      <CardContent>
        {notices.length === 0 ? (
          <p className="text-gray-500">No notices yet.</p>
        ) : (
          <ul className="space-y-4">
            {notices.map((n) => (
              <li
                key={n._id}
                className={`border-b border-gray-100 pb-4 last:border-0 ${
                  n.pinned ? "bg-amber-50 -mx-2 px-2 py-2 rounded-lg border border-amber-100" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <p className="font-medium">{n.title}</p>
                  {n.pinned && (
                    <span className="text-xs bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded">
                      Pinned
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                  {n.body}
                </p>
                <p className="text-xs text-gray-400 mt-2">{formatDate(n.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
