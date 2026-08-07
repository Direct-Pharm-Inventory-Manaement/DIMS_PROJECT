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

export function RequesterAvatar({ name }: { name: string }) {
  return (
    <span
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${colorFor(name)}`}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
