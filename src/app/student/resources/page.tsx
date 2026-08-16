"use client";

import { Library, FileText } from "lucide-react";
import { useFetch } from "@/hooks/useFetch";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

interface Resource {
  _id: string;
  title: string;
  subject: string;
  fileUrl: string;
  fileName: string;
  createdAt: string;
}

function formatDate(dateString: string) {
  try { return new Date(dateString).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return dateString; }
}

export default function ResourcesPage() {
  const { data: resources, loading } = useFetch<Resource[]>("/api/resources", []);

  const bySubject = resources.reduce<Record<string, Resource[]>>((acc, resource) => {
    (acc[resource.subject] ??= []).push(resource);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Resources" subtitle="Study materials and notes shared by teachers." />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((skeletonIdx) => (
            <div key={skeletonIdx} className="rounded-xl border border-gray-100 bg-white p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : resources.length === 0 ? (
        <EmptyState
          icon={<Library size={30} />}
          iconClassName="bg-emerald-50 text-emerald-500"
          title="No resources yet"
          subtitle="Notes, PDFs, and study materials shared by your teachers will appear here."
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(bySubject).map(([subject, items]) => (
            <div key={subject}>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">{subject}</h2>
              <ul className="space-y-2">
                {items.map((resource) => (
                  <li key={resource._id}>
                    <a
                      href={resource.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-orange-200 transition-all"
                    >
                      <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                        <FileText size={18} className="text-orange-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-gray-800 truncate">{resource.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(resource.createdAt)}</p>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
