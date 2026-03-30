import TeacherHeader, { TeacherDetail } from "@/components/admin/teachers/TeacherHeader";
import TeacherTimetable from "@/components/admin/teachers/TeacherTimetable";
import TeacherTopics from "@/components/admin/teachers/TeacherTopics";

const TEACHERS: TeacherDetail[] = [
  { id: "1", name: "Dr. Priya Sharma",   subject: "Data Structures",    branch: "CSE",   email: "priya@college.edu",   phone: "+91 98765 43210" },
  { id: "2", name: "Prof. Rahul Verma",  subject: "Algorithms",          branch: "CSE",   email: "rahul@college.edu",   phone: "+91 98765 43211" },
  { id: "3", name: "Dr. Anita Patel",    subject: "DBMS",               branch: "CSE",   email: "anita@college.edu",   phone: "+91 98765 43212" },
  { id: "4", name: "Prof. Suresh Kumar", subject: "Digital Electronics", branch: "ECE",   email: "suresh@college.edu",  phone: "+91 98765 43213" },
  { id: "5", name: "Dr. Meena Iyer",     subject: "Signals & Systems",  branch: "ECE",   email: "meena@college.edu",   phone: "+91 98765 43214" },
  { id: "6", name: "Prof. Arun Nair",    subject: "Thermodynamics",     branch: "MECH",  email: "arun@college.edu",    phone: "+91 98765 43215" },
  { id: "7", name: "Dr. Kavitha Reddy",  subject: "Fluid Mechanics",    branch: "MECH",  email: "kavitha@college.edu", phone: "+91 98765 43216" },
  { id: "8", name: "Prof. Vikram Singh", subject: "Structural Analysis", branch: "CIVIL", email: "vikram@college.edu",  phone: "+91 98765 43217" },
];

export default function TeacherDetailPage({ params }: { params: { id: string } }) {
  const teacher = TEACHERS.find((t) => t.id === params.id) ?? TEACHERS[0];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Teacher Details</h1>
        <p className="text-sm text-gray-500 mt-1">Viewing profile for {teacher.name}</p>
      </div>

      <TeacherHeader teacher={teacher} />
      <TeacherTimetable />
      <TeacherTopics />
    </div>
  );
}
