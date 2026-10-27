"use client";

import { useEffect, useState } from "react";
import { dateKey, formatDate } from "@/lib/booking";
import { cleanLeave } from "@/lib/doctors";
import type { SettingsStore } from "@/services";
import { useNow } from "./hooks";
import { Icon } from "./Icons";
import { Notice } from "./ui";

const input = "w-full rounded-xl border border-line bg-surface px-4 py-3";

/** Admin: clinic-wide settings (holidays when nobody can be booked). */
export function ClinicSettings({ store, preview }: { store: SettingsStore; preview: boolean }) {
  const now = useNow();
  const today = now ? dateKey(now) : "";
  const [holidays, setHolidays] = useState<string[] | null>(null);
  const [newDate, setNewDate] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Live updates, unless the admin has unsaved edits on screen.
  useEffect(
    () =>
      store.watch(
        (s) => {
          if (!dirty) setHolidays(s.holidays);
        },
        () => {
          setHolidays((prev) => prev ?? []);
          setStatus("Couldn't load the clinic settings. Please check your connection.");
        },
      ),
    [store, dirty],
  );

  if (!holidays || !now) return <p className="text-muted">Loading…</p>;
  const shown = cleanLeave(holidays, today);

  function change(next: string[]) {
    setHolidays(cleanLeave(next, today));
    setDirty(true);
    setStatus("");
  }

  function add() {
    if (!newDate) return;
    change([...shown, newDate]);
    setNewDate("");
  }

  async function save() {
    setBusy(true);
    try {
      await store.setHolidays(shown);
      setDirty(false);
      setStatus("Saved.");
    } catch {
      setStatus("Couldn't save. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {preview && <Notice>Preview: you can try adding holidays, but changes aren&apos;t saved.</Notice>}
      <section className="space-y-4 rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <h3 className="text-lg font-bold">Clinic holidays</h3>
        <p className="text-sm text-muted">Patients can&apos;t book these dates for any doctor. Past dates are removed automatically.</p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="holiday-date" className="mb-1.5 block text-sm font-semibold">
              Add a date
            </label>
            <input id="holiday-date" type="date" min={today} value={newDate} onChange={(e) => setNewDate(e.target.value)} className={input} />
          </div>
          <button type="button" onClick={add} disabled={!newDate} className="rounded-xl border border-line px-4 py-3 font-semibold hover:bg-bg-alt disabled:opacity-50">
            Add
          </button>
        </div>
        {shown.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {shown.map((d) => (
              <li key={d} className="flex items-center gap-1 rounded-full bg-bg-alt py-1 pr-1 pl-3 text-sm font-medium">
                {formatDate(d, "short")}
                <button
                  type="button"
                  onClick={() => change(shown.filter((x) => x !== d))}
                  aria-label={`Remove holiday on ${formatDate(d)}`}
                  className="grid size-6 place-items-center rounded-full hover:bg-line"
                >
                  <Icon name="close" className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No clinic holidays planned.</p>
        )}
        <div className="flex flex-wrap items-center gap-4">
          <button type="button" onClick={save} disabled={busy} className="rounded-xl bg-brand px-6 py-3 font-semibold text-on-brand hover:bg-brand-strong disabled:opacity-60">
            {busy ? "Saving…" : "Save holidays"}
          </button>
          <p aria-live="polite" className="text-sm font-medium text-brand">
            {status}
          </p>
        </div>
      </section>
    </div>
  );
}
