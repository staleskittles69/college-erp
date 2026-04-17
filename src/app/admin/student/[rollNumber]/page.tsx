import Breadcrumb from "@/components/admin/Breadcrumb";

const STUDENTS = [
  { roll: "CS001", name: "Rahul Sharma", branch: "CSE", year: "1st Year", section: "A", email: "rahul@college.edu", status: "Active" },
  { roll: "CS002", name: "Priya Patel", branch: "CSE", year: "1st Year", section: "A", email: "priya@college.edu", status: "Active" },
  { roll: "CS003", name: "Amit Kumar", branch: "CSE", year: "2nd Year", section: "B", email: "amit@college.edu", status: "Active" },
  { roll: "EC001", name: "Sneha Reddy", branch: "ECE", year: "1st Year", section: "A", email: "sneha@college.edu", status: "Inactive" },
  { roll: "ME001", name: "Vikram Singh", branch: "MECH", year: "3rd Year", section: "A", email: "vikram@college.edu", status: "Active" },
];

interface Props {
  params: { rollNumber: string };
}

export default function StudentProfilePage({ params }: Props) {
  const student = STUDENTS.find(
    (s) => s.roll.toLowerCase() === params.rollNumber.toLowerCase()
  );

  if (!student) {
    return (
      <div className="max-w-2xl mx-auto">
        <Breadcrumb items={[{ label: "Search" }, { label: params.rollNumber }]} />
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center mt-6">
          <p className="text-sm font-medium text-gray-500">No student found for roll number</p>
          <p className="text-lg font-bold text-gray-800 mt-1">{params.rollNumber}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Breadcrumb items={[{ label: "Search" }, { label: student.roll }]} />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {student.branch} · {student.year} · Section {student.section}
        </p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {[
          { label: "Roll Number", value: student.roll },
          { label: "Full Name", value: student.name },
          { label: "Branch", value: student.branch },
          { label: "Year", value: student.year },
          { label: "Section", value: `Section ${student.section}` },
          { label: "Email", value: student.email },
          { label: "Status", value: student.status },
        ].map(({ label, value }) => (
          <div key={label} className="px-6 py-4 flex items-center justify-between">
            <span className="text-sm text-gray-500">{label}</span>
            <span className="text-sm font-medium text-gray-800">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
