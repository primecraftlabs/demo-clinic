"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { Doctor } from "@/lib/booking";
import { doctorStore, settingsStore } from "@/services";

// "Now", read once in the browser. The server prerender gets null, so time-based UI renders after hydration.
let clientNow: Date | null = null;
const getNow = () => (clientNow ??= new Date());
const getServerNow = () => null;
const subscribe = () => () => {};

export function useNow(): Date | null {
  return useSyncExternalStore(subscribe, getNow, getServerNow);
}

// Published doctors, fetched once per page load and shared by every component that needs them.
let published: Promise<Doctor[]> | null = null;

export type DoctorsState = { doctors: Doctor[] | null; failed: boolean };

export function usePublishedDoctors(): DoctorsState {
  const [state, setState] = useState<DoctorsState>({ doctors: null, failed: false });
  useEffect(() => {
    let cancelled = false;
    published ??= doctorStore().then((s) => s.listPublished());
    published.then(
      (doctors) => !cancelled && setState({ doctors, failed: false }),
      () => {
        published = null; // allow a retry on the next visit
        if (!cancelled) setState({ doctors: [], failed: true });
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);
  return state;
}

// Clinic-wide holidays, fetched once per page load (empty list if they can't be loaded).
let holidaysPromise: Promise<string[]> | null = null;

/** null while loading, then the clinic's holiday dates (YYYY-MM-DD). */
export function useClinicHolidays(): string[] | null {
  const [holidays, setHolidays] = useState<string[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    holidaysPromise ??= settingsStore()
      .then((s) => s.get())
      .then((s) => s.holidays)
      .catch(() => {
        holidaysPromise = null;
        return [];
      });
    holidaysPromise.then((h) => !cancelled && setHolidays(h));
    return () => {
      cancelled = true;
    };
  }, []);
  return holidays;
}
