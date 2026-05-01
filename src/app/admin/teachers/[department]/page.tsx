"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Search, Plus, Mail, BookOpen, ChevronRight } from "lucide-react";
import { useTeachers } from "@/contexts/TeachersContext";
import Breadcrumb from "@/components/admin/Breadcrumb";
import AddTeacherModal from "@/components/admin/teachers/AddTeacherModal";

export default function DepartmentPage() {
  const { department: slug } = useParams() as { department: string };
  const { teachers, departments } = useTeachers();
  const dept = departments.find((d) => d.slug === slug);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const filtered = teachers
    .filter((t) => t.department === slug)
    .filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Breadcrumb
        items={[
          { label: "Teachers", href: "/admin/teachers" },
          { label: dept?.name ?? slug },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{dept?.name ?? slug}</h1>
          <p className="text-sm text-gray-500 mt-1">{dept?.label}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={15} /> Add Teacher
        </button>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search teachers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
        />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-400">
            No teachers found.
          </div>
        ) : (
          filtered.map((teacher) => (
            <div
              key={teacher.id}
              className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4"
            >
              <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600 font-bold text-lg">
                {teacher.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{teacher.name}</p>
                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                  <Mail size={11} /> {teacher.email}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400 flex-shrink-0">
                <BookOpen size={12} />
                <span>
                  {teacher.teaching.length} class{teacher.teaching.length !== 1 ? "es" : ""}
                </span>
              </div>
              <Link
                href={`/admin/teachers/${slug}/${teacher.id}`}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                View Details <ChevronRight size={13} />
              </Link>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <AddTeacherModal departmentSlug={slug} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
