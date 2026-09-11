import { useState } from 'react';
import { Icons } from '../icons';
import type { CandidateType, UserProfile } from '../types';
import { formatPhoneBR } from '../phone';
import type { ThemeMode } from './Sidebar';
import ApplicationLinks from './ApplicationLinks';

export default function Settings({ profile, theme, onThemeChange, onSave, onLogout, onPublicApplication }: {
  profile: UserProfile;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  onSave: (profile: UserProfile) => void;
  onLogout: () => void;
  onPublicApplication: (type: CandidateType) => void;
}) {
  const [form, setForm] = useState(profile);
  const initials = form.name.split(/\s+/).filter(Boolean).slice(0, 2).map(item => item[0]).join('').toUpperCase() || 'AD';

  return (
    <section className="settings-page">
      <div className="settings-grid">
        <article className="module-panel profile-summary">
          <span className="profile-big-avatar">{initials}</span>
          <h2>{form.name}</h2>
          <p>{form.role}</p>
          <small>J&amp;P Serviços Médicos</small>
          <button className="button button-ghost logout-settings" onClick={onLogout}>Sair do portal</button>
        </article>

        <article className="module-panel profile-form-card">
          <div className="module-panel-heading"><div><small>PERFIL</small><h2>Dados do usuário</h2></div></div>
          <form className="profile-form" onSubmit={event => { event.preventDefault(); onSave(form); }}>
            <label>Nome do usuário<input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} required /></label>
            <label>Cargo / função<input value={form.role} onChange={event => setForm({ ...form, role: event.target.value })} required /></label>
            <label>E-mail<input type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} required /></label>
            <label>Telefone<input value={form.phone} inputMode="tel" maxLength={15} onChange={event => setForm({ ...form, phone: formatPhoneBR(event.target.value) })} placeholder="(__) _____-____" /></label>
            <div className="profile-form-actions"><button className="button button-primary" type="submit">Salvar alterações</button></div>
          </form>
        </article>
      </div>

      <ApplicationLinks onOpen={onPublicApplication} compact/>

      <article className="module-panel appearance-card">
        <div className="module-panel-heading">
          <div><small>APARÊNCIA</small><h2>Tema da interface</h2></div>
          <span>Aplicado em todos os módulos administrativos</span>
        </div>
        <div className="appearance-options">
          <button className={`appearance-option ${theme === 'light' ? 'selected' : ''}`} type="button" onClick={() => onThemeChange('light')}>
            <span className="appearance-preview light-preview"><span /><span /><span /></span>
            <span className="appearance-option-copy"><span className="appearance-icon"><Icons.Sun size={17} /></span><span><strong>Modo claro</strong><small>Visual limpo e luminoso</small></span></span>
            <span className="appearance-radio" />
          </button>
          <button className={`appearance-option ${theme === 'dark' ? 'selected' : ''}`} type="button" onClick={() => onThemeChange('dark')}>
            <span className="appearance-preview dark-preview"><span /><span /><span /></span>
            <span className="appearance-option-copy"><span className="appearance-icon"><Icons.Moon size={17} /></span><span><strong>Modo escuro</strong><small>Reduz brilho e mantém o contraste</small></span></span>
            <span className="appearance-radio" />
          </button>
        </div>
      </article>
    </section>
  );
}
