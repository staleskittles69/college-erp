"use client";

import { MessageBoard } from "@/components/shared/MessageBoard";

export default function AdminMessagesPage() {
  return (
    <div className="h-[calc(100vh-4rem-2rem)] sm:h-[calc(100vh-4rem-3rem)] animate-fade-in">
      <MessageBoard className="h-full" />
    </div>
  );
}
