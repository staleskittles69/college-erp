import Link from "next/link";
import Breadcrumb from "@/components/admin/Breadcrumb";
import { ArrowRight, Users } from "lucide-react";

const SECTIONS = [
  { label: "Section A", slug: "section-a", students: 60 },
  { label: "Section B", slug: "section-b", students: 58 },
  { label: "Section C", slug: "section-c", students: 62 },
];

function formatBranch(s: string) {
  return s.toUpperCase();
}

function formatYear(s: string) {
  return s
    .split("-")
    .map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

interface Props {
  params: { branch: string; year: string };
}

export default function SectionSelectionPage({ params }: Props) {
  const { branch, year } = params;
  const branchLabel = formatBranch(branch);
  const yearLabel = formatYear(year);

  return (
    <div className="max-w-3xl mx-auto">
      <Breadcrumb
        items={[
          { label: "Branches", href: "/admin/branches" },
          { label: branchLabel, href: `/admin/${branch}` },
          { label: yearLabel },
        ]}
      />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {branchLabel} · {yearLabel} — Select Section
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Choose a section to view the student list.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {SECTIONS.map((section) => (
          <Link
            key={section.slug}
            href={`/admin/${branch}/${year}/${section.slug}`}
            className="bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 px-6 py-6 flex flex-col group transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <span className="text-indigo-700 font-bold text-sm">
                  {section.label.split(" ")[1]}
                </span>
              </div>
              <ArrowRight
                size={15}
                className="text-gray-300 group-hover:text-indigo-400 transition-colors mt-0.5"
              />
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">{section.label}</h3>
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <Users size={13} className="text-gray-400" />
              <span>{section.students} students</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
