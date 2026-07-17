"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Clock, CheckCircle, ChevronDown, Paperclip, StickyNote } from "lucide-react";
import { isAssignmentType } from "@/lib/academics";

interface Test {
  _id: string;
  subject: string;
  title: string;
  date: string;
  maxMarks: number | null;
  testType?: string | null;
  dueTime?: string | null;
  notes?: string | null;
  attachmentUrl?: string | null;
}

function formatDate(dateStr: string) {
  const dateObj = new Date(dateStr);
  return dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function TypeBadge({ testType }: { testType?: string | null }) {
  const assignment = isAssignmentType(testType);
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${assignment ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"}`}>
      {assignment ? "Assignment" : "Test"}
    </span>
  );
}

function TestRow({ test, dimmed }: { test: Test; dimmed: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = Boolean(test.dueTime || test.notes || test.attachmentUrl);

  return (
    <div className={`rounded-xl border ${dimmed ? "border-gray-100 bg-gray-50 opacity-70" : "border-blue-100 bg-white shadow-sm"} overflow-hidden`}>
      <button
        onClick={() => hasDetails && setExpanded((prev) => !prev)}
        className={`w-full px-5 py-4 flex items-center justify-between gap-4 text-left ${hasDetails ? "cursor-pointer" : "cursor-default"}`}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`font-semibold ${dimmed ? "text-gray-700" : "text-gray-800"}`}>{test.title}</p>
            <TypeBadge testType={test.testType} />
          </div>
          <p className={`text-xs mt-0.5 ${dimmed ? "text-gray-500" : "text-blue-600"}`}>{test.subject}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className={`text-sm font-medium ${dimmed ? "text-gray-500" : "text-gray-700"}`}>{formatDate(test.date)}</p>
            {test.maxMarks != null && (
              <p className="text-xs text-gray-400 mt-0.5">{test.maxMarks} marks</p>
            )}
          </div>
          {hasDetails && (
            <ChevronDown size={16} className={`text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
          )}
        </div>
      </button>

      {expanded && hasDetails && (
        <div className="px-5 pb-4 pt-1 border-t border-gray-100 space-y-2">
          {test.dueTime && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Clock size={13} className="text-gray-400" />
              <span>Due {test.dueTime}</span>
            </div>
          )}
          {test.notes && (
            <div className="flex items-start gap-2 text-xs text-gray-600">
              <StickyNote size={13} className="text-gray-400 mt-0.5 shrink-0" />
              <span className="whitespace-pre-wrap">{test.notes}</span>
            </div>
          )}
          {test.attachmentUrl && (
            <a
              href={test.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline"
            >
              <Paperclip size={13} /> View attachment
            </a>
          )}
        </div>
      )}
    </div>
  );
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
                  <TestRow key={test._id} test={test} dimmed={false} />
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
                  <TestRow key={test._id} test={test} dimmed={true} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
