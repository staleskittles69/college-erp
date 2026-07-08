"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useTeachers } from "@/contexts/TeachersContext";
import { Department } from "@/contexts/TeachersContext";
import DepartmentCard from "@/components/admin/teachers/DepartmentCard";
import DepartmentFormModal from "@/components/admin/teachers/DepartmentFormModal";

export default function TeachersPage() {
  const { teachers, departments } = useTeachers();
  const [showAdd, setShowAdd] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teachers</h1>
          <p className="text-sm text-gray-500 mt-1">
            Select a department to manage its teachers.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={15} /> Add Department
        </button>
      </div>

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
              onEdit={() => setEditingDept(dept)}
            />
          );
        })}
      </div>

      {showAdd && (
        <DepartmentFormModal mode="add" onClose={() => setShowAdd(false)} />
      )}
      {editingDept && (
        <DepartmentFormModal
          mode="edit"
          existing={editingDept}
          onClose={() => setEditingDept(null)}
        />
      )}
    </div>
  );
}
