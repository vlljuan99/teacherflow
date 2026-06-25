import { cn } from "@/lib/utils";

/**
 * English Odyssey brand mark — a bowler-hatted gentleman with round
 * spectacles and a handlebar moustache. Renders in `currentColor`, so set
 * the colour via a text-* class (defaults to the crimson primary).
 */
export function OdysseyMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={cn("text-primary", className)}
      aria-hidden
    >
      {/* hat brim + dome */}
      <ellipse cx="24" cy="17.5" rx="17" ry="3.1" fill="currentColor" />
      <path d="M12 17.2C12 7.6 36 7.6 36 17.2Z" fill="currentColor" />
      {/* spectacles */}
      <circle cx="17.6" cy="29.2" r="5" stroke="currentColor" strokeWidth="2.4" />
      <circle cx="30.4" cy="29.2" r="5" stroke="currentColor" strokeWidth="2.4" />
      <path
        d="M22.6 28.6h2.8"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* handlebar moustache */}
      <path
        d="M12.8 37.4c4-1.6 8-0.6 11.2 1.6 3.2-2.2 7.2-3.2 11.2-1.6-3.6 5.2-8.2 3.7-11.2 2-3 1.7-7.6 3.2-11.2-2Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Full lock-up: brand mark + serif wordmark. Used in the sidebar and login.
 */
export function OdysseyLogo({
  className,
  markClassName,
  wordClassName,
}: {
  className?: string;
  markClassName?: string;
  wordClassName?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <OdysseyMark className={cn("h-8 w-8 shrink-0", markClassName)} />
      <span
        className={cn(
          "font-serif text-[17px] font-bold leading-none tracking-tight text-primary",
          wordClassName,
        )}
      >
        English <span className="font-extrabold">Odyssey</span>
      </span>
    </div>
  );
}
