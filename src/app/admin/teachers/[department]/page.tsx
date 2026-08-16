"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Search, Plus, BookOpen, ChevronRight } from "lucide-react";
import { useTeachers } from "@/contexts/TeachersContext";
import Breadcrumb from "@/components/shared/Breadcrumb";
import AddSubjectModal from "@/components/admin/teachers/AddSubjectModal";

interface Subject {
  id: string;
  name: string;
  department: string;
  teacherCount: number;
}

export default function DepartmentPage() {
  const { department: slug } = useParams() as { department: string };
  const { departments } = useTeachers();
  const dept = departments.find((department) => department.slug === slug);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  function fetchSubjects() {
    return fetch(`/api/admin/subjects?department=${slug}`, { credentials: "include" })
      .then((response) => (response.ok ? response.json() : []))
      .then(setSubjects)
      .catch(() => setSubjects([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const filtered = subjects.filter((subject) => subject.name.toLowerCase().includes(search.toLowerCase()));

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
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus size={15} /> Add Subject
        </button>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search subjects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
        />
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-400">
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-400">
            {subjects.length === 0 ? 'No subjects yet. Click "Add Subject" to create one.' : "No subjects found."}
          </div>
        ) : (
          filtered.map((subject) => (
            <Link
              key={subject.id}
              href={`/admin/teachers/${slug}/subjects/${subject.id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:border-orange-200 transition-colors"
            >
              <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 text-orange-600">
                <BookOpen size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{subject.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {subject.teacherCount} teacher{subject.teacherCount !== 1 ? "s" : ""}
                </p>
              </div>
              <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
            </Link>
          ))
        )}
      </div>

      {showModal && (
        <AddSubjectModal
          departmentSlug={slug}
          onCreated={(subject) => setSubjects((prev) => [...prev, subject].sort((subA, subB) => subA.name.localeCompare(subB.name)))}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
