"use client";

import { ForumBoard } from "@/components/shared/ForumBoard";

export default function AdminForumsPage() {
  return (
    <div className="h-[calc(100vh-4rem-2rem)] sm:h-[calc(100vh-4rem-3rem)] animate-fade-in">
      <ForumBoard className="h-full" />
    </div>
  );
}
