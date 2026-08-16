"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { isAssignmentType } from "@/lib/academics";
import { useFetch } from "@/hooks/useFetch";

interface TestItem {
  _id: string;
  subject: string;
  title: string;
  date: string;
  maxMarks?: number;
  testType?: string | null;
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

export function UpcomingTests() {
  const { data: tests, loading } = useFetch<TestItem[]>("/api/tests?upcoming=true", []);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader><CardTitle>Upcoming deadlines</CardTitle></CardHeader>
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
        <CardTitle>Upcoming deadlines</CardTitle>
      </CardHeader>
      <CardContent>
        {tests.length === 0 ? (
          <p className="text-gray-500 text-sm">No upcoming deadlines.</p>
        ) : (
          <ul className="space-y-3">
            {tests.map((test) => {
              const assignment = isAssignmentType(test.testType);
              return (
                <li key={test._id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                  {/* Date chip */}
                  <div className={`shrink-0 w-12 rounded-xl text-white text-center py-1.5 ${assignment ? "bg-amber-500" : "bg-orange-600"}`}>
                    <p className="text-xs font-bold leading-tight">{formatDate(test.date)}</p>
                    <p className="text-xs opacity-75 leading-tight">{formatYear(test.date)}</p>
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-gray-800 truncate">{test.title}</p>
                      <span className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded ${assignment ? "bg-amber-50 text-amber-600" : "bg-orange-50 text-orange-600"}`}>
                        {assignment ? "Assignment" : "Test"}
                      </span>
                    </div>
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
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
