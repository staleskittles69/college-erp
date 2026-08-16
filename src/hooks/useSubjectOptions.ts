import { useEffect, useState } from "react";

interface Dept { slug: string; name: string; }

// Subjects come from the real Subject collection for this branch's department.
export function useSubjectOptions(branch?: string): string[] {
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);

  useEffect(() => {
    if (!branch) { setSubjectOptions([]); return; }
    fetch("/api/departments", { credentials: "include" })
      .then((response) => (response.ok ? response.json() : []))
      .then((depts: Dept[]) => depts.find((dept) => dept.name === branch)?.slug)
      .then((slug) => {
        if (!slug) { setSubjectOptions([]); return; }
        return fetch(`/api/admin/subjects?department=${encodeURIComponent(slug)}`, { credentials: "include" })
          .then((response) => (response.ok ? response.json() : []))
          .then((data: { name: string }[]) => setSubjectOptions(data.map((subjectItem) => subjectItem.name)));
      })
      .catch(() => setSubjectOptions([]));
  }, [branch]);

  return subjectOptions;
}
