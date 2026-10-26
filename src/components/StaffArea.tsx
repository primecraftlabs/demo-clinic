"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import type { Doctor } from "@/lib/booking";
import {
  type BookingStore,
  type DoctorStore,
  type LiveServices,
  type StaffAuth,
  type StaffUser,
  type TeamAdmin,
  liveServices,
  onlineBookingAvailable,
  previewServices,
} from "@/services";
import { Dashboard } from "./Dashboard";
import { DoctorsAdmin } from "./DoctorsAdmin";
import { useNow } from "./hooks";
import { Icon } from "./Icons";
import { ProfileEditor } from "./ProfileEditor";
import { DoctorAvatar, Notice, hoursLabel, workingDays } from "./ui";

type AdminTab = "appointments" | "doctors";

/** /dashboard/: staff sign in and see the view for their role. ?preview = admin view with sample data;
 *  ?tab=doctors opens the doctors tab (handy for links and screenshots). */
export function StaffArea() {
  const params = useSearchParams();
  const tab: AdminTab = params.get("tab") === "doctors" ? "doctors" : "appointments";
  if (params.has("preview") || !onlineBookingAvailable) return <Preview tab={tab} />;
  return <LiveArea tab={tab} />;
}

function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string }[]; value: T; onChange: (id: T) => void }) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto rounded-2xl border border-line bg-surface p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition ${value === t.id ? "bg-brand text-on-brand" : "text-muted hover:bg-bg-alt"}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function useAllDoctors(store: DoctorStore): Doctor[] | null {
  const [doctors, setDoctors] = useState<Doctor[] | null>(null);
  useEffect(() => store.watchAll(setDoctors, () => setDoctors([])), [store]);
  return doctors;
}

function AdminView({
  bookings,
  doctors: doctorStore,
  team,
  preview,
  initialTab,
}: {
  bookings: BookingStore;
  doctors: DoctorStore;
  team: TeamAdmin;
  preview: boolean;
  initialTab: AdminTab;
}) {
  const [tab, setTab] = useState<AdminTab>(initialTab);
  const doctors = useAllDoctors(doctorStore);
  if (!doctors) return <p className="text-muted">Loading…</p>;
  return (
    <div className="space-y-6">
      <Tabs
        tabs={[
          { id: "appointments", label: "Appointments" },
          { id: "doctors", label: `Doctors (${doctors.length})` },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === "appointments" ? (
        <Dashboard store={bookings} scope={{}} doctors={doctors} cleanUp={!preview} />
      ) : (
        <DoctorsAdmin doctors={doctors} store={doctorStore} team={team} preview={preview} />
      )}
    </div>
  );
}

function DoctorView({ services, doctorId }: { services: LiveServices; doctorId: string }) {
  const [tab, setTab] = useState<"appointments" | "profile">("appointments");
  const [doctor, setDoctor] = useState<Doctor | null | undefined>(undefined);
  useEffect(() => services.doctors.watchOne(doctorId, setDoctor, () => setDoctor(null)), [services, doctorId]);

  if (doctor === undefined) return <p className="text-muted">Loading…</p>;
  if (doctor === null) return <Notice>Your doctor profile wasn&apos;t found. Please ask the clinic admin.</Notice>;
  return (
    <div className="space-y-6">
      <Tabs
        tabs={[
          { id: "appointments", label: "My appointments" },
          { id: "profile", label: "My profile" },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === "appointments" ? (
        <Dashboard store={services.bookings} scope={{ doctorId }} doctors={[doctor]} />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4 rounded-2xl bg-bg-alt p-5">
            <DoctorAvatar doctor={doctor} size="size-14 text-lg" />
            <div className="text-sm">
              <p className="font-semibold">{doctor.active ? "Your profile is live on the website." : "Your profile is hidden until the clinic publishes it."}</p>
              <p className="text-muted">
                Consultation schedule (set by the clinic): {workingDays(doctor)}, {hoursLabel(doctor)}, {doctor.slotMinutes}-minute appointments.
              </p>
            </div>
          </div>
          <ProfileEditor key={doctor.id} doctor={doctor} canEditSchedule={false} onSave={(patch) => services.doctors.update(doctor.id, patch)} />
        </div>
      )}
    </div>
  );
}

function Preview({ tab }: { tab: AdminTab }) {
  const now = useNow();
  const services = useMemo(() => (now ? previewServices(now) : null), [now]);
  if (!services) return <p className="text-muted">Loading…</p>;
  return (
    <div className="space-y-6">
      <Notice>
        Preview with sample data: this is what the clinic admin sees. Changes here are not saved. Staff{" "}
        <Link href="/dashboard/" className="font-semibold underline">
          sign in
        </Link>{" "}
        to see real bookings.
      </Notice>
      <AdminView bookings={services.bookings} doctors={services.doctors} team={services.team} preview initialTab={tab} />
    </div>
  );
}

function SignedInBar({ user, auth, children }: { user: StaffUser; auth: StaffAuth; children: ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4">
        <p className="text-sm text-muted">
          Signed in as <span className="font-semibold break-all text-fg">{user.email}</span>
          {user.role && <span className="ml-2 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand-strong">{user.role === "owner" ? "Clinic admin" : "Doctor"}</span>}
        </p>
        <button
          type="button"
          onClick={() => auth.signOut()}
          className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-semibold hover:bg-bg-alt"
        >
          <Icon name="logout" className="size-4" /> Sign out
        </button>
      </div>
      {children}
    </div>
  );
}

function LiveArea({ tab }: { tab: AdminTab }) {
  const [services, setServices] = useState<LiveServices | null>(null);
  const [user, setUser] = useState<StaffUser | null | undefined>(undefined);

  useEffect(() => {
    let stop: (() => void) | undefined;
    let cancelled = false;
    liveServices().then((s) => {
      if (cancelled) return;
      setServices(s);
      stop = s.auth.watch(setUser);
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);

  if (!services || user === undefined) return <p className="text-muted">Loading…</p>;
  if (!user) return <SignIn auth={services.auth} />;
  return (
    <SignedInBar user={user} auth={services.auth}>
      {user.role === "owner" && <AdminView bookings={services.bookings} doctors={services.doctors} team={services.team} preview={false} initialTab={tab} />}
      {user.role === "doctor" && user.doctorId && <DoctorView services={services} doctorId={user.doctorId} />}
      {!user.role && <Notice>This account doesn&apos;t have access to the clinic dashboard. Please ask the clinic admin.</Notice>}
    </SignedInBar>
  );
}

function SignIn({ auth }: { auth: StaffAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setInfo("");
    try {
      await auth.signIn(email, password);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function forgot() {
    setError("");
    if (!email.trim()) return setError("Enter your email first, then tap “Forgot password”.");
    try {
      await auth.sendPasswordReset(email);
    } catch {
      // Same message either way, so the form doesn't reveal which emails have accounts.
    }
    setInfo("If this email has an account, a link to set a new password is on its way.");
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-line bg-surface p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <Icon name="lock" className="size-5 text-brand" /> Staff sign in
        </h2>
        <p className="text-sm text-muted">For the clinic admin and our doctors.</p>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold">Email</label>
          <input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-line px-4 py-3" />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-semibold">Password</label>
          <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-line px-4 py-3" />
        </div>
        {error && <p role="alert" className="text-sm font-medium text-danger">{error}</p>}
        {info && <p role="status" className="text-sm font-medium text-brand">{info}</p>}
        <button type="submit" disabled={busy} className="w-full rounded-xl bg-brand px-5 py-3 font-semibold text-on-brand hover:bg-brand-strong disabled:opacity-60">
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <button type="button" onClick={forgot} className="w-full text-sm font-semibold text-brand hover:underline">
          Forgot password? / First time signing in?
        </button>
      </form>
      <div className="rounded-2xl bg-bg-alt p-6">
        <h2 className="text-lg font-bold">Not clinic staff?</h2>
        <p className="mt-2 text-muted">
          See how the clinic runs on it with sample data: today&apos;s appointments, managing doctors and their leave, one-tap status updates.
        </p>
        <Link href="/dashboard/?preview" className="mt-5 inline-block rounded-xl border border-line bg-surface px-5 py-3 font-semibold hover:bg-surface/70">
          Open the preview
        </Link>
      </div>
    </div>
  );
}
