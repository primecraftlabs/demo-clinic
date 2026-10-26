"use client";

import { useSyncExternalStore } from "react";

// "Now", read once in the browser. The server prerender gets null, so time-based UI renders after hydration.
let clientNow: Date | null = null;
const getNow = () => (clientNow ??= new Date());
const getServerNow = () => null;
const subscribe = () => () => {};

export function useNow(): Date | null {
  return useSyncExternalStore(subscribe, getNow, getServerNow);
}
