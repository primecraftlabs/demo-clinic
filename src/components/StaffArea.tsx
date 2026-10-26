"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  type BookingStore,
  type StaffAuth,
  type StaffUser,
  liveBookingStore,
  liveStaffAuth,
  onlineBookingAvailable,
  previewBookingStore,
} from "@/services";
import { Dashboard } from "./Dashboard";
import { useNow } from "./hooks";
import { Icon } from "./Icons";
import { Notice } from "./ui";

/** /dashboard/: staff sign in to the live dashboard; ?preview shows the same dashboard with sample data. */
export function StaffArea() {
  const preview = useSearchParams().has("preview");
  if (preview || !onlineBookingAvailable) return <Preview />;
  return <LiveArea />;
}

function Preview() {
  const now = useNow();
  const store = useMemo(() => (now ? previewBookingStore(now) : null), [now]);
  if (!store) return <p className="text-muted">Loading…</p>;
  return (
    <div className="space-y-6">
      <Notice>
        Preview with sample patients. Changes here are not saved. Clinic staff{" "}
        <Link href="/dashboard/" className="font-semibold underline">sign in</Link> to see real bookings.
      </Notice>
      <Dashboard store={store} />
    </div>
  );
}

type Live = { auth: StaffAuth; store: BookingStore };

function LiveArea() {
  const [live, setLive] = useState<Live | null>(null);
  const [user, setUser] = useState<StaffUser | null | undefined>(undefined);

  useEffect(() => {
    let stop: (() => void) | undefined;
    let cancelled = false;
    Promise.all([liveStaffAuth(), liveBookingStore()]).then(([auth, store]) => {
      if (cancelled) return;
      setLive({ auth, store });
      stop = auth.watch(setUser);
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);

  if (!live || user === undefined) return <p className="text-muted">Loading…</p>;
  if (!user) return <SignIn auth={live.auth} />;
  if (!user.isStaff) {
    return (
      <div className="max-w-md space-y-4">
        <Notice>{`${user.email} is not on the clinic staff list.`}</Notice>
        <button type="button" onClick={() => live.auth.signOut()} className="rounded-xl border border-line px-4 py-2.5 font-semibold hover:bg-bg-alt">
          Sign out
        </button>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4">
        <p className="text-sm text-muted">
          Signed in as <span className="font-semibold text-fg">{user.email}</span>
        </p>
        <button
          type="button"
          onClick={() => live.auth.signOut()}
          className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-semibold hover:bg-bg-alt"
        >
          <Icon name="logout" className="size-4" /> Sign out
        </button>
      </div>
      <Dashboard store={live.store} cleanUp />
    </div>
  );
}

function SignIn({ auth }: { auth: StaffAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await auth.signIn(email, password);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-line bg-surface p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <Icon name="lock" className="size-5 text-brand" /> Staff sign in
        </h2>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold">Email</label>
          <input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-line px-4 py-3" />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-semibold">Password</label>
          <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-line px-4 py-3" />
        </div>
        {error && <p role="alert" className="text-sm font-medium text-danger">{error}</p>}
        <button type="submit" disabled={busy} className="w-full rounded-xl bg-brand px-5 py-3 font-semibold text-on-brand hover:bg-brand-strong disabled:opacity-60">
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <div className="rounded-2xl bg-bg-alt p-6">
        <h2 className="text-lg font-bold">Not clinic staff?</h2>
        <p className="mt-2 text-muted">See how the dashboard works with sample patients: today&apos;s list, upcoming visits and one-tap status updates.</p>
        <Link href="/dashboard/?preview" className="mt-5 inline-block rounded-xl border border-line bg-surface px-5 py-3 font-semibold hover:bg-surface/70">
          Open the preview
        </Link>
      </div>
    </div>
  );
}
