"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
export interface Department {
  slug: string;
  name: string;
  label: string;
  color: string;
}

export interface Assignment {
  branch: "CSE" | "ECE" | "ME" | "CE" | "EEE";
  year: 1 | 2 | 3 | 4;
  sections: string[];
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  department: string;
  teaching: Assignment[];
}

interface TeachersContextType {
  teachers: Teacher[];
  departments: Department[];
  loading: boolean;
  addTeacher: (data: Omit<Teacher, "id" | "teaching"> & { password?: string }) => Promise<{ id: string; plainPassword: string }>;
  addAssignment: (teacherId: string, assignment: Assignment) => Promise<void>;
  removeAssignment: (teacherId: string, index: number) => Promise<void>;
  removeSection: (teacherId: string, assignmentIndex: number, section: string) => Promise<void>;
  setTeacherPassword: (teacherId: string, newPassword: string) => Promise<void>;
}

const TeachersContext = createContext<TeachersContextType | null>(null);

export function TeachersProvider({ children }: { children: ReactNode }) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/teachers", { credentials: "include" }).then((response) => response.json()),
      fetch("/api/departments", { credentials: "include" }).then((response) => response.json()),
    ])
      .then(([teachersData, deptsData]) => {
        if (Array.isArray(teachersData)) setTeachers(teachersData);
        if (Array.isArray(deptsData)) setDepartments(deptsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function addTeacher(data: Omit<Teacher, "id" | "teaching"> & { password?: string }) {
    const response = await fetch("/api/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "Failed to add teacher");
    const { plainPassword, ...teacher } = body;
    setTeachers((prev) => [...prev, teacher]);
    return { id: teacher.id as string, plainPassword: plainPassword as string };
  }

  async function addAssignment(teacherId: string, assignment: Assignment) {
    const teacher = teachers.find((teacherItem) => teacherItem.id === teacherId);
    if (!teacher) return;

    const existingIdx = teacher.teaching.findIndex(
      (existingAssignment) => existingAssignment.branch === assignment.branch && existingAssignment.year === assignment.year
    );

    let newTeaching: Assignment[];
    if (existingIdx === -1) {
      newTeaching = [...teacher.teaching, assignment];
    } else {
      const existing = teacher.teaching[existingIdx];
      const newSections = assignment.sections.filter((section) => !existing.sections.includes(section));
      if (newSections.length === 0) return;
      newTeaching = teacher.teaching.map((existingAssignment, assignmentIdx) =>
        assignmentIdx === existingIdx
          ? { ...existingAssignment, sections: [...existingAssignment.sections, ...newSections].sort() as Assignment["sections"] }
          : existingAssignment
      );
    }

    const response = await fetch(`/api/teachers/${teacherId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teaching: newTeaching }),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "Failed to update assignments");
    setTeachers((prev) => prev.map((teacherItem) => (teacherItem.id === teacherId ? body : teacherItem)));
  }

  async function removeAssignment(teacherId: string, index: number) {
    const teacher = teachers.find((teacherItem) => teacherItem.id === teacherId);
    if (!teacher) return;

    const newTeaching = teacher.teaching.filter((_, assignmentIdx) => assignmentIdx !== index);

    const response = await fetch(`/api/teachers/${teacherId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teaching: newTeaching }),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "Failed to remove assignment");
    setTeachers((prev) => prev.map((teacherItem) => (teacherItem.id === teacherId ? body : teacherItem)));
  }

  async function removeSection(teacherId: string, assignmentIndex: number, section: string) {
    const teacher = teachers.find((teacherItem) => teacherItem.id === teacherId);
    if (!teacher) return;

    const newTeaching = teacher.teaching
      .map((existingAssignment, assignmentIdx) =>
        assignmentIdx === assignmentIndex
          ? { ...existingAssignment, sections: existingAssignment.sections.filter((existingSection) => existingSection !== section) }
          : existingAssignment
      )
      .filter((existingAssignment) => existingAssignment.sections.length > 0) as Assignment[];

    const response = await fetch(`/api/teachers/${teacherId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teaching: newTeaching }),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "Failed to remove section");
    setTeachers((prev) => prev.map((teacherItem) => (teacherItem.id === teacherId ? body : teacherItem)));
  }

  async function setTeacherPassword(teacherId: string, newPassword: string) {
    const response = await fetch(`/api/teachers/${teacherId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword }),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "Failed to set password");
    setTeachers((prev) => prev.map((teacherItem) => (teacherItem.id === teacherId ? body : teacherItem)));
  }

  return (
    <TeachersContext.Provider
      value={{ teachers, departments, loading, addTeacher, addAssignment, removeAssignment, removeSection, setTeacherPassword }}
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
