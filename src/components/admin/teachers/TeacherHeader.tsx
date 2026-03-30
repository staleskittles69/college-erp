"use client";

import { useState } from "react";
import { Mail, Phone, Pencil, Bell } from "lucide-react";

export interface TeacherDetail {
  id: string;
  name: string;
  subject: string;
  branch: string;
  email: string;
  phone: string;
}

export default function TeacherHeader({ teacher }: { teacher: TeacherDetail }) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col sm:flex-row gap-6 items-start">
      <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600 font-bold text-3xl">
        {teacher.name.charAt(0)}
      </div>

      <div className="flex-1 space-y-1">
        <p className="text-xl font-bold text-gray-900">{teacher.name}</p>
        <p className="text-sm text-gray-500">{teacher.subject} · {teacher.branch}</p>
        <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
          <span className="flex items-center gap-1.5"><Phone size={14} />{teacher.phone}</span>
          <span className="flex items-center gap-1.5"><Mail size={14} />{teacher.email}</span>
        </div>
      </div>

      <div className="flex gap-2 flex-shrink-0">
        <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <Bell size={14} /> Send Notice
        </button>
        <button
          onClick={() => setEditing((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
            editing
              ? "bg-indigo-600 text-white border-indigo-600"
              : "border-gray-200 hover:bg-gray-50"
          }`}
        >
          <Pencil size={14} /> {editing ? "Done" : "Edit"}
        </button>
      </div>
    </div>
  );
}
