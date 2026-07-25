import Link from "next/link";
import Breadcrumb from "@/components/admin/Breadcrumb";
import { ArrowRight, Users } from "lucide-react";

const SECTIONS = Array.from({ length: 30 }, (_, sectionIdx) => ({
  label: `Section ${sectionIdx + 1}`,
  slug: `section-${sectionIdx + 1}`,
}));

function formatYear(yearSlug: string) {
  return yearSlug.split("-").map((word, wordIdx) => (wordIdx === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))).join(" ");
}

interface Props {
  params: { branch: string; year: string };
}

export default function SectionSelectionPage({ params }: Props) {
  const { branch, year } = params;
  const branchLabel = branch.toUpperCase();
  const yearLabel = formatYear(year);

  return (
    <div className="max-w-5xl mx-auto">
      <Breadcrumb
        items={[
          { label: "Students", href: "/teachers/students" },
          { label: branchLabel, href: `/teachers/students/${branch}` },
          { label: yearLabel },
        ]}
      />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{branchLabel} · {yearLabel} — Select Section</h1>
        <p className="text-sm text-gray-500 mt-1">Choose a section to view the student list.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {SECTIONS.map((section) => (
          <Link
            key={section.slug}
            href={`/teachers/students/${branch}/${year}/${section.slug}`}
            className="bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50/30 px-4 py-5 flex flex-col group transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-orange-700 font-bold text-xs">{section.label.split(" ")[1]}</span>
              </div>
              <ArrowRight size={14} className="text-gray-300 group-hover:text-orange-400 transition-colors mt-0.5" />
            </div>
            <h3 className="font-semibold text-gray-800 text-sm mb-1">{section.label}</h3>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Users size={11} className="text-gray-400" />
              <span>60 students</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
