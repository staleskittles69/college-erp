"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

interface TestItem {
  _id: string;
  subject: string;
  title: string;
  date: string;
  maxMarks?: number;
}

export function UpcomingTests() {
  const [tests, setTests] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tests?upcoming=true", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then(setTests)
      .catch(() => setTests([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming tests</CardTitle>
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
        <CardTitle>Upcoming tests</CardTitle>
      </CardHeader>
      <CardContent>
        {tests.length === 0 ? (
          <p className="text-gray-500">No upcoming tests.</p>
        ) : (
          <ul className="space-y-3">
            {tests.map((t) => (
              <li
                key={t._id}
                className="flex justify-between items-start border-b border-gray-100 pb-2 last:border-0"
              >
                <div>
                  <p className="font-medium">{t.title}</p>
                  <p className="text-sm text-gray-500">{t.subject}</p>
                </div>
                <span className="text-sm text-gray-600 whitespace-nowrap ml-2">
                  {formatDate(t.date)}
                  {t.maxMarks != null && ` · ${t.maxMarks} marks`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
