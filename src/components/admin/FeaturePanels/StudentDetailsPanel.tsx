"use client";

import { useEffect, useState } from "react";
import { Pencil, Eye, EyeOff, Copy, Check } from "lucide-react";
import { validatePasswordStrength } from "@/lib/passwordRules";

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

interface DetailsState {
  personalDetails: PersonalDetails;
  educationDetails: EducationDetail[];
  parentDetails: ParentDetails;
  guardianDetails: GuardianDetails;
}

const EMPTY: DetailsState = {
  personalDetails: {},
  educationDetails: [
    { qualification: "SSC" },
    { qualification: "Inter" },
  ],
  parentDetails: {},
  guardianDetails: {},
};

const PERSONAL_FIELDS: { key: keyof PersonalDetails; label: string; type?: string }[] = [
  { key: "admissionNo", label: "Admission No" },
  { key: "course", label: "Course" },
  { key: "gender", label: "Gender" },
  { key: "dob", label: "Date of Birth", type: "date" },
  { key: "nationality", label: "Nationality" },
  { key: "religion", label: "Religion" },
  { key: "entranceType", label: "Entrance Type" },
  { key: "eamcetRank", label: "EAMCET/ECET Rank" },
  { key: "seatType", label: "Seat Type" },
  { key: "categoryAndCaste", label: "Category & Caste" },
  { key: "lastStudied", label: "Last Studied" },
  { key: "joiningDate", label: "Joining Date", type: "date" },
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

function EditField({
  label,
  value,
  onChange,
  type = "text",
  wide = false,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  type?: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2 lg:col-span-3" : ""}>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20"
      />
    </div>
  );
}

function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export default function StudentDetailsPanel({ studentId, context }: { studentId?: string; context?: string }) {
  const [data, setData] = useState<DetailsState>(EMPTY);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<DetailsState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [copiedEmail, setCopiedEmail] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  function load() {
    if (!studentId) { setLoading(false); return; }
    setLoading(true);
    fetch(`/api/students/${studentId}`, { credentials: "include" })
      .then((response) => (response.ok ? response.json() : null))
      .then((student) => {
        if (!student) return;
        const educationDetails = student.educationDetails?.length ? student.educationDetails : EMPTY.educationDetails;
        setEmail(student.email ?? "");
        setData({
          personalDetails: student.personalDetails ?? {},
          educationDetails,
          parentDetails: student.parentDetails ?? {},
          guardianDetails: student.guardianDetails ?? {},
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(load, [studentId]); // eslint-disable-line react-hooks/exhaustive-deps

  function copyEmail() {
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 1500);
  }

  function openPasswordForm() {
    setNewPassword("");
    setConfirmPassword("");
    setResetError("");
    setResetSuccess(false);
    setShowPasswordForm(true);
  }

  async function handleSetPassword() {
    setResetError("");
    const strengthError = validatePasswordStrength(newPassword);
    if (strengthError) { setResetError(strengthError); return; }
    if (newPassword !== confirmPassword) { setResetError("Passwords do not match"); return; }

    setResetting(true);
    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newPassword }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        setResetError(errorData.error ?? "Failed to set password");
        return;
      }
      setResetSuccess(true);
      setShowPasswordForm(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setResetError("Network error");
    } finally {
      setResetting(false);
    }
  }

  function startEdit() {
    setForm(data);
    setError("");
    setEditing(true);
  }

  function updateEducationRow(index: number, key: keyof EducationDetail, value: string) {
    setForm((prev) => ({
      ...prev,
      educationDetails: prev.educationDetails.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    }));
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error ?? "Failed to save");
        return;
      }
      setData(form);
      setEditing(false);
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-400">Loading...</div>;
  }

  const view = editing ? form : data;

  const editAction = editing ? null : (
    <button
      onClick={startEdit}
      className="flex items-center gap-1.5 px-4 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors font-medium"
    >
      <Pencil size={14} />
      Edit Details
    </button>
  );

  return (
    <div className="space-y-6">
      {context && !editing && <p className="text-xs text-gray-500">{context}</p>}

      {error && (
        <div className="px-4 py-2.5 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">{error}</div>
      )}

      {/* Login Credentials */}
      <SectionCard title="Login Credentials">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 bg-gray-50 rounded-lg px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-xs text-gray-400 mb-0.5">Email</p>
              <p className="text-sm font-medium text-gray-800 truncate">{email || "—"}</p>
            </div>
            <button
              onClick={copyEmail}
              disabled={!email}
              className="flex-shrink-0 flex items-center gap-1 text-xs text-gray-500 hover:text-orange-600 border border-gray-200 hover:border-orange-200 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {copiedEmail ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
              {copiedEmail ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg px-3 py-2.5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-gray-400 mb-0.5">Password</p>
                <p className="text-sm text-gray-400 italic">Not stored — set a new one to change it</p>
              </div>
              {!showPasswordForm && (
                <button
                  onClick={openPasswordForm}
                  className="flex-shrink-0 flex items-center gap-1 text-xs text-white bg-orange-600 hover:bg-orange-700 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  Set new password
                </button>
              )}
            </div>

            {showPasswordForm && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="flex-shrink-0 p-1.5 text-gray-500 hover:text-orange-600 border border-gray-200 hover:border-orange-200 rounded-lg transition-colors"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <p className="text-xs text-gray-400">At least 8 characters, with a letter and a number.</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSetPassword}
                    disabled={resetting}
                    className="text-xs text-white bg-orange-600 hover:bg-orange-700 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                  >
                    {resetting ? "Saving..." : "Save password"}
                  </button>
                  <button
                    onClick={() => setShowPasswordForm(false)}
                    className="text-xs text-gray-600 border border-gray-200 hover:bg-gray-100 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
          {resetError && <p className="text-xs text-red-500">{resetError}</p>}
          {resetSuccess && <p className="text-xs text-green-600">Password updated.</p>}
        </div>
      </SectionCard>

      {/* Personal Details */}
      <SectionCard title="Personal Details" action={editAction}>
        {editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PERSONAL_FIELDS.map((field) => (
              <EditField
                key={field.key}
                label={field.label}
                type={field.type}
                value={form.personalDetails[field.key]}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, personalDetails: { ...prev.personalDetails, [field.key]: value } }))
                }
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PERSONAL_FIELDS.map((field) => (
              <Field key={field.key} label={field.label} value={view.personalDetails[field.key]} />
            ))}
          </div>
        )}
      </SectionCard>

      {/* Education Details */}
      <SectionCard title="Education Details">
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
              {view.educationDetails.map((row, index) => (
                <tr key={row.qualification}>
                  <td className="py-3 pr-4 font-medium text-gray-800 whitespace-nowrap">{row.qualification}</td>
                  {EDUCATION_COLUMNS.map((col) => (
                    <td key={col.key} className="py-3 pr-4">
                      {editing ? (
                        <input
                          type="text"
                          value={form.educationDetails[index]?.[col.key] ?? ""}
                          onChange={(e) => updateEducationRow(index, col.key, e.target.value)}
                          className="w-28 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                        />
                      ) : (
                        <span className="text-gray-700">{row[col.key]?.trim() ? row[col.key] : "—"}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Parent's Details */}
      <SectionCard title="Parent's Details">
        {editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PARENT_FIELDS.map((field) => (
              <EditField
                key={field.key}
                label={field.label}
                wide={field.wide}
                value={form.parentDetails[field.key]}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, parentDetails: { ...prev.parentDetails, [field.key]: value } }))
                }
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PARENT_FIELDS.map((field) => (
              <Field key={field.key} label={field.label} value={view.parentDetails[field.key]} />
            ))}
          </div>
        )}
      </SectionCard>

      {/* Guardian Details */}
      <SectionCard title="Guardian Details">
        {editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {GUARDIAN_FIELDS.map((field) => (
              <EditField
                key={field.key}
                label={field.label}
                wide={field.wide}
                value={form.guardianDetails[field.key]}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, guardianDetails: { ...prev.guardianDetails, [field.key]: value } }))
                }
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {GUARDIAN_FIELDS.map((field) => (
              <Field key={field.key} label={field.label} value={view.guardianDetails[field.key]} />
            ))}
          </div>
        )}
      </SectionCard>

      {editing && (
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Details"}
          </button>
          <button
            onClick={() => { setEditing(false); setError(""); }}
            className="px-5 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
