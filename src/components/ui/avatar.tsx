import Image from "next/image";
import { cn } from "@/lib/utils";

const SIZES = {
  xs: { box: "h-6 w-6", text: "text-[10px]" },
  sm: { box: "h-8 w-8", text: "text-xs" },
  md: { box: "h-10 w-10", text: "text-sm" },
  lg: { box: "h-16 w-16", text: "text-base" },
  xl: { box: "h-24 w-24", text: "text-xl" },
} as const;

const GRADIENTS = [
  "from-violet-400 to-fuchsia-500",
  "from-sky-400 to-indigo-500",
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-rose-400 to-pink-500",
  "from-cyan-400 to-blue-500",
  "from-lime-400 to-green-500",
  "from-purple-400 to-violet-500",
];

export function gradientFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash << 5) - hash + seed.charCodeAt(i);
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

export function Avatar({
  src,
  name,
  size = "md",
  className,
}: {
  src?: string | null;
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const { box, text } = SIZES[size];
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full ring-2 ring-white shadow-sm",
        box,
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          sizes="96px"
          className="object-cover"
          unoptimized
        />
      ) : (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center bg-gradient-to-br font-semibold text-white",
            gradientFor(name),
            text,
          )}
        >
          {initials || "?"}
        </div>
      )}
    </div>
  );
}
