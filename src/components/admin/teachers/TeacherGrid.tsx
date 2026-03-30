"use client";

import { useState } from "react";
import BranchSelector from "./BranchSelector";
import TeacherCard, { Teacher } from "./TeacherCard";

const TEACHERS: Teacher[] = [
  { id: "1", name: "Dr. Priya Sharma",   subject: "Data Structures",    branch: "CSE",   classes: 24 },
  { id: "2", name: "Prof. Rahul Verma",  subject: "Algorithms",          branch: "CSE",   classes: 18 },
  { id: "3", name: "Dr. Anita Patel",    subject: "DBMS",               branch: "CSE",   classes: 20 },
  { id: "4", name: "Prof. Suresh Kumar", subject: "Digital Electronics", branch: "ECE",   classes: 22 },
  { id: "5", name: "Dr. Meena Iyer",     subject: "Signals & Systems",  branch: "ECE",   classes: 16 },
  { id: "6", name: "Prof. Arun Nair",    subject: "Thermodynamics",     branch: "MECH",  classes: 20 },
  { id: "7", name: "Dr. Kavitha Reddy",  subject: "Fluid Mechanics",    branch: "MECH",  classes: 18 },
  { id: "8", name: "Prof. Vikram Singh", subject: "Structural Analysis", branch: "CIVIL", classes: 22 },
];

export default function TeacherGrid() {
  const [branch, setBranch] = useState("CSE");
  const filtered = TEACHERS.filter((t) => t.branch === branch);

  return (
    <div>
      <BranchSelector selected={branch} onSelect={setBranch} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {filtered.map((teacher) => (
          <TeacherCard key={teacher.id} teacher={teacher} />
        ))}
      </div>
    </div>
  );
}
