"use client";

import { useState } from "react";
import { Bus, Plus, Trash2 } from "lucide-react";
import Breadcrumb from "@/components/shared/Breadcrumb";
import Modal from "@/components/ui/Modal";
import { useFetch } from "@/hooks/useFetch";
import { formatPickupTime, formatRupees } from "@/lib/hostelTransport";

interface Stop { name: string; pickupTime: string; }

interface BusRoute {
  id: string;
  routeNumber: string;
  name: string;
  stops: Stop[];
  annualFee: number;
  capacity: number;
  bookedSeats: number;
  active: boolean;
}

interface Passenger { id: string; name: string; rollNumber: string; className: string; stopName: string; }

interface FormState {
  routeNumber: string;
  name: string;
  annualFee: string;
  capacity: string;
  active: boolean;
  stops: Stop[];
}

const EMPTY_FORM: FormState = { routeNumber: "", name: "", annualFee: "", capacity: "50", active: true, stops: [{ name: "", pickupTime: "07:30" }] };

const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500";

export default function AdminTransportPage() {
  const { data: routes, loading, refetch } = useFetch<BusRoute[]>("/api/admin/transport/routes", []);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [passengersFor, setPassengersFor] = useState<BusRoute | null>(null);
  const [passengers, setPassengers] = useState<Passenger[] | null>(null);
  const [listError, setListError] = useState("");

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(route: BusRoute) {
    setEditingId(route.id);
    setForm({
      routeNumber: route.routeNumber,
      name: route.name,
      annualFee: String(route.annualFee),
      capacity: String(route.capacity),
      active: route.active,
      stops: route.stops.map((stop) => ({ ...stop })),
    });
    setFormError("");
    setFormOpen(true);
  }

  function updateStop(index: number, field: keyof Stop, value: string) {
    setForm((prev) => ({ ...prev, stops: prev.stops.map((stop, i) => (i === index ? { ...stop, [field]: value } : stop)) }));
  }

  async function save() {
    setSaving(true);
    setFormError("");
    const response = await fetch(editingId ? `/api/admin/transport/routes/${editingId}` : "/api/admin/transport/routes", {
      method: editingId ? "PATCH" : "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        routeNumber: form.routeNumber,
        name: form.name,
        annualFee: Number(form.annualFee),
        capacity: Number(form.capacity),
        stops: form.stops,
        ...(editingId ? { active: form.active } : {}),
      }),
    });
    const result = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setFormError(result.error ?? "Could not save the route.");
      return;
    }
    setFormOpen(false);
    refetch();
  }

  async function remove(route: BusRoute) {
    if (!confirm(`Delete Route ${route.routeNumber} (${route.name})?`)) return;
    setListError("");
    const response = await fetch(`/api/admin/transport/routes/${route.id}`, { method: "DELETE", credentials: "include" });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      setListError(result.error ?? "Could not delete the route.");
      return;
    }
    refetch();
  }

  async function openPassengers(route: BusRoute) {
    setPassengersFor(route);
    setPassengers(null);
    const response = await fetch(`/api/admin/transport/routes/${route.id}`, { credentials: "include" });
    const result = response.ok ? await response.json() : { passengers: [] };
    setPassengers(result.passengers ?? []);
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Breadcrumb items={[{ label: "Transport" }]} />
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transport</h1>
          <p className="text-sm text-gray-500 mt-1">Bus routes students can book. Fee changes apply to new bookings only.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          <Plus size={16} /> Add route
        </button>
      </div>

      {listError && <p className="text-xs text-red-500 mb-3">{listError}</p>}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-sm text-gray-400">Loading…</div>
        ) : routes.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center gap-4 min-h-[300px]">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Bus size={26} className="text-gray-400" />
            </div>
            <p className="font-semibold text-gray-500">No bus routes yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Route", "Stops", "Yearly fee", "Seats", "Status", ""].map((heading) => (
                    <th key={heading} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {routes.map((route) => (
                  <tr key={route.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800">Route {route.routeNumber}</p>
                      <p className="text-xs text-gray-500">{route.name}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 max-w-xs">
                      {route.stops.map((stop) => `${stop.name} (${formatPickupTime(stop.pickupTime)})`).join(" → ")}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{formatRupees(route.annualFee)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => openPassengers(route)} className="text-orange-600 hover:underline font-medium">
                        {route.bookedSeats}/{route.capacity}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${route.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {route.active ? "Open" : "Off"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={() => openEdit(route)} className="text-xs font-medium text-orange-600 hover:text-orange-700 mr-3">Edit</button>
                      <button onClick={() => remove(route)} className="text-xs text-red-500 hover:text-red-600">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {formOpen && (
        <Modal
          title={editingId ? `Edit Route ${form.routeNumber}` : "Add bus route"}
          onClose={() => setFormOpen(false)}
          maxWidth="max-w-xl"
          panelClassName="max-h-[90vh] overflow-y-auto"
          headerClassName="sticky top-0 bg-white"
          portal
        >
          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <label className="text-xs font-medium text-gray-600 col-span-1">
                Route no.
                <input value={form.routeNumber} onChange={(e) => setForm({ ...form, routeNumber: e.target.value })} className={`${inputClass} mt-1`} placeholder="7" />
              </label>
              <label className="text-xs font-medium text-gray-600 col-span-2">
                Name
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`${inputClass} mt-1`} placeholder="Guntur – Brodipet" />
              </label>
              <label className="text-xs font-medium text-gray-600 col-span-2">
                Yearly fee (₹)
                <input type="number" min={0} value={form.annualFee} onChange={(e) => setForm({ ...form, annualFee: e.target.value })} className={`${inputClass} mt-1`} />
              </label>
              <label className="text-xs font-medium text-gray-600">
                Seats
                <input type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className={`${inputClass} mt-1`} />
              </label>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Stops (in order)</p>
              <div className="space-y-2">
                {form.stops.map((stop, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-5 text-right">{index + 1}</span>
                    <input
                      value={stop.name}
                      onChange={(e) => updateStop(index, "name", e.target.value)}
                      placeholder="Stop name"
                      aria-label={`Stop ${index + 1} name`}
                      className={inputClass}
                    />
                    <input
                      type="time"
                      value={stop.pickupTime}
                      onChange={(e) => updateStop(index, "pickupTime", e.target.value)}
                      aria-label={`Stop ${index + 1} pickup time`}
                      className={`${inputClass} w-32`}
                    />
                    <button
                      onClick={() => setForm((prev) => ({ ...prev, stops: prev.stops.filter((_, i) => i !== index) }))}
                      disabled={form.stops.length === 1}
                      className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-30"
                      aria-label={`Remove stop ${index + 1}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setForm((prev) => ({ ...prev, stops: [...prev.stops, { name: "", pickupTime: prev.stops[prev.stops.length - 1]?.pickupTime ?? "07:30" }] }))}
                className="mt-2 text-xs font-medium text-orange-600 hover:text-orange-700"
              >
                + Add stop
              </button>
            </div>

            {editingId && (
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="accent-orange-600" />
                Open for booking (switching off hides it from students; current bookings stay)
              </label>
            )}

            {formError && <p className="text-xs text-red-500">{formError}</p>}
          </div>
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 sticky bottom-0 bg-white">
            <button onClick={() => setFormOpen(false)} className="text-sm text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100">Cancel</button>
            <button
              onClick={save}
              disabled={saving}
              className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-5 py-2 rounded-lg disabled:opacity-60"
            >
              {saving ? "Saving…" : editingId ? "Save changes" : "Add route"}
            </button>
          </div>
        </Modal>
      )}

      {passengersFor && (
        <Modal
          title={`Route ${passengersFor.routeNumber} · passengers`}
          subtitle={`${passengersFor.bookedSeats} of ${passengersFor.capacity} seats booked`}
          onClose={() => setPassengersFor(null)}
          maxWidth="max-w-xl"
          panelClassName="max-h-[90vh] overflow-y-auto"
          headerClassName="sticky top-0 bg-white"
          portal
        >
          <div className="px-6 py-5">
            {passengers === null ? (
              <p className="text-center text-sm text-gray-400 py-6">Loading…</p>
            ) : passengers.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-6">No one has booked this route yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100">
                  <tr>
                    {["Student", "Class", "Stop"].map((heading) => (
                      <th key={heading} className="py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {passengers.map((passenger) => (
                    <tr key={passenger.id}>
                      <td className="py-2">
                        <p className="font-medium text-gray-800">{passenger.name}</p>
                        <p className="text-xs text-gray-500">{passenger.rollNumber}</p>
                      </td>
                      <td className="py-2 text-gray-600">{passenger.className}</td>
                      <td className="py-2 text-gray-600">{passenger.stopName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
