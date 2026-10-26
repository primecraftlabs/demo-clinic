"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clinic } from "@/config/clinic";
import { Icon } from "./Icons";

/** Phones only: booking and WhatsApp always one tap away (hidden where it would get in the way). */
const hiddenOn = ["/book", "/dashboard"];

export function MobileBookBar() {
  const pathname = usePathname();
  if (hiddenOn.some((p) => pathname.startsWith(p))) return null;
  return (
    <>
      <div className="h-20 md:hidden" aria-hidden="true" />
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex gap-3">
          <Link href="/book/" className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 font-semibold text-on-brand">
            <Icon name="calendar" /> Book appointment
          </Link>
          <a
            href={clinic.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp us"
            className="grid size-12 shrink-0 place-items-center rounded-xl border border-line text-brand"
          >
            <Icon name="whatsapp" className="size-6" />
          </a>
        </div>
      </div>
    </>
  );
}
