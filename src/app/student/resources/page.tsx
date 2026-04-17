import { Library } from "lucide-react";

export default function ResourcesPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl bg-gradient-to-br from-[#0a1f44] to-[#1a56db] px-8 py-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold tracking-tight">Resources</h1>
        <p className="text-blue-200 text-sm mt-1">Study materials and library resources.</p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-16 flex flex-col items-center justify-center min-h-[300px] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
          <Library size={30} className="text-emerald-500" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-gray-700">No resources yet</p>
          <p className="text-sm text-gray-400 mt-1">Study materials and notes shared by teachers will appear here.</p>
        </div>
      </div>
    </div>
  );
}
