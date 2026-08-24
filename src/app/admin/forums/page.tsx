"use client";

import { useEffect, useState } from "react";
import { Hash, Trash2, Pencil, Check, X, ShieldCheck } from "lucide-react";
import { useFetch } from "@/hooks/useFetch";
import Breadcrumb from "@/components/shared/Breadcrumb";

interface ForumSummary {
  _id: string;
  name: string;
  createdByName: string;
  createdAt: string;
  messageCount: number;
  lastActivityAt: string;
}

interface ForumMessageItem {
  _id: string;
  senderName: string;
  senderRole: "student" | "teacher";
  text: string;
  createdAt: string;
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

export default function AdminForumsPage() {
  const { data: forums, setData: setForums } = useFetch<ForumSummary[]>("/api/forums", []);
  const [activeForumId, setActiveForumId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ForumMessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const activeForum = forums.find((forum) => forum._id === activeForumId) ?? null;

  useEffect(() => {
    if (!activeForumId) return;
    setLoadingMessages(true);
    fetch(`/api/forums/${activeForumId}/messages`, { credentials: "include" })
      .then((response) => (response.ok ? response.json() : []))
      .then(setMessages)
      .finally(() => setLoadingMessages(false));
  }, [activeForumId]);

  async function deleteMessage(messageId: string) {
    if (!activeForumId || !confirm("Delete this message?")) return;
    const response = await fetch(`/api/forums/${activeForumId}/messages/${messageId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (response.ok) setMessages((prev) => prev.filter((message) => message._id !== messageId));
  }

  async function deleteForum(forum: ForumSummary) {
    if (!confirm(`Delete "${forum.name}"? This removes all its messages and cannot be undone.`)) return;
    const response = await fetch(`/api/forums/${forum._id}`, { method: "DELETE", credentials: "include" });
    if (response.ok) {
      setForums((prev) => prev.filter((item) => item._id !== forum._id));
      if (activeForumId === forum._id) setActiveForumId(null);
    }
  }

  async function saveRename() {
    if (!activeForumId || !renameValue.trim()) return;
    const response = await fetch(`/api/forums/${activeForumId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: renameValue.trim() }),
    });
    if (response.ok) {
      const body = await response.json();
      setForums((prev) => prev.map((forum) => (forum._id === activeForumId ? { ...forum, name: body.name } : forum)));
      setRenaming(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Breadcrumb items={[{ label: "Forums" }]} />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Forums</h1>
        <p className="text-sm text-gray-500 mt-1">Oversight for student discussion forums — rename, review, or remove content.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden max-h-[70vh] overflow-y-auto">
          {forums.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">No forums yet.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {forums.map((forum) => (
                <li key={forum._id} className={`px-4 py-3 ${activeForumId === forum._id ? "bg-orange-50" : ""}`}>
                  <button onClick={() => setActiveForumId(forum._id)} className="w-full text-left">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Hash size={13} className="text-gray-400 shrink-0" />
                      <p className="text-sm font-semibold text-gray-800 truncate">{forum.name}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {forum.messageCount} messages · by {forum.createdByName}
                    </p>
                  </button>
                  <button
                    onClick={() => deleteForum(forum)}
                    className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600"
                  >
                    <Trash2 size={12} /> Delete forum
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden max-h-[70vh] flex flex-col">
          {!activeForum ? (
            <div className="flex-1 flex items-center justify-center p-16 text-sm text-gray-400">
              Select a forum to review its messages.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-100">
                {renaming ? (
                  <div className="flex items-center gap-1.5 min-w-0">
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      maxLength={60}
                      className="px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                    />
                    <button onClick={saveRename} className="text-green-600 hover:text-green-700"><Check size={16} /></button>
                    <button onClick={() => setRenaming(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                  </div>
                ) : (
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{activeForum.name}</p>
                    <p className="text-xs text-gray-400">created by {activeForum.createdByName}</p>
                  </div>
                )}
                {!renaming && (
                  <button
                    onClick={() => { setRenaming(true); setRenameValue(activeForum.name); }}
                    className="text-gray-400 hover:text-gray-700 shrink-0"
                    title="Rename forum"
                  >
                    <Pencil size={15} />
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {loadingMessages ? (
                  <p className="text-center text-sm text-gray-400 mt-8">Loading messages…</p>
                ) : messages.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 mt-8">No messages in this forum yet.</p>
                ) : (
                  messages.map((message) => (
                    <div key={message._id} className="group flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <span className="font-medium">{message.senderName}</span>
                          {message.senderRole === "teacher" && (
                            <span className="flex items-center gap-0.5 text-[10px] font-medium text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">
                              <ShieldCheck size={10} /> Moderator
                            </span>
                          )}
                          <span className="text-gray-400">· {formatTimestamp(message.createdAt)}</span>
                        </p>
                        <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{message.text}</p>
                      </div>
                      <button
                        onClick={() => deleteMessage(message._id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity shrink-0 mt-0.5"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
