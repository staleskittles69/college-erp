"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTeachers } from "@/contexts/TeachersContext";
import DepartmentCard from "@/components/admin/teachers/DepartmentCard";

export default function TeachersPage() {
  const { teachers, departments } = useTeachers();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teachers</h1>
          <p className="text-sm text-gray-500 mt-1">
            Select a department to manage its teachers.
          </p>
        </div>
        <Link
          href="/admin/branches"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-600 transition-colors"
        >
          Manage branches <ArrowRight size={14} />
        </Link>
      </div>

      {departments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-16 flex flex-col items-center justify-center text-center">
          <p className="font-semibold text-gray-600">No departments yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Departments follow your branches —{" "}
            <Link href="/admin/branches" className="text-orange-600 hover:underline">
              add a branch
            </Link>{" "}
            to see it here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {departments.map((dept) => {
            const count = teachers.filter((teacher) => teacher.department === dept.slug).length;
            return (
              <DepartmentCard
                key={dept.slug}
                slug={dept.slug}
                name={dept.name}
                label={dept.label}
                teacherCount={count}
                color={dept.color}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
