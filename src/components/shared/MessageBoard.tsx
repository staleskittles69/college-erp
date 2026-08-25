"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Send, MessageCircle, Users, User, X } from "lucide-react";
import { useFetch } from "@/hooks/useFetch";
import { EmptyState } from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";

interface ConversationSummary {
  _id: string;
  kind: "dm" | "group";
  name: string;
  otherUserId: string | null;
  otherRole: "admin" | "teacher" | null;
  participants: { userId: string; name: string; role: "admin" | "teacher" }[];
  lastMessageAt: string;
  lastMessagePreview: string | null;
  lastMessageSenderName: string | null;
  unread: boolean;
}

interface MessageItem {
  _id: string;
  conversationId: string;
  senderUserId: string;
  senderName: string;
  senderRole: "admin" | "teacher";
  text: string;
  createdAt: string;
}

interface StaffDirectoryEntry {
  userId: string;
  name: string;
  role: "admin" | "teacher";
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

export function MessageBoard({ className = "h-[70vh]" }: { className?: string }) {
  return (
    <Suspense fallback={null}>
      <MessageBoardInner className={className} />
    </Suspense>
  );
}

function MessageBoardInner({ className }: { className: string }) {
  const searchParams = useSearchParams();
  const { data: me } = useFetch<CurrentUser | null>("/api/auth/me", null);
  const { data: conversations, setData: setConversations } = useFetch<ConversationSummary[]>(
    "/api/messages/conversations",
    []
  );

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  const [showPicker, setShowPicker] = useState(false);
  const [pickerFilter, setPickerFilter] = useState("");
  const [startingConversation, setStartingConversation] = useState(false);
  const [pickerError, setPickerError] = useState("");
  const { data: staffDirectory } = useFetch<StaffDirectoryEntry[]>(showPicker ? "/api/staff/directory" : null, []);

  const bottomRef = useRef<HTMLDivElement>(null);
  const appliedDeepLinkRef = useRef(false);
  const readReceiptSentRef = useRef<string | null>(null);

  const activeConversation = conversations.find((conversation) => conversation._id === activeConversationId) ?? null;

  // Auto-open the conversation named by ?conversation=<id> (from a notification click-through),
  // but only once — conversations gets replaced on nearly every action, and re-applying on
  // every change would snap the user back here even after they've since navigated elsewhere.
  useEffect(() => {
    if (appliedDeepLinkRef.current) return;
    const conversationParam = searchParams.get("conversation");
    if (!conversationParam || conversations.length === 0) return;
    if (conversations.some((conversation) => conversation._id === conversationParam)) {
      setActiveConversationId(conversationParam);
    }
    appliedDeepLinkRef.current = true;
  }, [searchParams, conversations]);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    let cancelled = false;

    async function loadMessages() {
      const response = await fetch(`/api/messages/conversations/${activeConversationId}/messages`, {
        credentials: "include",
      });
      if (response.ok && !cancelled) setMessages(await response.json());
    }

    setMessagesLoading(true);
    loadMessages().finally(() => !cancelled && setMessagesLoading(false));
    const interval = setInterval(loadMessages, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeConversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Mark the conversation read once per time it's opened.
  useEffect(() => {
    if (!activeConversationId) return;
    if (readReceiptSentRef.current === activeConversationId) return;
    readReceiptSentRef.current = activeConversationId;
    fetch(`/api/messages/conversations/${activeConversationId}/read`, { method: "PATCH", credentials: "include" }).catch(
      () => {}
    );
    setConversations((prev) =>
      prev.map((conversation) => (conversation._id === activeConversationId ? { ...conversation, unread: false } : conversation))
    );
  }, [activeConversationId, setConversations]);

  async function startConversation(entry: StaffDirectoryEntry) {
    setStartingConversation(true);
    setPickerError("");
    try {
      const response = await fetch("/api/messages/conversations", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientUserId: entry.userId }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Failed to start conversation");
      setConversations((prev) => (prev.some((conversation) => conversation._id === body._id) ? prev : [body, ...prev]));
      setActiveConversationId(body._id);
      setShowPicker(false);
      setPickerFilter("");
    } catch (err) {
      setPickerError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setStartingConversation(false);
    }
  }

  async function sendMessage(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    if (!draft.trim() || !activeConversationId) return;
    setSending(true);
    setSendError("");
    try {
      const response = await fetch(`/api/messages/conversations/${activeConversationId}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: draft.trim() }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Failed to send message");
      setMessages((prev) => [...prev, body]);
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation._id === activeConversationId
            ? {
                ...conversation,
                lastMessageAt: body.createdAt,
                lastMessagePreview: body.text,
                lastMessageSenderName: body.senderName,
                unread: false,
              }
            : conversation
        )
      );
      setDraft("");
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  }

  const filteredStaff = staffDirectory.filter((entry) =>
    entry.name.toLowerCase().includes(pickerFilter.toLowerCase())
  );

  const sortedConversations = [...conversations].sort((a, b) => {
    if (a.kind === "group" && b.kind !== "group") return -1;
    if (b.kind === "group" && a.kind !== "group") return 1;
    return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
  });

  return (
    <div className={`rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex ${className}`}>
      {/* Conversation list */}
      <div className={`w-full md:w-80 flex-shrink-0 border-r border-gray-200 flex-col ${activeConversationId ? "hidden md:flex" : "flex"}`}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Messages</h2>
          <button
            onClick={() => setShowPicker(true)}
            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors"
          >
            <Plus size={14} /> New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sortedConversations.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">No conversations yet.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {sortedConversations.map((conversation) => (
                <li key={conversation._id}>
                  <button
                    onClick={() => setActiveConversationId(conversation._id)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${activeConversationId === conversation._id ? "bg-orange-50" : ""}`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      {conversation.kind === "group" ? (
                        <Users size={13} className="text-gray-400 shrink-0" />
                      ) : (
                        <User size={13} className="text-gray-400 shrink-0" />
                      )}
                      <p className="text-sm font-semibold text-gray-800 truncate flex-1">{conversation.name}</p>
                      {conversation.unread && <span className="w-2 h-2 rounded-full bg-orange-600 shrink-0" />}
                    </div>
                    {conversation.lastMessagePreview && (
                      <p className="text-xs text-gray-500 truncate mt-1">
                        <span className="font-medium">{conversation.lastMessageSenderName}:</span>{" "}
                        {conversation.lastMessagePreview}
                      </p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-1">{relativeTime(conversation.lastMessageAt)}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Chat panel */}
      <div className={`flex-1 flex-col ${activeConversationId ? "flex" : "hidden md:flex"}`}>
        {!activeConversation ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={<MessageCircle size={30} />}
              iconClassName="bg-orange-50 text-orange-500"
              title="Select a conversation"
              subtitle="Pick a conversation on the left, or start a new one."
            />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-100">
              <div className="flex items-center gap-2 min-w-0">
                <button onClick={() => setActiveConversationId(null)} className="md:hidden text-gray-400 hover:text-gray-700 shrink-0">
                  <X size={18} />
                </button>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{activeConversation.name}</p>
                  <p className="text-xs text-gray-400">
                    {activeConversation.kind === "group"
                      ? `${activeConversation.participants.length} members`
                      : activeConversation.otherRole === "admin"
                        ? "Admin"
                        : "Teacher"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {messagesLoading && messages.length === 0 ? (
                <p className="text-center text-sm text-gray-400 mt-8">Loading messages…</p>
              ) : messages.length === 0 ? (
                <p className="text-center text-sm text-gray-400 mt-8">No messages yet. Say hello!</p>
              ) : (
                messages.map((message) => {
                  const isOwn = me?.id === message.senderUserId;
                  return (
                    <div key={message._id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                        {!isOwn && (
                          <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
                            {message.senderName}
                            <span
                              className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                                message.senderRole === "admin" ? "text-orange-600 bg-orange-50" : "text-gray-500 bg-gray-100"
                              }`}
                            >
                              {message.senderRole === "admin" ? "Admin" : "Teacher"}
                            </span>
                          </p>
                        )}
                        <div className={`rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap ${isOwn ? "bg-orange-600 text-white" : "bg-gray-100 text-gray-800"}`}>
                          {message.text}
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
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message…"
                  maxLength={2000}
                  className="flex-1 px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                />
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

      {/* New conversation modal */}
      {showPicker && (
        <Modal
          title="New Conversation"
          subtitle="Start a direct message with a staff member."
          onClose={() => {
            setShowPicker(false);
            setPickerFilter("");
            setPickerError("");
          }}
        >
          <div className="p-6 space-y-4">
            <input
              autoFocus
              value={pickerFilter}
              onChange={(e) => setPickerFilter(e.target.value)}
              placeholder="Search staff by name…"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
            />
            {pickerError && <p className="text-xs text-red-500">{pickerError}</p>}
            <div className="max-h-64 overflow-y-auto -mx-2">
              {filteredStaff.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-6">No staff found.</p>
              ) : (
                filteredStaff.map((entry) => (
                  <button
                    key={entry.userId}
                    disabled={startingConversation}
                    onClick={() => startConversation(entry)}
                    className="w-full text-left px-2 py-2.5 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between disabled:opacity-50"
                  >
                    <span className="text-sm font-medium text-gray-800">{entry.name}</span>
                    <span className="text-xs text-gray-400">{entry.role === "admin" ? "Admin" : "Teacher"}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
