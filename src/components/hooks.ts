"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { Doctor } from "@/lib/booking";
import { doctorStore } from "@/services";

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
