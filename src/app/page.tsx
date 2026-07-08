import Link from "next/link";
import { GraduationCap, BarChart2, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0a1f44] via-[#0d2d5e] to-[#1a56db] px-4">

      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
          Welcome
        </h1>
        <p className="text-blue-200 text-sm">Choose a portal to continue</p>
      </div>

      {/* Portal cards */}
      <div className="flex flex-col sm:flex-row gap-5 w-full max-w-2xl">

        {/* EduPortal */}
        <Link
          href="/login"
          className="group flex-1 flex flex-col items-center gap-5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-8 text-white hover:bg-white/20 hover:border-white/40 transition-all duration-200 shadow-lg"
        >
          <div className="w-14 h-14 rounded-2xl bg-blue-500 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
            <GraduationCap size={28} className="text-white" />
          </div>
          <div className="text-center">
            <p className="text-lg font-bold mb-1">EduPortal</p>
            <p className="text-blue-200 text-sm leading-relaxed">
              Attendance, grades, timetable &amp; more
            </p>
          </div>
          <span className="mt-auto flex items-center gap-1.5 text-sm font-medium text-blue-300 group-hover:text-white transition-colors">
            Sign in <ArrowRight size={15} />
          </span>
        </Link>

        {/* SIAAS */}
        <a
          href={process.env.NEXT_PUBLIC_SIAAS_URL ?? "http://localhost"}
          className="group flex-1 flex flex-col items-center gap-5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-8 text-white hover:bg-white/20 hover:border-white/40 transition-all duration-200 shadow-lg"
        >
          <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
            <BarChart2 size={28} className="text-white" />
          </div>
          <div className="text-center">
            <p className="text-lg font-bold mb-1">SIAAS</p>
            <p className="text-blue-200 text-sm leading-relaxed">
              Analytics, CGPA planner &amp; insights
            </p>
          </div>
          <span className="mt-auto flex items-center gap-1.5 text-sm font-medium text-blue-300 group-hover:text-white transition-colors">
            Sign in <ArrowRight size={15} />
          </span>
        </a>

      </div>

      <p className="mt-12 text-xs text-white/30">College ERP &copy; {new Date().getFullYear()}</p>
    </div>
  );
}
