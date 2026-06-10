"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Teacher, Department, Assignment } from "@/lib/teachersData";

interface TeachersContextType {
  teachers: Teacher[];
  departments: Department[];
  loading: boolean;
  addTeacher: (data: Omit<Teacher, "id" | "teaching"> & { password?: string }) => Promise<void>;
  addDepartment: (dept: Department) => Promise<void>;
  updateDepartment: (slug: string, updates: Omit<Department, "slug">) => Promise<void>;
  addAssignment: (teacherId: string, assignment: Assignment) => Promise<void>;
  removeAssignment: (teacherId: string, index: number) => Promise<void>;
  removeSection: (teacherId: string, assignmentIndex: number, section: string) => Promise<void>;
}

const TeachersContext = createContext<TeachersContextType | null>(null);

export function TeachersProvider({ children }: { children: ReactNode }) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/teachers", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/departments", { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([teachersData, deptsData]) => {
        if (Array.isArray(teachersData)) setTeachers(teachersData);
        if (Array.isArray(deptsData)) setDepartments(deptsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function addTeacher(data: Omit<Teacher, "id" | "teaching"> & { password?: string }) {
    const res = await fetch("/api/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? "Failed to add teacher");
    setTeachers((prev) => [...prev, body]);
  }

  async function addDepartment(dept: Department) {
    const res = await fetch("/api/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dept),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? "Failed to add department");
    setDepartments((prev) => [...prev, body]);
  }

  async function updateDepartment(slug: string, updates: Omit<Department, "slug">) {
    const res = await fetch(`/api/departments/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? "Failed to update department");
    setDepartments((prev) => prev.map((d) => (d.slug === slug ? body : d)));
  }

  async function addAssignment(teacherId: string, assignment: Assignment) {
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) return;

    const existingIdx = teacher.teaching.findIndex(
      (a) => a.branch === assignment.branch && a.year === assignment.year
    );

    let newTeaching: Assignment[];
    if (existingIdx === -1) {
      newTeaching = [...teacher.teaching, assignment];
    } else {
      const existing = teacher.teaching[existingIdx];
      const newSections = assignment.sections.filter((s) => !existing.sections.includes(s));
      if (newSections.length === 0) return;
      newTeaching = teacher.teaching.map((a, i) =>
        i === existingIdx
          ? { ...a, sections: [...a.sections, ...newSections].sort() as Assignment["sections"] }
          : a
      );
    }

    const res = await fetch(`/api/teachers/${teacherId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teaching: newTeaching }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? "Failed to update assignments");
    setTeachers((prev) => prev.map((t) => (t.id === teacherId ? body : t)));
  }

  async function removeAssignment(teacherId: string, index: number) {
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) return;

    const newTeaching = teacher.teaching.filter((_, i) => i !== index);

    const res = await fetch(`/api/teachers/${teacherId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teaching: newTeaching }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? "Failed to remove assignment");
    setTeachers((prev) => prev.map((t) => (t.id === teacherId ? body : t)));
  }

  async function removeSection(teacherId: string, assignmentIndex: number, section: string) {
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) return;

    const newTeaching = teacher.teaching
      .map((a, i) =>
        i === assignmentIndex ? { ...a, sections: a.sections.filter((s) => s !== section) } : a
      )
      .filter((a) => a.sections.length > 0) as Assignment[];

    const res = await fetch(`/api/teachers/${teacherId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teaching: newTeaching }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? "Failed to remove section");
    setTeachers((prev) => prev.map((t) => (t.id === teacherId ? body : t)));
  }

  return (
    <TeachersContext.Provider
      value={{ teachers, departments, loading, addTeacher, addDepartment, updateDepartment, addAssignment, removeAssignment, removeSection }}
    >
      {children}
    </TeachersContext.Provider>
  );
}

export function useTeachers() {
  const ctx = useContext(TeachersContext);
  if (!ctx) throw new Error("useTeachers must be used inside TeachersProvider");
  return ctx;
}
