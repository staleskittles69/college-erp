"use client";

import { Plus, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const assignments = [
  { title: 'Binary Trees Problem Set',   subject: 'Data Structures',   due: 'Apr 15, 2026', status: 'active' },
  { title: 'SQL Query Assignment',       subject: 'Database Systems',  due: 'Apr 18, 2026', status: 'active' },
  { title: 'Sorting Algorithms Report',  subject: 'Algorithms',        due: 'Apr 10, 2026', status: 'due' },
  { title: 'Process Scheduling Lab',     subject: 'Operating Systems', due: 'Apr 20, 2026', status: 'active' },
  { title: 'ER Diagram Submission',      subject: 'Database Systems',  due: 'Mar 28, 2026', status: 'completed' },
  { title: 'Linked List Implementation', subject: 'Data Structures',   due: 'Mar 20, 2026', status: 'completed' },
];

const STATUS_CONFIG = {
  active:    { label: 'Active',    icon: Clock,        cls: 'bg-blue-100 text-blue-700' },
  due:       { label: 'Due Soon',  icon: AlertCircle,  cls: 'bg-amber-100 text-amber-700' },
  completed: { label: 'Completed', icon: CheckCircle,  cls: 'bg-green-100 text-green-700' },
};

export default function AssignmentsPage() {
  return (
    <div className="space-y-6">

      {/* Hero */}
      <div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-[#0a1f44] to-[#1a56db] px-8 py-6 text-white shadow-lg">
        <div>
          <h1 className="text-xl font-bold">Assignments</h1>
          <p className="text-blue-200 text-sm mt-1">Manage assignments for your classes</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-white/15 border border-white/20 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/25 transition-colors">
          <Plus size={16} />
          Create Assignment
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {(['active', 'due', 'completed'] as const).map((status) => {
          const count = assignments.filter((a) => a.status === status).length;
          const { label, cls } = STATUS_CONFIG[status];
          return (
            <div key={status} className="rounded-xl border border-gray-200 bg-white px-5 py-4 flex items-center gap-3">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{label}</span>
              <span className="text-2xl font-bold text-gray-900">{count}</span>
            </div>
          );
        })}
      </div>

      {/* List */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3.5 font-medium text-gray-500">Title</th>
              <th className="text-left px-5 py-3.5 font-medium text-gray-500">Subject</th>
              <th className="text-left px-5 py-3.5 font-medium text-gray-500">Due Date</th>
              <th className="text-left px-5 py-3.5 font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a, i) => {
              const { label, icon: Icon, cls } = STATUS_CONFIG[a.status as keyof typeof STATUS_CONFIG];
              return (
                <tr key={i} className={`hover:bg-gray-50 transition-colors ${i !== assignments.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <td className="px-5 py-3.5 font-medium text-gray-900">{a.title}</td>
                  <td className="px-5 py-3.5 text-gray-600">{a.subject}</td>
                  <td className="px-5 py-3.5 text-gray-500">{a.due}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
                      <Icon size={11} />
                      {label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
