import Link from "next/link";
import Breadcrumb from "@/components/shared/Breadcrumb";
import { ArrowRight } from "lucide-react";

const YEARS = [
  { label: "1st Year", slug: "1st-year", subtitle: "Foundation courses — Semester 1 & 2" },
  { label: "2nd Year", slug: "2nd-year", subtitle: "Core subjects — Semester 3 & 4" },
  { label: "3rd Year", slug: "3rd-year", subtitle: "Specialisation begins — Semester 5 & 6" },
  { label: "4th Year", slug: "4th-year", subtitle: "Final year & project — Semester 7 & 8" },
];

interface Props {
  params: { branch: string };
}

export default function YearSelectionPage({ params }: Props) {
  const { branch } = params;
  const branchLabel = branch.toUpperCase();

  return (
    <div className="max-w-3xl mx-auto">
      <Breadcrumb
        homeHref="/teachers"
        items={[
          { label: "Students", href: "/teachers/students" },
          { label: branchLabel },
        ]}
      />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{branchLabel} — Select Year</h1>
        <p className="text-sm text-gray-500 mt-1">Choose a year to view sections and students.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {YEARS.map((year, yearIdx) => (
          <Link
            key={year.slug}
            href={`/teachers/students/${branch}/${year.slug}`}
            className="bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50/30 px-6 py-5 flex items-center justify-between group transition-all"
          >
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="w-7 h-7 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {yearIdx + 1}
                </span>
                <span className="font-semibold text-gray-800">{year.label}</span>
              </div>
              <p className="text-xs text-gray-500 ml-10">{year.subtitle}</p>
            </div>
            <ArrowRight size={16} className="text-gray-300 group-hover:text-orange-400 transition-colors flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
