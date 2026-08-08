"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

interface Props {
  slug: string;
  name: string;
  label: string;
  teacherCount: number;
  color: string;
}

export default function DepartmentCard({ slug, name, label, teacherCount, color }: Props) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/admin/teachers/${slug}`)}
      className={`bg-white rounded-xl border-2 px-5 py-5 cursor-pointer transition-all duration-150 group ${color}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xl font-bold text-gray-900">{name}</p>
          <p className="text-xs text-gray-500 mt-1 leading-snug">{label}</p>
        </div>
        <ArrowRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors mt-0.5 flex-shrink-0 ml-2" />
      </div>
      <p className="text-sm font-semibold text-gray-700 mt-4">
        {teacherCount}{" "}
        <span className="font-normal text-gray-400 text-xs">teachers</span>
      </p>
    </div>
  );
}
