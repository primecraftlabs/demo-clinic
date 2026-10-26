import type { Metadata } from "next";
import { Photo } from "@/components/Photo";
import { avatarCredit } from "@/config/avatars";
import { allPhotos, unsplashUrl } from "@/config/photos";
import { gallery, photoLabels } from "@/config/clinic";

export const metadata: Metadata = { title: "Photo credits" };

function labelFor(slot: string) {
  return gallery.find((g) => g.slot === slot)?.label ?? photoLabels[slot] ?? slot;
}

export default function CreditsPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="text-4xl font-bold sm:text-5xl">Photo credits</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Photos on this website come from{" "}
        <a href={unsplashUrl} className="font-semibold text-brand underline underline-offset-2">
          Unsplash
        </a>
        . Thank you to the photographers below.
      </p>
      <p className="mt-2 max-w-2xl text-muted">
        <a href={avatarCredit.url} className="underline underline-offset-2 hover:text-fg">
          {avatarCredit.text}
        </a>
      </p>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {allPhotos.map(([slot, p]) => (
          <li key={slot} className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-3">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-xl">
              <Photo slot={slot} width={128} height={128} sizes="64px" />
            </div>
            <div className="min-w-0 text-sm">
              <p className="font-semibold">{labelFor(slot)}</p>
              <p className="text-muted [overflow-wrap:anywhere]">
                <a href={p.photoUrl} className="underline underline-offset-2 hover:text-fg">Photo</a> by{" "}
                <a href={p.photographerUrl} className="underline underline-offset-2 hover:text-fg">{p.photographer}</a> on Unsplash
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
