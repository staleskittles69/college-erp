export type UserRole = "student" | "teacher" | "admin";

export interface ApiUser {
  id: string;
  email: string;
  role: UserRole;
  studentId?: string;
  teacherId?: string;
  name?: string;
  rollNo?: string;
  branch?: string;
  semester?: number;
  section?: string;
  department?: string;
  subjects?: string[];
}

export interface TimetableSlot {
  subject: string;
  time: string;
  room: string;
}

export interface NoticeResponse {
  _id: string;
  title: string;
  body: string;
  pinned: boolean;
  createdAt: string;
}

export interface TestResponse {
  _id: string;
  subject: string;
  title: string;
  date: string;
  branch?: string;
  semester?: number;
  maxMarks?: number;
}

export interface AttendanceRecord {
  _id: string;
  studentId: string;
  subject: string;
  date: string;
  status: "present" | "absent";
}
