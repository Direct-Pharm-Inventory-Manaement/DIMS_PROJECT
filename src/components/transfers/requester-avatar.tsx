import { InitialsAvatar } from "@/components/ui/initials-avatar";

export function RequesterAvatar({ name }: { name: string }) {
  return <InitialsAvatar name={name} size="sm" />;
}
