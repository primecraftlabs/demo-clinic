import Image from "next/image";
import { photo, photoSrc } from "@/config/photos";

/**
 * An Unsplash photo for a slot from photos.json. Until the photo exists, shows a warm gradient tile
 * so the layout never breaks. Always fills its (positioned) parent.
 */
export function Photo({
  slot,
  width,
  height,
  className = "",
  sizes = "100vw",
  preload = false,
  fallback = "from-brand-soft to-bg-alt",
}: {
  slot: string;
  width: number;
  height?: number;
  className?: string;
  sizes?: string;
  preload?: boolean;
  fallback?: string;
}) {
  const p = photo(slot);
  if (!p) return <div aria-hidden="true" className={`absolute inset-0 bg-linear-to-br ${fallback} ${className}`} />;
  return (
    <Image
      src={photoSrc(p, width, height)}
      alt={p.alt}
      fill
      sizes={sizes}
      preload={preload}
      unoptimized
      className={`object-cover ${className}`}
      style={{ backgroundColor: p.color }}
    />
  );
}
