"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Breadcrumb from "@/components/shared/Breadcrumb";
import { ArrowRight, Users } from "lucide-react";
import { sectionSlug, yearFromSlug } from "@/lib/academics";

interface SectionCount {
  section: string;
  count: number;
}

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
  const yearNumber = yearFromSlug(year);

  const [sections, setSections] = useState<SectionCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (yearNumber === undefined) {
      setError(`"${year}" isn't a valid year.`);
      setLoading(false);
      return;
    }
    fetch(`/api/admin/sections?branch=${encodeURIComponent(branchLabel)}&year=${yearNumber}&withCounts=true`, { credentials: "include" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: SectionCount[]) => setSections(data))
      .catch(() => setError("Couldn't load sections. Please refresh."))
      .finally(() => setLoading(false));
  }, [branchLabel, year, yearNumber]);

  return (
    <div className="max-w-5xl mx-auto">
      <Breadcrumb
        homeHref="/teachers"
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

      {loading ? (
        <p className="text-sm text-gray-400">Loading sections…</p>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : sections.length === 0 ? (
        <p className="text-sm text-gray-400">No students in {branchLabel} · {yearLabel} yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3" data-tour="section-list">
          {sections.map(({ section, count }) => (
            <Link
              key={section}
              href={`/teachers/students/${branch}/${year}/${sectionSlug(section)}`}
              className="bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50/30 px-4 py-5 flex flex-col group transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-orange-700 font-bold text-xs">{section.replace(/^Section\s*/i, "")}</span>
                </div>
                <ArrowRight size={14} className="text-gray-300 group-hover:text-orange-400 transition-colors mt-0.5" />
              </div>
              <h3 className="font-semibold text-gray-800 text-sm mb-1">{section}</h3>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Users size={11} className="text-gray-400" />
                <span>{count} {count === 1 ? "student" : "students"}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
