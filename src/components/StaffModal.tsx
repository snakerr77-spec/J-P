import { useState } from 'react';
import { Icons } from '../icons';
import { ApiError } from '../api';
import { formatPhoneBR } from '../phone';
import type { NewStaffInput, StaffMember, UpdateStaffInput } from '../types';

type Props = {
  open: boolean;
  editing: StaffMember | null;
  onClose: () => void;
  onCreate: (input: NewStaffInput) => Promise<void>;
  onUpdate: (id: number, patch: UpdateStaffInput) => Promise<void>;
};

export default function StaffModal({ open, editing, onClose, onCreate, onUpdate }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  if (!open) return null;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') || '').trim();
    const email = String(form.get('email') || '').trim();
    const role = String(form.get('role') || '').trim() || 'Equipe de recrutamento';
    const phone = formatPhoneBR(String(form.get('phone') || ''));
    const password = String(form.get('password') || '');

    if (!editing && password.length < 8) {
      setMessage('A senha deve ter ao menos 8 caracteres.');
      return;
    }
    if (password && password.length < 8) {
      setMessage('A senha deve ter ao menos 8 caracteres.');
      return;
    }

    setMessage('');
    setSubmitting(true);
    try {
      if (editing) {
        const patch: UpdateStaffInput = { name, email, role, phone };
        if (password) patch.password = password;
        await onUpdate(editing.id, patch);
      } else {
        await onCreate({ name, email, role, phone, password });
      }
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Não foi possível salvar.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <section className="new-candidate-modal" role="dialog" aria-modal="true" aria-label={editing ? 'Editar membro da equipe' : 'Novo membro da equipe'}>
        <button className="modal-close" type="button" onClick={onClose}><Icons.Close size={21}/></button>
        <div className="new-modal-title">
          <span>{editing ? 'EDITAR ACESSO' : 'NOVO ACESSO'}</span>
          <h2>{editing ? `Editar ${editing.name}` : 'Adicionar membro da equipe'}</h2>
          <p>{editing ? 'Deixe a senha em branco para manter a atual.' : 'A pessoa poderá entrar no painel com este e-mail e senha.'}</p>
        </div>
        <form className="candidate-form" onSubmit={submit}>
          <label className="span-2">Nome completo<input name="name" required defaultValue={editing?.name} placeholder="Ex.: Lucas Almeida"/></label>
          <label>E-mail<input name="email" type="email" required defaultValue={editing?.email} placeholder="email@exemplo.com"/></label>
          <label>Cargo / função<input name="role" defaultValue={editing?.role} placeholder="Ex.: Equipe de recrutamento"/></label>
          <label>Telefone<input name="phone" inputMode="tel" maxLength={15} defaultValue={editing?.phone} placeholder="(__) _____-____" onInput={event => { event.currentTarget.value = formatPhoneBR(event.currentTarget.value); }}/></label>
          <label>{editing ? 'Nova senha' : 'Senha'}<input name="password" type="password" minLength={editing ? undefined : 8} required={!editing} placeholder={editing ? 'Deixe em branco para manter' : 'Mínimo 8 caracteres'}/></label>
          {message && <div className="application-error span-2">{message}</div>}
          <div className="form-actions span-2">
            <button className="button button-ghost" type="button" onClick={onClose}>Cancelar</button>
            <button className="button button-primary" type="submit" disabled={submitting}>{submitting ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
