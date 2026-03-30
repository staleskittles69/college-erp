"use client";

import { useState } from "react";

const YEARS = ["Year 1", "Year 2", "Year 3", "Year 4"];

const TOPICS: Record<string, { topic: string; deadline: string; classes: number }[]> = {
  "Year 1": [
    { topic: "Introduction to Programming",  deadline: "2026-02-10", classes: 6 },
    { topic: "Arrays & Strings",             deadline: "2026-02-24", classes: 4 },
    { topic: "Recursion",                    deadline: "2026-03-10", classes: 5 },
  ],
  "Year 2": [
    { topic: "Linked Lists",                 deadline: "2026-02-14", classes: 5 },
    { topic: "Stacks & Queues",              deadline: "2026-02-28", classes: 4 },
    { topic: "Trees & Graphs",               deadline: "2026-03-20", classes: 7 },
  ],
  "Year 3": [
    { topic: "Dynamic Programming",          deadline: "2026-02-18", classes: 6 },
    { topic: "Greedy Algorithms",            deadline: "2026-03-04", classes: 4 },
    { topic: "Sorting & Searching",          deadline: "2026-03-25", classes: 5 },
  ],
  "Year 4": [
    { topic: "System Design Basics",         deadline: "2026-02-22", classes: 5 },
    { topic: "Distributed Systems",          deadline: "2026-03-08", classes: 4 },
    { topic: "Interview Preparation",        deadline: "2026-04-01", classes: 8 },
  ],
};

export default function TeacherTopics() {
  const [year, setYear] = useState("Year 1");
  const rows = TOPICS[year];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-base font-semibold text-gray-800 mb-4">Academic Topics</h3>

      {/* Year tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {YEARS.map((y) => (
          <button
            key={y}
            onClick={() => setYear(y)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              year === y
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50"
            }`}
          >
            {y}
          </button>
        ))}
      </div>

      {/* Table */}
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
            <th className="pb-2 font-medium">Topic Name</th>
            <th className="pb-2 font-medium">Deadline</th>
            <th className="pb-2 font-medium text-right">No. of Classes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-50 last:border-0">
              <td className="py-2.5 text-gray-800">{row.topic}</td>
              <td className="py-2.5 text-gray-500 text-xs">{row.deadline}</td>
              <td className="py-2.5 text-gray-700 font-semibold text-right">{row.classes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
