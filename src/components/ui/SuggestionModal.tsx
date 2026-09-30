"use client";

import { FormEvent, useState } from "react";
import Modal from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// Shown when someone finishes the walkthrough. Submissions are readable only by the portal owner.
export function SuggestionModal({ defaultName, onClose }: { defaultName: string; onClose: () => void }) {
  const [name, setName] = useState(defaultName);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!message.trim()) { setError("Please write your feedback."); return; }
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/suggestions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message }),
      });
      if (response.ok) {
        setSent(true);
      } else {
        const result = await response.json().catch(() => ({}));
        setError(result.error ?? "Couldn't send. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setSending(false);
  }

  return (
    <Modal portal title="Help us improve" subtitle="Your feedback goes only to the portal admin" onClose={onClose} maxWidth="max-w-lg">
      {sent ? (
        <div className="px-6 py-8 text-center">
          <p className="text-lg font-semibold text-gray-900">Thank you!</p>
          <p className="text-sm text-gray-500 mt-1">We really appreciate your feedback.</p>
          <Button className="mt-6" onClick={onClose}>Close</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-600">
            Found something wrong, or have an idea? Leave any corrections, suggestions, or features you&apos;d like
            added &mdash; every input is appreciated.
          </p>
          <Input label="Your name" value={name} maxLength={80} onChange={(e) => { setName(e.target.value); setError(""); }} placeholder="Enter your name" />
          <div>
            <label htmlFor="suggestion-message" className="block text-sm font-medium text-gray-700 mb-1">Your feedback</label>
            <textarea
              id="suggestion-message"
              value={message}
              maxLength={2000}
              rows={5}
              onChange={(e) => { setMessage(e.target.value); setError(""); }}
              placeholder="Corrections, suggestions, or features you'd like to see…"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Skip</Button>
            <Button type="submit" disabled={sending}>{sending ? "Sending…" : "Send feedback"}</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
