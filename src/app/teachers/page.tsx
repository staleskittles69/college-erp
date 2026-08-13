import { redirect } from 'next/navigation';

export default function TeacherPortalRoot() {
  redirect('/teachers/dashboard');
}
