"use client";

import Breadcrumb from "@/components/shared/Breadcrumb";
import { useParams } from "next/navigation";
import { AlertTriangle, Phone, Mail } from "lucide-react";
import { useFetch } from "@/hooks/useFetch";
import { LOW_ATTENDANCE_THRESHOLD_PCT } from "@/lib/academics";

function titleCase(slug: string) {
  return slug.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

interface AttendanceRow { present: number; total: number; pct: number | null; }
interface ExamMark { examType: string; obtained: number; max: number; }
interface ContactPerson { name: string | null; mobile: string | null; email?: string | null; phone?: string | null; }

interface StudentProgress {
  profile: { name: string; rollNo: string; email: string | null; branch: string; year: number | null; section: string };
  atRisk: { lowAttendance: boolean; backlogCount: number };
  attendance: { overall: AttendanceRow; subjects: (AttendanceRow & { subject: string })[]; lowAttendance: boolean };
  marks: { subjects: { subject: string; exams: ExamMark[]; obtained: number; max: number; pct: number | null; backlog: boolean }[]; backlogCount: number };
  contact: {
    student: { mobile: string | null; phone: string | null };
    father: ContactPerson;
    mother: ContactPerson;
    parentPhone: string | null;
    guardian: ContactPerson;
  };
}

function formatPct(pct: number | null) {
  return pct === null ? "—" : `${pct}%`;
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function PhoneLink({ number }: { number: string }) {
  return (
    <a href={`tel:${number}`} className="inline-flex items-center gap-1.5 text-orange-600 hover:underline">
      <Phone size={13} /> {number}
    </a>
  );
}

function ContactRow({ label, person }: { label: string; person: ContactPerson }) {
  const phones = [person.mobile, person.phone].filter((number): number is string => !!number);
  if (!person.name && phones.length === 0 && !person.email) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 px-6 py-3.5">
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-800">{person.name ?? "—"}</p>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        {phones.map((number) => <PhoneLink key={number} number={number} />)}
        {person.email && (
          <a href={`mailto:${person.email}`} className="inline-flex items-center gap-1.5 text-orange-600 hover:underline">
            <Mail size={13} /> {person.email}
          </a>
        )}
      </div>
    </div>
  );
}

export default function TeacherStudentProfilePage() {
  const params = useParams<{ branch: string; year: string; section: string; studentId: string }>();
  const { branch, year, section, studentId } = params;

  const { data, loading, error } = useFetch<StudentProgress | null>(`/api/teachers/students/${studentId}`, null);

  const listHref = `/teachers/students/${branch}/${year}/${section}`;
  const crumbs = [
    { label: "Students", href: "/teachers/students" },
    { label: branch.toUpperCase(), href: `/teachers/students/${branch}` },
    { label: titleCase(year), href: `/teachers/students/${branch}/${year}` },
    { label: titleCase(section), href: listHref },
    { label: data?.profile.name ?? "Student" },
  ];

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <Breadcrumb homeHref="/teachers" items={crumbs} />
        <div className="space-y-4 animate-pulse">
          <div className="h-20 bg-gray-100 rounded-xl" />
          <div className="h-48 bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-5xl mx-auto">
        <Breadcrumb homeHref="/teachers" items={crumbs} />
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          This student could not be loaded. You can only view students in classes you teach.
        </div>
      </div>
    );
  }

  const { profile, atRisk, attendance, marks, contact } = data;
  const hasAnyContact =
    [contact.student, contact.father, contact.mother, contact.guardian].some((person) =>
      Object.values(person).some(Boolean)
    ) || !!contact.parentPhone || !!profile.email;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Breadcrumb homeHref="/teachers" items={crumbs} />

      <div className="rounded-xl border border-gray-200 bg-white p-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            <span className="font-mono">{profile.rollNo}</span> · {profile.branch} · {profile.section}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {atRisk.lowAttendance && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 text-red-700 text-xs font-semibold px-3 py-1">
              <AlertTriangle size={13} /> Low attendance
            </span>
          )}
          {atRisk.backlogCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1">
              <AlertTriangle size={13} /> {atRisk.backlogCount} {atRisk.backlogCount === 1 ? "backlog" : "backlogs"}
            </span>
          )}
          {!atRisk.lowAttendance && atRisk.backlogCount === 0 && (
            <span className="rounded-full bg-green-50 text-green-700 text-xs font-semibold px-3 py-1">Not at risk</span>
          )}
        </div>
      </div>

      <SectionCard title="Attendance">
        {attendance.overall.total === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-gray-400">No attendance has been recorded yet.</p>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-4">
              <p className={`text-3xl font-bold ${attendance.lowAttendance ? "text-red-600" : "text-gray-900"}`}>
                {formatPct(attendance.overall.pct)}
              </p>
              <div className="flex-1">
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full ${attendance.lowAttendance ? "bg-red-500" : "bg-green-500"}`}
                    style={{ width: `${attendance.overall.pct ?? 0}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  {attendance.overall.present} of {attendance.overall.total} classes attended · minimum {LOW_ATTENDANCE_THRESHOLD_PCT}%
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Attended</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attendance.subjects.map((row) => (
                    <tr key={row.subject}>
                      <td className="px-6 py-3 font-medium text-gray-800">{row.subject}</td>
                      <td className="px-6 py-3 text-right text-gray-500">{row.present}/{row.total}</td>
                      <td className={`px-6 py-3 text-right font-semibold ${row.pct !== null && row.pct < LOW_ATTENDANCE_THRESHOLD_PCT ? "text-red-600" : "text-gray-800"}`}>
                        {formatPct(row.pct)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </SectionCard>

      <SectionCard title="Marks">
        {marks.subjects.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-gray-400">No marks have been recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Exams</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {marks.subjects.map((row) => (
                  <tr key={row.subject}>
                    <td className="px-6 py-3 font-medium text-gray-800">{row.subject}</td>
                    <td className="px-6 py-3 text-gray-500 text-xs">
                      {row.exams.map((exam) => `${exam.examType}: ${exam.obtained}/${exam.max}`).join(" · ")}
                    </td>
                    <td className="px-6 py-3 text-right text-gray-500">{row.obtained}/{row.max}</td>
                    <td className={`px-6 py-3 text-right font-semibold ${row.backlog ? "text-red-600" : "text-gray-800"}`}>
                      {formatPct(row.pct)}
                      {row.backlog && <span className="ml-2 text-[10px] font-semibold uppercase text-red-600">Backlog</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Contact">
        {!hasAnyContact ? (
          <p className="px-6 py-10 text-center text-sm text-gray-400">No contact details are on file for this student.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            <ContactRow
              label="Student"
              person={{ name: profile.name, mobile: contact.student.mobile, phone: contact.student.phone, email: profile.email }}
            />
            <ContactRow label="Father" person={contact.father} />
            <ContactRow label="Mother" person={contact.mother} />
            {contact.parentPhone && (
              <ContactRow label="Parent phone" person={{ name: null, mobile: contact.parentPhone }} />
            )}
            <ContactRow label="Guardian" person={contact.guardian} />
          </div>
        )}
      </SectionCard>
    </div>
  );
}
