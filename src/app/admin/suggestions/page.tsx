"use client";

import { useState } from "react";
import { Lightbulb, Trash2 } from "lucide-react";
import Breadcrumb from "@/components/shared/Breadcrumb";
import { useFetch } from "@/hooks/useFetch";

interface Suggestion {
  _id: string;
  name: string;
  role: "student" | "teacher" | "admin";
  message: string;
  createdAt: string;
}

const ROLE_STYLES: Record<Suggestion["role"], string> = {
  student: "bg-blue-100 text-blue-700",
  teacher: "bg-green-100 text-green-700",
  admin: "bg-orange-100 text-orange-700",
};

// Private to one admin login: the API returns 403 for everyone else.
export default function SuggestionsPage() {
  const { data, loading, error, setData } = useFetch<Suggestion[]>("/api/suggestions", []);
  const [deleteError, setDeleteError] = useState("");

  async function remove(id: string) {
    if (!window.confirm("Delete this suggestion?")) return;
    setDeleteError("");
    const response = await fetch(`/api/suggestions/${id}`, { method: "DELETE", credentials: "include" });
    if (response.ok) setData((current) => current.filter((item) => item._id !== id));
    else setDeleteError("Couldn't delete. Please try again.");
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Breadcrumb items={[{ label: "Suggestions" }]} />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Suggestions</h1>
        <p className="text-sm text-gray-500 mt-1">Feedback, corrections and feature ideas people leave at the end of the walkthrough.</p>
      </div>

      {deleteError && <p className="mb-3 text-sm text-red-600">{deleteError}</p>}

      {loading ? (
        <div className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
      ) : error ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">Not available.</div>
      ) : data.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
          <Lightbulb className="mx-auto text-gray-300" size={32} />
          <p className="mt-2 text-sm text-gray-500">No suggestions yet.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {data.map((item) => (
            <li key={item._id} className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-gray-900">{item.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${ROLE_STYLES[item.role]}`}>{item.role}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(item.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>
                <button onClick={() => remove(item._id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors" aria-label="Delete suggestion">
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{item.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
