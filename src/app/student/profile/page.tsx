"use client";

import { useEffect, useState } from "react";
import { User, Mail, BookOpen, Hash } from "lucide-react";

interface PersonalDetails {
  admissionNo?: string;
  course?: string;
  gender?: string;
  dob?: string;
  nationality?: string;
  religion?: string;
  entranceType?: string;
  eamcetRank?: string;
  seatType?: string;
  categoryAndCaste?: string;
  lastStudied?: string;
  joiningDate?: string;
  phoneNo?: string;
  mobileNo?: string;
  bankAccountNo?: string;
  aadharNo?: string;
  rationCardNo?: string;
  scholarship?: string;
}

interface EducationDetail {
  qualification: string;
  board?: string;
  htNo?: string;
  yearOfPass?: string;
  institute?: string;
  maxMarks?: string;
  obtainedMarks?: string;
  gradeLetter?: string;
  gradePoints?: string;
}

interface ParentDetails {
  fatherName?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherOccupation?: string;
  phoneNo?: string;
  fatherMobileNo?: string;
  motherMobileNo?: string;
  annualIncome?: string;
  fatherEmail?: string;
  motherEmail?: string;
  correspondenceAddress?: string;
  permanentAddress?: string;
}

interface GuardianDetails {
  name?: string;
  address?: string;
  phone?: string;
  mobile?: string;
}

interface StudentProfile {
  name: string;
  rollNo: string;
  email?: string;
  branch: string;
  semester: number;
  section: string;
  personalDetails: PersonalDetails;
  educationDetails: EducationDetail[];
  parentDetails: ParentDetails;
  guardianDetails: GuardianDetails;
}

const PERSONAL_FIELDS: { key: keyof PersonalDetails; label: string }[] = [
  { key: "admissionNo", label: "Admission No" },
  { key: "course", label: "Course" },
  { key: "gender", label: "Gender" },
  { key: "dob", label: "Date of Birth" },
  { key: "nationality", label: "Nationality" },
  { key: "religion", label: "Religion" },
  { key: "entranceType", label: "Entrance Type" },
  { key: "eamcetRank", label: "EAMCET/ECET Rank" },
  { key: "seatType", label: "Seat Type" },
  { key: "categoryAndCaste", label: "Category & Caste" },
  { key: "lastStudied", label: "Last Studied" },
  { key: "joiningDate", label: "Joining Date" },
  { key: "phoneNo", label: "Phone No" },
  { key: "mobileNo", label: "Mobile No" },
  { key: "bankAccountNo", label: "Bank A/C No" },
  { key: "aadharNo", label: "Aadhar No" },
  { key: "rationCardNo", label: "Ration Card No" },
  { key: "scholarship", label: "Scholarship" },
];

const EDUCATION_COLUMNS: { key: keyof EducationDetail; label: string }[] = [
  { key: "board", label: "Board" },
  { key: "htNo", label: "H.T. No" },
  { key: "yearOfPass", label: "Year of Pass" },
  { key: "institute", label: "Institute" },
  { key: "maxMarks", label: "Max Marks" },
  { key: "obtainedMarks", label: "Obtained Marks" },
  { key: "gradeLetter", label: "Grade Letter" },
  { key: "gradePoints", label: "Grade Points" },
];

const PARENT_FIELDS: { key: keyof ParentDetails; label: string; wide?: boolean }[] = [
  { key: "fatherName", label: "Father Name" },
  { key: "fatherOccupation", label: "Father Occupation" },
  { key: "motherName", label: "Mother Name" },
  { key: "motherOccupation", label: "Mother Occupation" },
  { key: "phoneNo", label: "Phone No" },
  { key: "fatherMobileNo", label: "Father Mobile No" },
  { key: "motherMobileNo", label: "Mother Mobile No" },
  { key: "annualIncome", label: "Annual Income" },
  { key: "fatherEmail", label: "Father Email" },
  { key: "motherEmail", label: "Mother Email" },
  { key: "correspondenceAddress", label: "Correspondence Address", wide: true },
  { key: "permanentAddress", label: "Permanent Address", wide: true },
];

const GUARDIAN_FIELDS: { key: keyof GuardianDetails; label: string; wide?: boolean }[] = [
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "mobile", label: "Mobile" },
  { key: "address", label: "Address", wide: true },
];

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className="text-sm text-gray-800 mt-0.5">{value?.trim() ? value : "—"}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((response) => (response.ok ? response.json() : null))
      .then((me) => {
        if (!me?.id) return null;
        return fetch(`/api/students/${me.id}`, { credentials: "include" })
          .then((response) => (response.ok ? response.json() : null));
      })
      .then((student) => {
        if (!student) return;
        setProfile({
          name: student.name,
          rollNo: student.rollNo,
          email: student.email,
          branch: student.branch,
          semester: student.semester,
          section: student.section,
          personalDetails: student.personalDetails ?? {},
          educationDetails: student.educationDetails?.length ? student.educationDetails : [],
          parentDetails: student.parentDetails ?? {},
          guardianDetails: student.guardianDetails ?? {},
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Profile hero */}
      <div className="rounded-2xl bg-orange-600 shadow-lg overflow-hidden">
        <div className="px-8 pt-8 pb-6 flex items-end gap-6">
          <div className="w-20 h-20 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center shrink-0">
            <User size={36} className="text-white" />
          </div>
          <div className="pb-1">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {loading ? "Loading..." : profile?.name ?? "Student"}
            </h1>
            <p className="text-white/80 text-sm mt-0.5">
              {profile ? `${profile.branch} · Semester ${profile.semester} · Section ${profile.section}` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { icon: <Hash size={18} className="text-orange-500" />, label: "Roll No", value: profile?.rollNo ?? "—", bg: "bg-orange-50" },
          { icon: <Mail size={18} className="text-orange-500" />, label: "Email", value: profile?.email ?? "—", bg: "bg-orange-50" },
          { icon: <BookOpen size={18} className="text-green-500" />, label: "Branch", value: profile?.branch ?? "—", bg: "bg-green-50" },
          { icon: <User size={18} className="text-amber-500" />, label: "Section", value: profile?.section ?? "—", bg: "bg-amber-50" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.bg}`}>
              {item.icon}
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">{item.label}</p>
              <p className="text-sm font-semibold text-gray-700 mt-0.5">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {!loading && profile && (
        <>
          <Section title="Personal Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PERSONAL_FIELDS.map((field) => (
                <Field key={field.key} label={field.label} value={profile.personalDetails[field.key]} />
              ))}
            </div>
          </Section>

          {profile.educationDetails.length > 0 && (
            <Section title="Education Details">
              <div className="overflow-x-auto -m-6 p-6 pt-0 -mt-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="py-2 pr-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Qualification</th>
                      {EDUCATION_COLUMNS.map((col) => (
                        <th key={col.key} className="py-2 pr-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {profile.educationDetails.map((row) => (
                      <tr key={row.qualification}>
                        <td className="py-3 pr-4 font-medium text-gray-800 whitespace-nowrap">{row.qualification}</td>
                        {EDUCATION_COLUMNS.map((col) => (
                          <td key={col.key} className="py-3 pr-4 text-gray-700">
                            {row[col.key]?.trim() ? row[col.key] : "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          <Section title="Parent's Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PARENT_FIELDS.map((field) => (
                <Field key={field.key} label={field.label} value={profile.parentDetails[field.key]} />
              ))}
            </div>
          </Section>

          <Section title="Guardian Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {GUARDIAN_FIELDS.map((field) => (
                <Field key={field.key} label={field.label} value={profile.guardianDetails[field.key]} />
              ))}
            </div>
          </Section>

          <p className="text-xs text-gray-400 text-center">
            Need something updated here? Contact your admin office.
          </p>
        </>
      )}
    </div>
  );
}
