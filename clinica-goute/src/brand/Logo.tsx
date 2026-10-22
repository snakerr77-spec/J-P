import { cn } from '@/lib/utils';

type Props = { className?: string; tone?: 'dark' | 'light'; compact?: boolean };

/** Marca provisória da Clínica Goute (gota + ponto coral). Troque pela identidade oficial quando houver. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn('size-9 shrink-0', className)} aria-hidden="true">
      <rect width="40" height="40" rx="11" fill="#0f4c3a" />
      <path d="M20 7.5c0 0-8.5 9.3-8.5 15.2a8.5 8.5 0 0 0 17 0C28.5 16.8 20 7.5 20 7.5Z" fill="#faf7f2" />
      <circle cx="23.6" cy="24.4" r="2.6" fill="#e8734f" />
    </svg>
  );
}

export default function Logo({ className, tone = 'dark', compact = false }: Props) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className={cn('text-[0.62rem] font-bold tracking-[0.22em] uppercase', tone === 'dark' ? 'text-leaf-700' : 'text-leaf-300')}>Clínica</span>
          <span className={cn('font-display text-xl font-semibold tracking-tight', tone === 'dark' ? 'text-brand-900' : 'text-white')}>Goute</span>
        </span>
      )}
      <span className="sr-only">Clínica Goute</span>
    </span>
  );
}
