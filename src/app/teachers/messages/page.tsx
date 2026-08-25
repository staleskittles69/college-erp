"use client";

import { MessageSquare } from "lucide-react";
import { MessageBoard } from "@/components/shared/MessageBoard";

export default function TeacherMessagesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center">
          <MessageSquare size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Messages</h1>
          <p className="text-sm text-gray-500">Chat directly with admin and other teachers.</p>
        </div>
      </div>
      <MessageBoard />
    </div>
  );
}
