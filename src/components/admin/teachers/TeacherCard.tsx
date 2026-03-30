"use client";

import { useRouter } from "next/navigation";
import { BookOpen, LayoutGrid } from "lucide-react";

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  branch: string;
  classes: number;
}

export default function TeacherCard({ teacher }: { teacher: Teacher }) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600 font-bold text-lg">
          {teacher.name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 leading-tight">{teacher.name}</p>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
            <BookOpen size={11} /> {teacher.subject}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <LayoutGrid size={12} />
        <span>{teacher.classes} classes</span>
      </div>

      <button
        onClick={() => router.push(`/admin/teachers/${teacher.id}`)}
        className="w-full text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg py-1.5 hover:bg-indigo-50 transition-colors"
      >
        View Details
      </button>
    </div>
  );
}
