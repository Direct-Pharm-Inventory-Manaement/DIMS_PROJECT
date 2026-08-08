/** Validated categorical set (dataviz skill), reused here as avatar background tints. */
const AVATAR_COLORS = [
  "bg-brand-500",
  "bg-[#eb6834]",
  "bg-[#1baf7a]",
  "bg-[#eda100]",
  "bg-[#e87ba4]",
  "bg-[#4a3aa7]",
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

const SIZE_CLASS = {
  sm: "h-7 w-7 text-[11px]",
  md: "h-10 w-10 text-sm",
} as const;

export function InitialsAvatar({
  name,
  size = "sm",
}: {
  name: string;
  size?: keyof typeof SIZE_CLASS;
}) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${SIZE_CLASS[size]} ${colorFor(name)}`}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
