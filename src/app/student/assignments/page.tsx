"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Clock, CheckCircle } from "lucide-react";

interface Test {
  _id: string;
  subject: string;
  title: string;
  date: string;
  maxMarks: number | null;
}

function formatDate(dateStr: string) {
  const dateObj = new Date(dateStr);
  return dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function AssignmentsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tests")
      .then((response) => response.json())
      .then((data: Test[]) => setTests(data))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const upcoming = tests.filter((test) => new Date(test.date) >= now);
  const past = tests.filter((test) => new Date(test.date) < now);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl bg-gradient-to-br from-[#0a1f44] to-[#1a56db] px-8 py-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold tracking-tight">Assignments & Tests</h1>
        <p className="text-blue-200 text-sm mt-1">Your scheduled tests and assessments.</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, skeletonIdx) => (
            <div key={skeletonIdx} className="rounded-xl border border-gray-100 bg-white p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : tests.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-16 flex flex-col items-center justify-center min-h-[300px] gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <ClipboardList size={30} className="text-indigo-500" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-700">No tests scheduled</p>
            <p className="text-sm text-gray-400 mt-1">Tests added by your teachers will appear here.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock size={15} className="text-blue-600" />
                <h2 className="font-semibold text-gray-700 text-sm">Upcoming</h2>
              </div>
              <div className="space-y-3">
                {upcoming.map((test) => (
                  <div key={test._id} className="rounded-xl border border-blue-100 bg-white shadow-sm px-5 py-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-gray-800">{test.title}</p>
                      <p className="text-xs text-blue-600 mt-0.5">{test.subject}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-gray-700">{formatDate(test.date)}</p>
                      {test.maxMarks != null && (
                        <p className="text-xs text-gray-400 mt-0.5">{test.maxMarks} marks</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={15} className="text-gray-400" />
                <h2 className="font-semibold text-gray-400 text-sm">Past</h2>
              </div>
              <div className="space-y-3">
                {past.map((test) => (
                  <div key={test._id} className="rounded-xl border border-gray-100 bg-gray-50 px-5 py-4 flex items-center justify-between gap-4 opacity-70">
                    <div>
                      <p className="font-semibold text-gray-700">{test.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{test.subject}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-gray-500">{formatDate(test.date)}</p>
                      {test.maxMarks != null && (
                        <p className="text-xs text-gray-400 mt-0.5">{test.maxMarks} marks</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
