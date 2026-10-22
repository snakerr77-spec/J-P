import { useMemo, useState } from 'react';
import { ArrowRight, Building2, CircleCheck, Info, Search, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { nextAvailable } from '../availability';
import ProfessionalAvatar from '../components/ProfessionalAvatar';
import { clinic } from '../config';
import { capitalize, formatBRL, formatShortDate } from '../format';
import type { Appointment, Professional } from '../types';

type Props = {
  professionals: Professional[];
  appointments: Appointment[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

const firstName = (name: string) => name.replace(/^(Dr|Dra)\.?\s+/i, '').split(' ')[0];

export default function ProfessionalStep({ professionals, appointments, selectedId, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [specialty, setSpecialty] = useState('all');

  const available = useMemo(() => professionals.filter(item => item.active), [professionals]);
  const chips = useMemo(
    () => [...new Set(available.map(professional => professional.specialty))].sort((a, b) => a.localeCompare(b, 'pt-BR')).map(label => ({ id: label, label })),
    [available]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pt-BR');
    return available.filter(professional => {
      const haystack = `${professional.name} ${professional.specialty} ${professional.focus.join(' ')}`.toLocaleLowerCase('pt-BR');
      return (specialty === 'all' || professional.specialty === specialty) && (!q || haystack.includes(q));
    });
  }, [available, query, specialty]);

  const next = useMemo(
    () => new Map(available.map(professional => [professional.id, nextAvailable(professional, appointments)])),
    [available, appointments]
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 id="booking-step-heading" tabIndex={-1} className="font-display text-2xl font-semibold tracking-tight outline-none sm:text-3xl">
          Com quem você quer se consultar?
        </h2>
        <p className="mt-1.5 text-muted-foreground">Veja o valor e o próximo horário livre de cada profissional antes de escolher.</p>
      </div>

      {clinic.demoNotice && (
        <p className="flex items-start gap-2.5 rounded-xl border border-coral/40 bg-coral-soft/70 p-3 text-sm text-coral-foreground" role="note">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span><strong>Exemplo de demonstração:</strong> profissionais, horários e valores abaixo são ilustrativos e serão substituídos pelos dados reais da clínica.</span>
        </p>
      )}

      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar por nome, especialidade ou queixa (ex.: cardiologia, acne)" className="pl-10" aria-label="Buscar profissional" />
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filtrar por especialidade">
          {[{ id: 'all', label: 'Todas' }, ...chips].map(chip => (
            <button
              key={chip.id}
              type="button"
              aria-pressed={specialty === chip.id}
              onClick={() => setSpecialty(chip.id)}
              className={cn(
                'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
                specialty === chip.id ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-card text-foreground hover:bg-muted'
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      <p className="-mb-2 text-sm text-muted-foreground" aria-live="polite">
        {visible.length} {visible.length === 1 ? 'profissional disponível' : 'profissionais disponíveis'}
      </p>

      <ul className="grid gap-4 md:grid-cols-2">
        {visible.map(professional => {
          const upcoming = next.get(professional.id);
          const selected = professional.id === selectedId;
          return (
            <li key={professional.id}>
              <Card className={cn('h-full gap-4 transition-all hover:-translate-y-0.5 hover:shadow-md', selected && 'border-leaf-600 ring-2 ring-leaf-600/70')}>
                <CardHeader className="flex-row items-center gap-3.5">
                  <ProfessionalAvatar name={professional.name} tone={professional.tone} />
                  <div className="min-w-0">
                    <CardTitle className="text-lg">{professional.name}</CardTitle>
                    <p className="text-sm font-semibold text-leaf-800">{professional.specialty}</p>
                    <CardDescription className="text-xs">{professional.council}{professional.rqe ? ` · ${professional.rqe}` : ''}</CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-3.5">
                  <p className="text-sm leading-relaxed text-muted-foreground">{professional.bio}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {professional.focus.map(item => <Badge key={item} variant="secondary">{item}</Badge>)}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline"><Building2 aria-hidden="true" /> Presencial</Badge>
                    {professional.telePrice !== undefined && <Badge variant="outline"><Video aria-hidden="true" /> Telemedicina</Badge>}
                  </div>

                  <div className="mt-auto flex items-center gap-2 rounded-xl bg-muted/70 px-3 py-2.5 text-sm">
                    <CircleCheck className={cn('size-4 shrink-0', upcoming ? 'text-success' : 'text-muted-foreground')} aria-hidden="true" />
                    {upcoming ? (
                      <span><span className="text-muted-foreground">Próximo horário: </span><strong>{capitalize(formatShortDate(upcoming.date))} · {upcoming.time}</strong></span>
                    ) : (
                      <span className="text-muted-foreground">Sem horários nos próximos dias</span>
                    )}
                  </div>

                  <div className="flex items-end justify-between gap-3 border-t pt-3.5">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">Consulta particular</p>
                      <p className="font-display text-2xl font-bold tracking-tight text-brand-900">{formatBRL(professional.price)}</p>
                    </div>
                    <dl className="text-right text-xs text-muted-foreground">
                      <div><dt className="inline">Retorno </dt><dd className="inline font-bold text-foreground">{formatBRL(professional.returnPrice)}</dd></div>
                      {professional.telePrice !== undefined && <div><dt className="inline">Telemedicina </dt><dd className="inline font-bold text-foreground">{formatBRL(professional.telePrice)}</dd></div>}
                    </dl>
                  </div>
                </CardContent>

                <div className="px-5 pb-5">
                  <Button className="w-full" size="lg" variant={selected ? 'accent' : 'default'} onClick={() => onSelect(professional.id)} disabled={!upcoming}>
                    {upcoming ? <>Agendar com {firstName(professional.name)}<span className="sr-only"> ({professional.name}, {professional.specialty})</span> <ArrowRight aria-hidden="true" /></> : 'Indisponível no momento'}
                  </Button>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      {!visible.length && (
        <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
          <p className="font-bold">Nenhum profissional encontrado</p>
          <p className="mt-1 text-sm text-muted-foreground">Tente outro termo ou limpe o filtro de especialidade.</p>
          <Button variant="outline" className="mt-4" onClick={() => { setQuery(''); setSpecialty('all'); }}>Limpar filtros</Button>
        </div>
      )}

      <Card className="gap-0 overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="font-display text-xl">Tabela de valores</CardTitle>
          <CardDescription>Consulta particular. Retorno em até {clinic.returnWindowDays} dias da consulta anterior.</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead className="bg-muted/70 text-xs text-muted-foreground uppercase">
              <tr>
                <th scope="col" className="px-5 py-2.5 font-bold">Especialidade / profissional</th>
                <th scope="col" className="px-3 py-2.5 text-right font-bold">Consulta</th>
                <th scope="col" className="px-3 py-2.5 text-right font-bold">Retorno</th>
                <th scope="col" className="px-5 py-2.5 text-right font-bold">Telemedicina</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {available.map(professional => (
                <tr key={professional.id} className="hover:bg-muted/40">
                  <th scope="row" className="px-5 py-3 font-semibold">
                    {professional.specialty}
                    <span className="block text-xs font-normal text-muted-foreground">{professional.name}</span>
                  </th>
                  <td className="px-3 py-3 text-right font-bold text-brand-900">{formatBRL(professional.price)}</td>
                  <td className="px-3 py-3 text-right">{formatBRL(professional.returnPrice)}</td>
                  <td className="px-5 py-3 text-right">{professional.telePrice !== undefined ? formatBRL(professional.telePrice) : <span className="text-muted-foreground">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
