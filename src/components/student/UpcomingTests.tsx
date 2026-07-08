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

function formatDate(dateString: string) {
  try {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return dateString;
  }
}

function formatYear(dateString: string) {
  try {
    return new Date(dateString).getFullYear().toString();
  } catch {
    return "";
  }
}

const BADGE_COLORS = [
  "bg-blue-600",
  "bg-indigo-600",
  "bg-purple-600",
  "bg-cyan-600",
  "bg-teal-600",
];

export function UpcomingTests() {
  const [tests, setTests] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tests?upcoming=true", { credentials: "include" })
      .then((response) => (response.ok ? response.json() : []))
      .then(setTests)
      .catch(() => setTests([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader><CardTitle>Upcoming tests</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((skeletonIdx) => (
              <div key={skeletonIdx} className="flex gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-xl shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
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
        <CardTitle>Upcoming tests</CardTitle>
      </CardHeader>
      <CardContent>
        {tests.length === 0 ? (
          <p className="text-gray-500 text-sm">No upcoming tests.</p>
        ) : (
          <ul className="space-y-3">
            {tests.map((test, testIdx) => (
              <li key={test._id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                {/* Date chip */}
                <div className={`shrink-0 w-12 rounded-xl text-white text-center py-1.5 ${BADGE_COLORS[testIdx % BADGE_COLORS.length]}`}>
                  <p className="text-xs font-bold leading-tight">{formatDate(test.date)}</p>
                  <p className="text-xs opacity-75 leading-tight">{formatYear(test.date)}</p>
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800 truncate">{test.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-gray-500">{test.subject}</span>
                    {test.maxMarks != null && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                        {test.maxMarks} marks
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
