"use client";

import { useEffect, useState, type FormEvent } from "react";
import { starterDoctors } from "@/data/doctors";
import type { Doctor } from "@/lib/booking";
import { doctorIdFromName, newDoctor } from "@/lib/doctors";
import { DoctorExistsError, InviteError, type DoctorStore, type TeamAdmin, type TeamMember } from "@/services";
import { Icon } from "./Icons";
import { ProfileEditor } from "./ProfileEditor";
import { DoctorAvatar, Notice, hoursLabel, workingDays } from "./ui";

const input = "w-full rounded-xl border border-line bg-surface px-4 py-3";
const smallButton = "rounded-lg border border-line px-3 py-1.5 text-sm font-medium hover:bg-bg-alt disabled:opacity-50";

/** Admin: the clinic's doctors - add, invite, edit, publish/hide, remove access. Works with live or sample stores. */
export function DoctorsAdmin({ doctors, store, team, preview }: { doctors: Doctor[]; store: DoctorStore; team: TeamAdmin; preview: boolean }) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => team.watchMembers(setMembers, () => setMessage("Couldn't load doctor logins.")), [team]);

  async function run(action: () => Promise<void>, done: string) {
    try {
      await action();
      setMessage(done);
    } catch (e) {
      setMessage(e instanceof InviteError || e instanceof DoctorExistsError ? e.message : "Something went wrong. Please try again.");
    }
  }

  async function importStarters() {
    await run(async () => {
      for (const d of starterDoctors) await store.create(d);
    }, `Added ${starterDoctors.length} starter doctors.`);
  }

  const editingDoctor = doctors.find((d) => d.id === editing);
  if (editingDoctor) {
    return (
      <div className="space-y-6">
        <button type="button" onClick={() => setEditing(null)} className="inline-flex items-center gap-2 font-semibold text-brand">
          <Icon name="arrow" className="size-4 rotate-180" /> All doctors
        </button>
        <h2 className="text-2xl font-bold">{editingDoctor.name}</h2>
        <ProfileEditor key={editingDoctor.id} doctor={editingDoctor} canEditSchedule onSave={(patch) => store.update(editingDoctor.id, patch)} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {preview && <Notice>Preview: invites are listed here but no email is sent, and nothing is saved.</Notice>}
      <AddDoctor doctors={doctors} store={store} onDone={setMessage} />
      <p aria-live="polite" className="min-h-6 text-sm font-medium text-brand">
        {message}
      </p>

      {doctors.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-8 text-center">
          <p className="text-lg font-semibold">No doctors yet</p>
          <p className="mt-1 text-muted">Add your first doctor above, or start with the four starter doctors (you can edit or hide them later).</p>
          <button type="button" onClick={importStarters} className="mt-5 rounded-xl bg-brand px-5 py-3 font-semibold text-on-brand hover:bg-brand-strong">
            Add the starter doctors
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {doctors.map((d, i) => {
            const login = members.find((m) => m.doctorId === d.id);
            return (
              <li key={d.id} className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4 lg:flex-row lg:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <DoctorAvatar doctor={d} index={i} size="size-12 text-base" />
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {d.name}{" "}
                      <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold ${d.active ? "bg-brand-soft text-brand-strong" : "bg-bg-alt text-muted"}`}>
                        {d.active ? "Published" : "Hidden"}
                      </span>
                    </p>
                    <p className="text-sm text-muted">
                      {d.speciality} · {workingDays(d)} · {hoursLabel(d)}
                    </p>
                    <p className="text-sm break-all text-muted">{login ? `Login: ${login.email}` : "No login yet"}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={smallButton} onClick={() => setEditing(d.id)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className={smallButton}
                    onClick={() => run(() => store.update(d.id, { active: !d.active }), `${d.name} is now ${d.active ? "hidden" : "published"}.`)}
                  >
                    {d.active ? "Hide" : "Publish"}
                  </button>
                  {login ? (
                    <button
                      type="button"
                      className={`${smallButton} text-danger`}
                      onClick={() =>
                        window.confirm(`Remove ${login.email}'s access to the dashboard?`) &&
                        run(() => team.revoke(login.uid), `${d.name} can no longer sign in.`)
                      }
                    >
                      Remove access
                    </button>
                  ) : (
                    <InviteButton doctor={d} team={team} onDone={setMessage} />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function AddDoctor({ doctors, store, onDone }: { doctors: Doctor[]; store: DoctorStore; onDone: (m: string) => void }) {
  const [name, setName] = useState("");
  const [speciality, setSpeciality] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const id = doctorIdFromName(name);
    if (id.length < 2 || !speciality.trim()) return onDone("Please enter the doctor's name and speciality.");
    setBusy(true);
    try {
      await store.create(newDoctor(name, speciality, doctors.length));
      onDone(`${name.trim()} added (hidden). Click Edit to set their schedule, then Publish. Use Invite to give them a login.`);
      setName("");
      setSpeciality("");
    } catch (err) {
      onDone(err instanceof DoctorExistsError ? err.message : "Couldn't add the doctor. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 rounded-2xl border border-line bg-surface p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <div>
        <label htmlFor="new-name" className="mb-1.5 block text-sm font-semibold">Doctor&apos;s name</label>
        <input id="new-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. Priya Nair" className={input} />
      </div>
      <div>
        <label htmlFor="new-spec" className="mb-1.5 block text-sm font-semibold">Speciality</label>
        <input id="new-spec" value={speciality} onChange={(e) => setSpeciality(e.target.value)} placeholder="ENT Specialist" className={input} />
      </div>
      <button type="submit" disabled={busy} className="rounded-xl bg-brand px-5 py-3 font-semibold text-on-brand hover:bg-brand-strong disabled:opacity-60">
        Add doctor
      </button>
    </form>
  );
}

function InviteButton({ doctor, team, onDone }: { doctor: Doctor; team: TeamAdmin; onDone: (m: string) => void }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await team.invite(email, doctor.id);
      onDone(`Invite sent to ${email}. They'll get an email to set their password, then sign in here.`);
      setOpen(false);
      setEmail("");
    } catch (err) {
      onDone(err instanceof InviteError ? err.message : "Couldn't send the invite.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className={smallButton} onClick={() => setOpen(true)}>
        Invite to sign in
      </button>
    );
  }
  return (
    <form onSubmit={send} className="flex w-full flex-wrap gap-2 sm:w-auto">
      <label htmlFor={`invite-${doctor.id}`} className="sr-only">
        {doctor.name}&apos;s email
      </label>
      <input
        id={`invite-${doctor.id}`}
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="doctor@email.com"
        className="min-w-0 flex-1 rounded-lg border border-line px-3 py-1.5 text-sm"
      />
      <button type="submit" disabled={busy} className={`${smallButton} border-brand bg-brand text-on-brand hover:bg-brand-strong`}>
        {busy ? "Sending…" : "Send invite"}
      </button>
      <button type="button" className={smallButton} onClick={() => setOpen(false)}>
        Cancel
      </button>
    </form>
  );
}
