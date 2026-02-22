import { NoticeForm } from "@/components/admin/NoticeForm";

export default function AdminNoticesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Notices</h1>
      <NoticeForm />
    </div>
  );
}
