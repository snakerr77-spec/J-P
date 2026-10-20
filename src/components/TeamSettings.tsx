import { useEffect, useState } from 'react';
import { Icons } from '../icons';
import { staffApi } from '../api';
import type { NewStaffInput, StaffMember, UpdateStaffInput } from '../types';
import StaffModal from './StaffModal';

function initialsFromName(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase() ?? '').join('');
}

export default function TeamSettings() {
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);

  useEffect(() => {
    staffApi.list()
      .then(({ staff }) => setMembers(staff))
      .catch(() => setLoadError('Não foi possível carregar a equipe.'))
      .finally(() => setLoading(false));
  }, []);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (member: StaffMember) => { setEditing(member); setModalOpen(true); };

  const handleCreate = async (input: NewStaffInput) => {
    const { staff: created } = await staffApi.create(input);
    setMembers(current => [...current, created]);
    setModalOpen(false);
  };

  const handleUpdate = async (id: number, patch: UpdateStaffInput) => {
    const { staff: updated } = await staffApi.update(id, patch);
    setMembers(current => current.map(member => member.id === id ? updated : member));
    setModalOpen(false);
  };

  return (
    <article className="module-panel">
      <div className="module-panel-heading">
        <div><small>EQUIPE</small><h2>Quem acessa o painel</h2></div>
        <button className="button button-primary" type="button" onClick={openCreate}><Icons.Plus size={16}/>Adicionar membro</button>
      </div>
      <div style={{ padding: '14px 17px' }}>
        {loadError && <div className="application-error">{loadError}</div>}
        {loading ? (
          <p>Carregando equipe...</p>
        ) : (
          <div className="interview-intake-list">
            {members.map(member => (
              <article className="interview-intake-card" key={member.id}>
                <span className="interview-person-mark medico">{initialsFromName(member.name)}</span>
                <div><strong>{member.name}</strong><small>{member.role} • {member.email}</small></div>
                <button type="button" className="button interview-schedule-button" onClick={() => openEdit(member)}><Icons.Pencil size={14}/>Editar</button>
              </article>
            ))}
            {!members.length && <p>Nenhum membro cadastrado ainda.</p>}
          </div>
        )}
      </div>
      <StaffModal open={modalOpen} editing={editing} onClose={() => setModalOpen(false)} onCreate={handleCreate} onUpdate={handleUpdate}/>
    </article>
  );
}
