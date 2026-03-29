import Link from "next/link";
import Breadcrumb from "@/components/admin/Breadcrumb";
import { ArrowRight, Users } from "lucide-react";

const BRANCHES = [
  {
    name: "CSE",
    slug: "cse",
    label: "Computer Science & Engineering",
    students: 320,
    sections: 3,
    description: "Covers algorithms, software engineering, data structures, and systems.",
    color: "border-indigo-200 hover:border-indigo-400",
    badge: "bg-indigo-100 text-indigo-700",
  },
  {
    name: "ECE",
    slug: "ece",
    label: "Electronics & Communication",
    students: 280,
    sections: 3,
    description: "Focuses on circuits, signals, communication systems, and embedded systems.",
    color: "border-blue-200 hover:border-blue-400",
    badge: "bg-blue-100 text-blue-700",
  },
  {
    name: "MECH",
    slug: "mech",
    label: "Mechanical Engineering",
    students: 340,
    sections: 3,
    description: "Covers thermodynamics, fluid mechanics, manufacturing, and design.",
    color: "border-orange-200 hover:border-orange-400",
    badge: "bg-orange-100 text-orange-700",
  },
  {
    name: "CIVIL",
    slug: "civil",
    label: "Civil Engineering",
    students: 300,
    sections: 3,
    description: "Covers structures, surveying, geotechnics, and construction management.",
    color: "border-green-200 hover:border-green-400",
    badge: "bg-green-100 text-green-700",
  },
];

export default function BranchesPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <Breadcrumb items={[{ label: "Branches" }]} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Branches</h1>
        <p className="text-sm text-gray-500 mt-1">
          Select a branch to view years, sections, and students.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {BRANCHES.map((branch) => (
          <Link
            key={branch.slug}
            href={`/admin/${branch.slug}`}
            className={`bg-white rounded-xl border-2 p-6 block group transition-all duration-150 ${branch.color}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold mb-2 ${branch.badge}`}>
                  {branch.name}
                </span>
                <h2 className="text-base font-semibold text-gray-800">{branch.label}</h2>
              </div>
              <ArrowRight
                size={18}
                className="text-gray-300 group-hover:text-gray-500 transition-colors mt-0.5"
              />
            </div>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">{branch.description}</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <Users size={14} className="text-gray-400" />
                <span>{branch.students} students</span>
              </div>
              <div className="text-sm text-gray-400">
                {branch.sections} sections · 4 years
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
