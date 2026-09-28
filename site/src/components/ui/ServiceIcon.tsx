import {
  Stethoscope, Sparkles, Wind, Scissors, UserRound, Sparkle, Droplet, Leaf, ShieldCheck
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Stethoscope, Sparkles, Wind, Scissors, UserRound, Sparkle, Droplet, Leaf, ShieldCheck
};

export default function ServiceIcon({ name, size = 22 }: { name: string; size?: number }) {
  const Icon = iconMap[name] ?? Sparkles;
  return <Icon size={size} />;
}
