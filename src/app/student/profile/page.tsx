import { User, Mail, BookOpen, Hash } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Profile hero */}
      <div className="rounded-2xl bg-gradient-to-br from-[#0a1f44] to-[#1a56db] shadow-lg overflow-hidden">
        <div className="px-8 pt-8 pb-6 flex items-end gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center shrink-0">
            <User size={36} className="text-white" />
          </div>
          {/* Info */}
          <div className="pb-1">
            <h1 className="text-2xl font-bold text-white tracking-tight">Student Name</h1>
            <p className="text-blue-200 text-sm mt-0.5">Computer Science · 3rd Year · Section A</p>
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { icon: <Hash size={18} className="text-blue-500" />, label: "Student ID", value: "—", bg: "bg-blue-50" },
          { icon: <Mail size={18} className="text-indigo-500" />, label: "Email", value: "—", bg: "bg-indigo-50" },
          { icon: <BookOpen size={18} className="text-green-500" />, label: "Branch", value: "—", bg: "bg-green-50" },
          { icon: <User size={18} className="text-amber-500" />, label: "Batch", value: "—", bg: "bg-amber-50" },
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

      <p className="text-xs text-gray-400 text-center">Profile data will be available in a future update.</p>
    </div>
  );
}
