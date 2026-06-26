"use client";

import { useState } from "react";
import { OdysseyMark } from "@/components/brand/odyssey-logo";

/**
 * Avatar for the header. Shows the user's photo, and falls back to the
 * English Odyssey mark when there's no photo or the image fails to load.
 */
export function HeaderAvatar({
  src,
  alt,
}: {
  src?: string | null;
  alt: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 ring-1 ring-border">
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src as string}
          alt={alt}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <OdysseyMark className="h-5 w-5" />
      )}
    </span>
  );
}
