"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Hash, Plus, Send, Trash2, Pencil, ShieldCheck, MessageCircle, Check, X } from "lucide-react";
import { useFetch } from "@/hooks/useFetch";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  parseMentionFragment,
  applyMentionSelection,
  reconcilePendingMentions,
  splitMessageForMentions,
} from "@/lib/forumMentions";

interface ForumSummary {
  _id: string;
  name: string;
  category: string;
  createdByUserId: string;
  createdByName: string;
  createdAt: string;
  messageCount: number;
  lastActivityAt: string;
  lastMessagePreview: string | null;
  lastMessageSenderName: string | null;
}

interface ForumMessageItem {
  _id: string;
  forumId: string;
  senderUserId: string;
  senderName: string;
  senderRole: "student" | "teacher";
  text: string;
  mentions: { userId: string; name: string }[];
  createdAt: string;
}

interface TeacherDirectoryEntry {
  userId: string;
  name: string;
}

interface CurrentUser {
  id: string;
  role: "student" | "teacher" | "admin";
  name?: string;
}

const POLL_MS = 3000;

function relativeTime(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function ForumBoard({ className = "h-[70vh]" }: { className?: string }) {
  return (
    <Suspense fallback={null}>
      <ForumBoardInner className={className} />
    </Suspense>
  );
}

function ForumBoardInner({ className }: { className: string }) {
  const searchParams = useSearchParams();
  const { data: me } = useFetch<CurrentUser | null>("/api/auth/me", null);
  const { data: forums, setData: setForums } = useFetch<ForumSummary[]>("/api/forums", []);

  const [activeForumId, setActiveForumId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ForumMessageItem[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [pendingMentions, setPendingMentions] = useState<Record<string, string>>({});
  const [highlightedSuggestion, setHighlightedSuggestion] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: teacherDirectory } = useFetch<TeacherDirectoryEntry[]>(
    me?.role === "student" ? "/api/teachers/directory" : null,
    []
  );
  const mentionSuggestions =
    mentionQuery !== null
      ? teacherDirectory.filter((teacher) => teacher.name.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 5)
      : [];

  const bottomRef = useRef<HTMLDivElement>(null);
  const appliedDeepLinkRef = useRef(false);

  const activeForum = forums.find((forum) => forum._id === activeForumId) ?? null;

  // Auto-open the forum named by ?forum=<id> (from a notification click-through), but only
  // once — forums gets replaced on nearly every action, and re-applying on every change
  // would snap the user back here even after they've since navigated elsewhere.
  useEffect(() => {
    if (appliedDeepLinkRef.current) return;
    const forumParam = searchParams.get("forum");
    if (!forumParam || forums.length === 0) return;
    if (forums.some((forum) => forum._id === forumParam)) {
      setActiveForumId(forumParam);
    }
    appliedDeepLinkRef.current = true;
  }, [searchParams, forums]);

  useEffect(() => {
    if (!activeForumId) {
      setMessages([]);
      return;
    }
    let cancelled = false;

    async function loadMessages() {
      const response = await fetch(`/api/forums/${activeForumId}/messages`, { credentials: "include" });
      if (response.ok && !cancelled) setMessages(await response.json());
    }

    setMessagesLoading(true);
    loadMessages().finally(() => !cancelled && setMessagesLoading(false));
    const interval = setInterval(loadMessages, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeForumId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function createForum(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setCreateError("");
    try {
      const response = await fetch("/api/forums", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Failed to create forum");
      setForums((prev) => [body, ...prev]);
      setActiveForumId(body._id);
      setShowCreate(false);
      setNewName("");
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  async function sendMessage(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    if (!draft.trim() || !activeForumId) return;
    setSending(true);
    setSendError("");
    try {
      const response = await fetch(`/api/forums/${activeForumId}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: draft.trim(), mentionedUserIds: Object.keys(pendingMentions) }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Failed to send message");
      setMessages((prev) => [...prev, body]);
      setForums((prev) =>
        prev.map((forum) =>
          forum._id === activeForumId
            ? { ...forum, messageCount: forum.messageCount + 1, lastActivityAt: body.createdAt, lastMessagePreview: body.text, lastMessageSenderName: body.senderName }
            : forum
        )
      );
      setDraft("");
      setPendingMentions({});
      setMentionQuery(null);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  }

  function handleDraftChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setDraft(value);
    if (me?.role !== "student") return;
    setMentionQuery(parseMentionFragment(value));
    setHighlightedSuggestion(0);
    setPendingMentions((prev) => reconcilePendingMentions(prev, value));
  }

  function selectMention(teacher: TeacherDirectoryEntry) {
    const fragment = mentionQuery ?? "";
    setDraft((prev) => applyMentionSelection(prev, fragment, teacher.name));
    setPendingMentions((prev) => ({ ...prev, [teacher.userId]: teacher.name }));
    setMentionQuery(null);
    inputRef.current?.focus();
  }

  function handleComposeKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (mentionQuery === null || mentionSuggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedSuggestion((i) => (i + 1) % mentionSuggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedSuggestion((i) => (i - 1 + mentionSuggestions.length) % mentionSuggestions.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      selectMention(mentionSuggestions[highlightedSuggestion]);
    } else if (e.key === "Escape") {
      setMentionQuery(null);
    }
  }

  async function deleteMessage(messageId: string) {
    if (!activeForumId) return;
    if (!confirm("Delete this message?")) return;
    const response = await fetch(`/api/forums/${activeForumId}/messages/${messageId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (response.ok) setMessages((prev) => prev.filter((message) => message._id !== messageId));
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

  async function deleteForum() {
    if (!activeForumId) return;
    if (!confirm(`Delete "${activeForum?.name}"? This cannot be undone.`)) return;
    const response = await fetch(`/api/forums/${activeForumId}`, { method: "DELETE", credentials: "include" });
    if (response.ok) {
      setForums((prev) => prev.filter((forum) => forum._id !== activeForumId));
      setActiveForumId(null);
    }
  }

  const canRenameActiveForum = !!me && !!activeForum && (me.role === "admin" || me.id === activeForum.createdByUserId);
  const canDeleteActiveForum =
    !!me && !!activeForum && (me.role === "admin" || me.role === "teacher" || me.id === activeForum.createdByUserId);

  return (
    <div className={`rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex ${className}`}>
      {/* Forum list */}
      <div className={`w-full md:w-80 flex-shrink-0 border-r border-gray-200 flex-col ${activeForumId ? "hidden md:flex" : "flex"}`}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Forums</h2>
          {me?.role === "student" && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors"
            >
              <Plus size={14} /> New
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {forums.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">No forums yet.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {forums.map((forum) => (
                <li key={forum._id}>
                  <button
                    onClick={() => setActiveForumId(forum._id)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${activeForumId === forum._id ? "bg-orange-50" : ""}`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Hash size={13} className="text-gray-400 shrink-0" />
                      <p className="text-sm font-semibold text-gray-800 truncate">{forum.name}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{forum.messageCount} messages</p>
                    {forum.lastMessagePreview && (
                      <p className="text-xs text-gray-500 truncate mt-1">
                        <span className="font-medium">{forum.lastMessageSenderName}:</span> {forum.lastMessagePreview}
                      </p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-1">{relativeTime(forum.lastActivityAt)}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Chat panel */}
      <div className={`flex-1 flex-col ${activeForumId ? "flex" : "hidden md:flex"}`}>
        {!activeForum ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState icon={<MessageCircle size={30} />} iconClassName="bg-orange-50 text-orange-500" title="Select a forum" subtitle="Pick a forum on the left to join the conversation." />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-100">
              <div className="flex items-center gap-2 min-w-0">
                <button onClick={() => setActiveForumId(null)} className="md:hidden text-gray-400 hover:text-gray-700 shrink-0">
                  <X size={18} />
                </button>
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
              </div>
              {(canRenameActiveForum || canDeleteActiveForum) && !renaming && (
                <div className="flex items-center gap-2 shrink-0">
                  {canRenameActiveForum && (
                    <button
                      onClick={() => { setRenaming(true); setRenameValue(activeForum.name); }}
                      className="text-gray-400 hover:text-gray-700"
                      title="Rename forum"
                    >
                      <Pencil size={15} />
                    </button>
                  )}
                  {canDeleteActiveForum && (
                    <button onClick={deleteForum} className="text-gray-400 hover:text-red-600" title="Delete forum">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {messagesLoading && messages.length === 0 ? (
                <p className="text-center text-sm text-gray-400 mt-8">Loading messages…</p>
              ) : messages.length === 0 ? (
                <p className="text-center text-sm text-gray-400 mt-8">No messages yet. Say hello!</p>
              ) : (
                messages.map((message) => {
                  const isOwn = me?.id === message.senderUserId;
                  const canDelete = isOwn || me?.role === "teacher" || me?.role === "admin";
                  return (
                    <div key={message._id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                      <div className={`group max-w-[75%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                        {!isOwn && (
                          <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
                            {message.senderName}
                            {message.senderRole === "teacher" && (
                              <span className="flex items-center gap-0.5 text-[10px] font-medium text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">
                                <ShieldCheck size={10} /> Moderator
                              </span>
                            )}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5">
                          {isOwn && canDelete && (
                            <button
                              onClick={() => deleteMessage(message._id)}
                              className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                          <div className={`rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap ${isOwn ? "bg-orange-600 text-white" : "bg-gray-100 text-gray-800"}`}>
                            {splitMessageForMentions(message.text, message.mentions ?? []).map((part, partIdx) =>
                              part.isMention ? (
                                <span key={partIdx} className={`font-semibold ${isOwn ? "text-white underline" : "text-orange-700"}`}>
                                  {part.text}
                                </span>
                              ) : (
                                <span key={partIdx}>{part.text}</span>
                              )
                            )}
                          </div>
                          {!isOwn && canDelete && (
                            <button
                              onClick={() => deleteMessage(message._id)}
                              className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">{relativeTime(message.createdAt)}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={sendMessage} className="border-t border-gray-100 p-3">
              {sendError && <p className="text-xs text-red-500 mb-2 px-1">{sendError}</p>}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    value={draft}
                    onChange={handleDraftChange}
                    onKeyDown={handleComposeKeyDown}
                    placeholder={me?.role === "student" ? "Type a message… (@ to mention a teacher)" : "Type a message…"}
                    maxLength={2000}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                  />
                  {mentionSuggestions.length > 0 && (
                    <div className="absolute bottom-full left-0 mb-1 w-64 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg z-20">
                      {mentionSuggestions.map((teacher, suggestionIdx) => (
                        <button
                          key={teacher.userId}
                          type="button"
                          onClick={() => selectMention(teacher)}
                          className={`w-full text-left px-3 py-2 text-sm ${
                            suggestionIdx === highlightedSuggestion ? "bg-orange-50 text-orange-700" : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          {teacher.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  <Send size={14} />
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      {/* Create forum modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <form onSubmit={createForum} onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-semibold text-gray-800">New Forum</h3>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={60}
                placeholder="e.g. DBMS Study Group"
                required
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
              />
            </div>
            {createError && <p className="text-xs text-red-500">{createError}</p>}
            <div className="flex items-center gap-2 justify-end">
              <button type="button" onClick={() => setShowCreate(false)} className="px-3.5 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-60"
              >
                {creating ? "Creating…" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
