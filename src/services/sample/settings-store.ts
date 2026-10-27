// SettingsStore in memory for the dashboard preview and sites without Firebase.
import type { ClinicSettings, SettingsStore } from "../types";

export function sampleSettingsStore(initial: ClinicSettings = { holidays: [] }): SettingsStore {
  let settings = initial;
  const listeners = new Set<(s: ClinicSettings) => void>();
  return {
    async get() {
      return settings;
    },
    watch(onChange) {
      listeners.add(onChange);
      onChange(settings);
      return () => listeners.delete(onChange);
    },
    async setHolidays(holidays) {
      settings = { ...settings, holidays };
      listeners.forEach((l) => l(settings));
    },
  };
}
