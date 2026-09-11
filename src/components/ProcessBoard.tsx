import { useMemo, useRef, useState } from 'react';
import { BriefcaseBusiness, GripVertical, Stethoscope } from 'lucide-react';
import type { Candidate, CandidateStatus, CandidateType } from '../types';
import { formatDate } from '../storage';

const columns: { status: CandidateStatus; label: string; hint: string }[] = [
  { status: 'novo', label: 'Novo', hint: 'Candidaturas recebidas' },
  { status: 'analise', label: 'Em análise', hint: 'Currículo em avaliação' },
  { status: 'entrevista', label: 'Entrevista', hint: 'Etapa de conversa' },
  { status: 'aguardando', label: 'Decisão de contratação', hint: 'Contratar ou encerrar' },
  { status: 'aprovado', label: 'Aprovado', hint: 'Perfil para contratação' },
  { status: 'reprovado', label: 'Reprovado', hint: 'Processo encerrado' }
];

type Props = {
  candidates: Candidate[];
  onOpen: (candidate: Candidate) => void;
  onMove: (candidate: Candidate, status: CandidateStatus) => void;
};

export default function ProcessBoard({ candidates, onOpen, onMove }: Props) {
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<CandidateStatus | null>(null);
  const [profileType, setProfileType] = useState<CandidateType | 'all'>('all');
  const suppressClickUntil = useRef(0);

  const visibleCandidates = useMemo(() => candidates.filter(candidate => profileType === 'all' || candidate.profileType === profileType), [candidates, profileType]);
  const draggedCandidate = draggedId ? candidates.find(candidate => candidate.id === draggedId) || null : null;

  const finishDrag = () => {
    suppressClickUntil.current = Date.now() + 250;
    setDraggedId(null);
    setDropTarget(null);
  };

  const dropCandidate = (status: CandidateStatus) => {
    if (!draggedCandidate) return finishDrag();
    if (draggedCandidate.status !== status) onMove(draggedCandidate, status);
    finishDrag();
  };

  return (
    <section className="module-panel process-panel">
      <div className="module-panel-heading process-heading">
        <div><small>PIPELINE</small><h2>Etapas do processo seletivo</h2><p>Arraste cada perfil para a etapa desejada. A alteração é salva automaticamente.</p></div>
        <div className="process-heading-actions">
          <div className="profile-segmented-control" aria-label="Filtrar perfis">
            <button className={profileType === 'all' ? 'selected' : ''} onClick={() => setProfileType('all')}>Todos</button>
            <button className={profileType === 'medico' ? 'selected' : ''} onClick={() => setProfileType('medico')}><Stethoscope size={14}/>Médicos</button>
            <button className={profileType === 'colaborador' ? 'selected' : ''} onClick={() => setProfileType('colaborador')}><BriefcaseBusiness size={14}/>Colaboradores</button>
          </div>
          <span>{visibleCandidates.length} perfis</span>
        </div>
      </div>
      <div className="kanban-grid">
        {columns.map(column => {
          const items = visibleCandidates.filter(candidate => candidate.status === column.status);
          const isDropTarget = dropTarget === column.status && Boolean(draggedId);
          return (
            <article
              className={`kanban-column kanban-${column.status} ${isDropTarget ? 'drag-over' : ''}`}
              key={column.status}
              onDragOver={event => {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
                setDropTarget(column.status);
              }}
              onDragLeave={event => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropTarget(current => current === column.status ? null : current);
              }}
              onDrop={event => {
                event.preventDefault();
                dropCandidate(column.status);
              }}
            >
              <div className="kanban-column-title">
                <div><strong>{column.label}</strong><small>{column.hint}</small></div>
                <span>{items.length}</span>
              </div>
              <div className="kanban-cards">
                {items.map(candidate => (
                  <button
                    className={`kanban-card ${draggedId === candidate.id ? 'is-dragging' : ''}`}
                    key={candidate.id}
                    draggable
                    onDragStart={event => {
                      setDraggedId(candidate.id);
                      setDropTarget(candidate.status);
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData('text/plain', String(candidate.id));
                    }}
                    onDragEnd={finishDrag}
                    onClick={() => {
                      if (Date.now() < suppressClickUntil.current) return;
                      onOpen(candidate);
                    }}
                  >
                    <span className="kanban-avatar">{candidate.initials}</span>
                    <span className="kanban-card-copy"><strong>{candidate.name}</strong><small>{candidate.profileType === 'medico' ? 'Médico' : 'Colaborador'} • {candidate.specialty}</small><em>{formatDate(candidate.createdAt)}</em></span>
                    <span className="kanban-drag-handle" title="Arrastar para outra etapa"><GripVertical size={15}/></span>
                  </button>
                ))}
                {!items.length && <div className={`kanban-empty ${isDropTarget ? 'ready' : ''}`}>{isDropTarget ? 'Solte o perfil aqui' : 'Nenhum perfil'}</div>}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
