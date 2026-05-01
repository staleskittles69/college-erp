export interface Department {
  slug: string;
  name: string;
  label: string;
  color: string;
}

export interface Assignment {
  branch: "CSE" | "ECE" | "MECH" | "CIVIL";
  year: 1 | 2 | 3 | 4;
  sections: ("A" | "B" | "C")[];
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  department: string;
  teaching: Assignment[];
  plainPassword?: string;
}

export const DEPARTMENTS = [
  { slug: "web-dev",  name: "Web Dev",  label: "Web Development",          color: "border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50" },
  { slug: "backend",  name: "Backend",  label: "Backend Engineering",       color: "border-blue-200 hover:border-blue-400 hover:bg-blue-50" },
  { slug: "pharma",   name: "Pharma",   label: "Pharmaceutical Sciences",   color: "border-orange-200 hover:border-orange-400 hover:bg-orange-50" },
  { slug: "civil",    name: "Civil",    label: "Civil Engineering",         color: "border-green-200 hover:border-green-400 hover:bg-green-50" },
];

export const DUMMY_TEACHERS: Teacher[] = [
  { id: "t1", name: "Dr. Priya Sharma",   email: "priya.sharma@college.edu",  department: "web-dev", teaching: [{ branch: "CSE", year: 1, sections: ["A", "B"] }, { branch: "ECE", year: 2, sections: ["A"] }] },
  { id: "t2", name: "Prof. Rahul Verma",  email: "rahul.verma@college.edu",   department: "web-dev", teaching: [{ branch: "CSE", year: 2, sections: ["C"] }] },
  { id: "t3", name: "Dr. Anita Patel",    email: "anita.patel@college.edu",   department: "backend", teaching: [{ branch: "MECH", year: 1, sections: ["A", "B", "C"] }] },
  { id: "t4", name: "Prof. Arjun Rao",    email: "arjun.rao@college.edu",     department: "backend", teaching: [] },
  { id: "t5", name: "Dr. Neha Singh",     email: "neha.singh@college.edu",    department: "pharma",  teaching: [{ branch: "CIVIL", year: 3, sections: ["B"] }] },
  { id: "t6", name: "Prof. Kiran Das",    email: "kiran.das@college.edu",     department: "pharma",  teaching: [{ branch: "ECE", year: 1, sections: ["A"] }] },
  { id: "t7", name: "Dr. Rajesh Kumar",   email: "rajesh.kumar@college.edu",  department: "civil",   teaching: [{ branch: "CIVIL", year: 2, sections: ["A", "B"] }] },
  { id: "t8", name: "Prof. Meera Iyer",   email: "meera.iyer@college.edu",    department: "civil",   teaching: [] },
];
