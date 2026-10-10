"use client";

import { useEffect, useMemo, useState } from "react";
import { BedDouble, Plus } from "lucide-react";
import Breadcrumb from "@/components/shared/Breadcrumb";
import Modal from "@/components/ui/Modal";
import { useFetch } from "@/hooks/useFetch";
import { hostelTypeLabel } from "@/lib/hostelTransport";

type Gender = "boys" | "girls";

interface Room {
  id: string;
  block: string;
  roomNumber: string;
  gender: Gender;
  sharing: 2 | 3;
  ac: boolean;
  occupiedBeds: number;
  active: boolean;
}

interface Occupant { id: string; name: string; rollNumber: string; className: string; }

interface FeeSettings {
  hostelFees: { twoAc: number; twoNonAc: number; threeAc: number; threeNonAc: number };
  hostelDueDate: string | null;
  transportDueDate: string | null;
}

const FEE_FIELDS = [
  { key: "twoAc", label: "2-sharing AC" },
  { key: "twoNonAc", label: "2-sharing Non-AC" },
  { key: "threeAc", label: "3-sharing AC" },
  { key: "threeNonAc", label: "3-sharing Non-AC" },
] as const;

const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500";

export default function AdminHostelPage() {
  const { data: rooms, loading, refetch } = useFetch<Room[]>("/api/admin/hostel/rooms", []);
  const { data: settings } = useFetch<FeeSettings | null>("/api/admin/fees/settings", null);

  // Fee settings form
  const [fees, setFees] = useState<Record<string, string>>({});
  const [dueDate, setDueDate] = useState("");
  const [savingFees, setSavingFees] = useState(false);
  const [feesMessage, setFeesMessage] = useState("");
  const [feesError, setFeesError] = useState("");

  useEffect(() => {
    if (!settings) return;
    setFees(Object.fromEntries(FEE_FIELDS.map(({ key }) => [key, String(settings.hostelFees[key] ?? 0)])));
    setDueDate(settings.hostelDueDate ?? "");
  }, [settings]);

  // Filters
  const [blockFilter, setBlockFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState<"" | Gender>("");
  const blocks = useMemo(() => [...new Set(rooms.map((room) => room.block))].sort(), [rooms]);
  const visibleRooms = rooms.filter((room) => (!blockFilter || room.block === blockFilter) && (!genderFilter || room.gender === genderFilter));

  // Bulk add
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ block: "", gender: "boys" as Gender, from: "", to: "", sharing: "2", ac: "true" });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  // Occupants + row actions
  const [occupantsFor, setOccupantsFor] = useState<Room | null>(null);
  const [occupants, setOccupants] = useState<Occupant[] | null>(null);
  const [listError, setListError] = useState("");

  const totals = useMemo(() => {
    const active = rooms.filter((room) => room.active);
    return {
      beds: active.reduce((sum, room) => sum + room.sharing, 0),
      taken: rooms.reduce((sum, room) => sum + room.occupiedBeds, 0),
    };
  }, [rooms]);

  async function saveFees() {
    setFeesError("");
    setFeesMessage("");
    // Number("") is 0, which would quietly make that room type unbookable.
    if (FEE_FIELDS.some(({ key }) => (fees[key] ?? "").trim() === "")) {
      setFeesError("Enter a fee for every room type.");
      return;
    }
    setSavingFees(true);
    const response = await fetch("/api/admin/fees/settings", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hostelFees: Object.fromEntries(FEE_FIELDS.map(({ key }) => [key, Number(fees[key])])),
        hostelDueDate: dueDate || null,
      }),
    });
    const result = await response.json().catch(() => ({}));
    setSavingFees(false);
    if (response.ok) setFeesMessage("Saved. New prices apply to new bookings.");
    else setFeesError(result.error ?? "Could not save.");
  }

  async function addRooms() {
    setAdding(true);
    setAddError("");
    const response = await fetch("/api/admin/hostel/rooms", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        block: addForm.block,
        gender: addForm.gender,
        from: addForm.from,
        to: addForm.to || addForm.from,
        sharing: Number(addForm.sharing),
        ac: addForm.ac === "true",
      }),
    });
    const result = await response.json().catch(() => ({}));
    setAdding(false);
    if (!response.ok) {
      setAddError(result.error ?? "Could not add rooms.");
      return;
    }
    setAddOpen(false);
    setListError(result.skipped ? `Added ${result.created} rooms; ${result.skipped} already existed and were skipped.` : "");
    refetch();
  }

  async function toggleActive(room: Room) {
    setListError("");
    const response = await fetch(`/api/admin/hostel/rooms/${room.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !room.active }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      setListError(result.error ?? "Could not update the room.");
    }
    refetch();
  }

  async function remove(room: Room) {
    if (!confirm(`Delete Block ${room.block} Room ${room.roomNumber}?`)) return;
    setListError("");
    const response = await fetch(`/api/admin/hostel/rooms/${room.id}`, { method: "DELETE", credentials: "include" });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      setListError(result.error ?? "Could not delete the room.");
      return;
    }
    refetch();
  }

  async function openOccupants(room: Room) {
    setOccupantsFor(room);
    setOccupants(null);
    const response = await fetch(`/api/admin/hostel/rooms/${room.id}`, { credentials: "include" });
    const result = response.ok ? await response.json() : { occupants: [] };
    setOccupants(result.occupants ?? []);
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Breadcrumb items={[{ label: "Hostel" }]} />
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hostel</h1>
          <p className="text-sm text-gray-500 mt-1">
            Students pick a room type and get the first room with a free bed in their own (boys&apos;/girls&apos;) block.
          </p>
        </div>
        <button
          onClick={() => { setAddForm({ block: "", gender: "boys", from: "", to: "", sharing: "2", ac: "true" }); setAddError(""); setAddOpen(true); }}
          className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          <Plus size={16} /> Add rooms
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-800">Hostel fees &amp; due date</h2>
        <p className="text-xs text-gray-500 mt-0.5 mb-4">Yearly fee per room type. Students already booked keep the price they booked at.</p>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {FEE_FIELDS.map(({ key, label }) => (
            <label key={key} className="text-xs font-medium text-gray-600">
              {label} (₹)
              <input
                type="number"
                min={0}
                value={fees[key] ?? ""}
                onChange={(e) => setFees((prev) => ({ ...prev, [key]: e.target.value }))}
                className={`${inputClass} mt-1`}
              />
            </label>
          ))}
          <label className="text-xs font-medium text-gray-600">
            Due date
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={`${inputClass} mt-1`} />
          </label>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={saveFees}
            disabled={savingFees || !settings}
            className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-5 py-2 rounded-lg disabled:opacity-60"
          >
            {savingFees ? "Saving…" : "Save fees"}
          </button>
          {feesMessage && <p className="text-xs text-green-600">{feesMessage}</p>}
          {feesError && <p className="text-xs text-red-500">{feesError}</p>}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-800">{rooms.length}</span> rooms · <span className="font-semibold text-gray-800">{totals.taken}</span> of {totals.beds} beds taken
        </p>
        <div className="flex gap-2">
          <select value={blockFilter} onChange={(e) => setBlockFilter(e.target.value)} aria-label="Filter by block" className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm">
            <option value="">All blocks</option>
            {blocks.map((block) => <option key={block} value={block}>Block {block}</option>)}
          </select>
          <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value as "" | Gender)} aria-label="Filter by hostel" className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm">
            <option value="">Boys &amp; girls</option>
            <option value="boys">Boys</option>
            <option value="girls">Girls</option>
          </select>
        </div>
      </div>

      {listError && <p className="text-xs text-red-500 mb-3">{listError}</p>}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-sm text-gray-400">Loading…</div>
        ) : visibleRooms.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center gap-4 min-h-[300px]">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <BedDouble size={26} className="text-gray-400" />
            </div>
            <p className="font-semibold text-gray-500">{rooms.length === 0 ? "No hostel rooms yet" : "No rooms match these filters"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Room", "Hostel", "Type", "Beds taken", "Status", ""].map((heading) => (
                    <th key={heading} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleRooms.map((room) => (
                  <tr key={room.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-semibold text-gray-800">Block {room.block} · {room.roomNumber}</td>
                    <td className="px-4 py-2.5 text-gray-600 capitalize">{room.gender}</td>
                    <td className="px-4 py-2.5 text-gray-600">{hostelTypeLabel(room.sharing, room.ac)}</td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => openOccupants(room)}
                        className={`font-medium hover:underline ${room.occupiedBeds >= room.sharing ? "text-red-600" : "text-orange-600"}`}
                      >
                        {room.occupiedBeds}/{room.sharing}
                      </button>
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => toggleActive(room)}
                        title="Switch room on/off for new bookings"
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${room.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                      >
                        {room.active ? "Open" : "Off"}
                      </button>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => remove(room)}
                        disabled={room.occupiedBeds > 0}
                        title={room.occupiedBeds > 0 ? "Students live here" : undefined}
                        className="text-xs text-red-500 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {addOpen && (
        <Modal title="Add hostel rooms" subtitle="Adds every room number in the range, all of the same type." onClose={() => setAddOpen(false)} portal>
          <div className="px-6 py-5 grid grid-cols-2 gap-3">
            <label className="text-xs font-medium text-gray-600">
              Block
              <input value={addForm.block} onChange={(e) => setAddForm({ ...addForm, block: e.target.value })} placeholder="A" className={`${inputClass} mt-1`} />
            </label>
            <label className="text-xs font-medium text-gray-600">
              Hostel
              <select value={addForm.gender} onChange={(e) => setAddForm({ ...addForm, gender: e.target.value as Gender })} className={`${inputClass} mt-1`}>
                <option value="boys">Boys</option>
                <option value="girls">Girls</option>
              </select>
            </label>
            <label className="text-xs font-medium text-gray-600">
              From room
              <input value={addForm.from} onChange={(e) => setAddForm({ ...addForm, from: e.target.value })} placeholder="101" className={`${inputClass} mt-1`} />
            </label>
            <label className="text-xs font-medium text-gray-600">
              To room
              <input value={addForm.to} onChange={(e) => setAddForm({ ...addForm, to: e.target.value })} placeholder="110" className={`${inputClass} mt-1`} />
            </label>
            <label className="text-xs font-medium text-gray-600">
              Sharing
              <select value={addForm.sharing} onChange={(e) => setAddForm({ ...addForm, sharing: e.target.value })} className={`${inputClass} mt-1`}>
                <option value="2">2-sharing</option>
                <option value="3">3-sharing</option>
              </select>
            </label>
            <label className="text-xs font-medium text-gray-600">
              AC
              <select value={addForm.ac} onChange={(e) => setAddForm({ ...addForm, ac: e.target.value })} className={`${inputClass} mt-1`}>
                <option value="true">AC</option>
                <option value="false">Non-AC</option>
              </select>
            </label>
            {addError && <p className="col-span-2 text-xs text-red-500">{addError}</p>}
          </div>
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
            <button onClick={() => setAddOpen(false)} className="text-sm text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100">Cancel</button>
            <button
              onClick={addRooms}
              disabled={adding}
              className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-5 py-2 rounded-lg disabled:opacity-60"
            >
              {adding ? "Adding…" : "Add rooms"}
            </button>
          </div>
        </Modal>
      )}

      {occupantsFor && (
        <Modal
          title={`Block ${occupantsFor.block} · Room ${occupantsFor.roomNumber}`}
          subtitle={`${hostelTypeLabel(occupantsFor.sharing, occupantsFor.ac)} · ${occupantsFor.gender}`}
          onClose={() => setOccupantsFor(null)}
          portal
        >
          <div className="px-6 py-5">
            {occupants === null ? (
              <p className="text-center text-sm text-gray-400 py-6">Loading…</p>
            ) : occupants.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-6">This room is empty.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {occupants.map((occupant) => (
                  <li key={occupant.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{occupant.name}</p>
                      <p className="text-xs text-gray-500">{occupant.rollNumber}</p>
                    </div>
                    <p className="text-xs text-gray-500">{occupant.className}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
