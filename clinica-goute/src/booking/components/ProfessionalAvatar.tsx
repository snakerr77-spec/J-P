import { cn } from '@/lib/utils';
import { initialsOf } from '../format';

const tones = [
  'bg-gradient-to-br from-brand-900 to-brand-700 text-white',
  'bg-gradient-to-br from-leaf-800 to-leaf-700 text-white',
  'bg-coral-soft text-coral-foreground ring-1 ring-coral/50',
  'bg-gradient-to-br from-brand-100 to-brand-200 text-brand-900',
  'bg-gradient-to-br from-leaf-50 to-leaf-100 text-leaf-800 ring-1 ring-leaf-300/60',
  'bg-gradient-to-br from-brand-50 to-brand-100 text-brand-800 ring-1 ring-brand-200'
];

const sizes = { sm: 'size-10 text-sm', md: 'size-14 text-lg', lg: 'size-20 text-2xl' };

type Props = { name: string; tone: number; size?: keyof typeof sizes; className?: string };

export default function ProfessionalAvatar({ name, tone, size = 'md', className }: Props) {
  return (
    <span
      aria-hidden="true"
      className={cn('grid shrink-0 place-items-center rounded-full font-display font-semibold tracking-tight shadow-sm', tones[tone % tones.length], sizes[size], className)}
    >
      {initialsOf(name)}
    </span>
  );
}
