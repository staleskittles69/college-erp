"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import TeacherCard, { Teacher } from "./TeacherCard";

const SUBJECTS = [
  { name: "Web Dev", label: "Web Development", key: "Web Development", teachers: 2, color: "border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50" },
  { name: "Backend", label: "Backend Engineering", key: "Backend", teachers: 2, color: "border-blue-200 hover:border-blue-400 hover:bg-blue-50" },
  { name: "Pharma", label: "Pharmaceutical Sciences", key: "Pharma", teachers: 2, color: "border-orange-200 hover:border-orange-400 hover:bg-orange-50" },
  { name: "Civil", label: "Civil Engineering", key: "Civil", teachers: 2, color: "border-green-200 hover:border-green-400 hover:bg-green-50" },
];

const TEACHERS: Teacher[] = [
  { id: "1", name: "Dr. Priya Sharma",  subject: "Web Dev",   branch: "Web Development", classes: 20 },
  { id: "2", name: "Prof. Rahul Verma", subject: "Frontend",  branch: "Web Development", classes: 18 },
  { id: "3", name: "Dr. Anita Patel",   subject: "Node.js",   branch: "Backend",         classes: 22 },
  { id: "4", name: "Prof. Arjun Rao",   subject: "Databases", branch: "Backend",         classes: 16 },
  { id: "5", name: "Dr. Neha Singh",    subject: "Pharma",    branch: "Pharma",          classes: 20 },
  { id: "6", name: "Prof. Kiran Das",   subject: "Pharma",    branch: "Pharma",          classes: 18 },
  { id: "7", name: "Dr. Rajesh Kumar",  subject: "Structures", branch: "Civil",          classes: 24 },
  { id: "8", name: "Prof. Meera Iyer",  subject: "Surveying", branch: "Civil",           classes: 20 },
];

export default function TeacherGrid() {
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = selected ? TEACHERS.filter((t) => t.branch === selected) : [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {SUBJECTS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSelected(selected === s.key ? null : s.key)}
            className={`bg-white rounded-xl border-2 px-5 py-5 text-left transition-all duration-150 group ${
              selected === s.key
                ? s.color.replace("hover:", "") + " " + s.color
                : "border-gray-200 " + s.color
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xl font-bold text-gray-900">{s.name}</p>
                <p className="text-xs text-gray-500 mt-1 leading-snug">{s.label}</p>
              </div>
              <ArrowRight
                size={16}
                className="text-gray-300 group-hover:text-gray-500 mt-0.5 transition-colors"
              />
            </div>
            <p className="text-sm font-semibold text-gray-700 mt-4">
              {s.teachers} <span className="font-normal text-gray-400 text-xs">teachers</span>
            </p>
          </button>
        ))}
      </div>

      {selected && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((teacher) => (
            <TeacherCard key={teacher.id} teacher={teacher} />
          ))}
        </div>
      )}
    </div>
  );
}
