// Draws a doctor's avatar from its seed (see src/config/avatars.ts). Same seed -> same picture, everywhere.
import { createAvatar } from "@dicebear/core";
import * as notionists from "@dicebear/notionists";

const cache = new Map<string, string>();

export function avatarDataUri(seed: string): string {
  let uri = cache.get(seed);
  if (!uri) {
    uri = createAvatar(notionists, { seed }).toDataUri();
    cache.set(seed, uri);
  }
  return uri;
}

/** Seeds for one page of the avatar picker, unique per doctor. */
export function avatarChoices(doctorId: string, page: number, count: number): string[] {
  return Array.from({ length: count }, (_, i) => `${doctorId}-${page}-${i}`.slice(0, 60));
}
