import { cn } from '@/lib/utils';
import { initialsOf } from '../format';

const tones = [
  'bg-gradient-to-br from-navy-900 to-navy-700 text-white',
  'bg-gradient-to-br from-aqua-800 to-aqua-700 text-white',
  'bg-gold-soft text-gold-foreground ring-1 ring-gold/50',
  'bg-gradient-to-br from-navy-100 to-navy-200 text-navy-900',
  'bg-gradient-to-br from-aqua-50 to-aqua-100 text-aqua-800 ring-1 ring-aqua-300/60',
  'bg-gradient-to-br from-navy-50 to-navy-100 text-navy-800 ring-1 ring-navy-200'
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
