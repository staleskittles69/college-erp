"use client";

import { Hash } from "lucide-react";
import { ForumBoard } from "@/components/shared/ForumBoard";

export default function TeacherForumsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center">
          <Hash size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Forums</h1>
          <p className="text-sm text-gray-500">Join any student forum as a moderator.</p>
        </div>
      </div>
      <ForumBoard />
    </div>
  );
}
