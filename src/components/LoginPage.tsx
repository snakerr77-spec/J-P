import { useEffect, useState } from 'react';
import { Icons } from '../icons';
import { authApi, ApiError } from '../api';
import type { UserProfile } from '../types';

type Props = { onAuthenticated: (profile: UserProfile) => void };

export default function LoginPage({ onAuthenticated }: Props) {
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    authApi.status()
      .then(({ hasAdmin }) => setNeedsSetup(!hasAdmin))
      .catch(() => setNeedsSetup(false))
      .finally(() => setCheckingSetup(false));
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;
    if (!email.trim() || !password.trim()) {
      setMessage('Preencha e-mail e senha para continuar.');
      return;
    }
    if (needsSetup) {
      if (!name.trim()) { setMessage('Informe o nome do administrador.'); return; }
      if (password.length < 8) { setMessage('A senha deve ter ao menos 8 caracteres.'); return; }
      if (password !== confirmPassword) { setMessage('As senhas não conferem.'); return; }
    }

    setMessage('');
    setLoading(true);
    try {
      if (needsSetup) {
        const { profile } = await authApi.setup({ name: name.trim(), email: email.trim(), password });
        onAuthenticated(profile);
      } else {
        await authApi.login(email.trim(), password);
        const { profile } = await authApi.me();
        onAuthenticated(profile);
      }
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Não foi possível entrar. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-visual">
        <div className="login-photo" style={{ backgroundImage: "url('./assets/login-clinic-bg-blue.jpg')" }} />
        <video className="login-leaves" autoPlay muted loop playsInline poster="./assets/login-clinic-bg-blue.jpg">
          <source src="./assets/leaves-overlay-blue.webm" type="video/webm" />
        </video>
        <div className="login-shade" />

        <div className="login-brand">
          <img src="./assets/jp-logo-login.svg" alt="J&P Serviços Médicos" />
          <span>Recrutamento Médico</span>
        </div>

        <div className="login-copy">
          <small>PORTAL PROFISSIONAL</small>
          <h1>Gestão médica com mais organização.</h1>
          <p>Centralize candidatos, documentos e etapas de contratação em um só lugar.</p>
          <div>
            <span><Icons.Check size={17} />Seleção mais organizada</span>
            <span><Icons.Check size={17} />Dados centralizados</span>
          </div>
        </div>
      </section>

      <section className="login-form-side">
        <form className="login-card" onSubmit={submit}>
          <img className="login-mobile-logo" src="./assets/jp-logo-login.svg" alt="J&P Serviços Médicos" />
          <span className="login-eyebrow">{needsSetup ? 'PRIMEIRO ACESSO' : 'ÁREA RESTRITA'}</span>
          <h2>{needsSetup ? 'Criar conta de administrador' : 'Bem-vindo de volta'}</h2>
          <p>{needsSetup ? 'Nenhum administrador foi configurado ainda. Crie o primeiro acesso ao painel.' : 'Entre com suas credenciais para acessar o painel.'}</p>

          {needsSetup && (
            <label>
              Nome do administrador
              <div className="login-input">
                <Icons.Mail size={18} />
                <input type="text" value={name} onChange={event => setName(event.target.value)} placeholder="Seu nome" autoComplete="name" />
              </div>
            </label>
          )}

          <label>
            Endereço de e-mail
            <div className="login-input">
              <Icons.Mail size={18} />
              <input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="Seu e-mail" autoComplete="username" />
            </div>
          </label>

          <label>
            Senha
            <div className="login-input">
              <span className="lock-symbol">⌑</span>
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} placeholder="Sua senha" autoComplete={needsSetup ? 'new-password' : 'current-password'} />
              <button type="button" onClick={() => setShowPassword(value => !value)}>{showPassword ? 'Ocultar' : 'Mostrar'}</button>
            </div>
          </label>

          {needsSetup && (
            <label>
              Confirmar senha
              <div className="login-input">
                <span className="lock-symbol">⌑</span>
                <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} placeholder="Repita a senha" autoComplete="new-password" />
              </div>
            </label>
          )}

          {!needsSetup && (
            <div className="login-meta">
              <label><input type="checkbox" defaultChecked /> <span>Manter conectado</span></label>
              <button type="button">Esqueci minha senha</button>
            </div>
          )}

          {message && <div className="login-message">{message}</div>}
          <button className="login-submit" type="submit" disabled={loading || checkingSetup}>
            {loading ? 'Validando acesso...' : needsSetup ? 'Criar conta e entrar' : 'Entrar'}
          </button>
          <div className="security-line"><Icons.ShieldCheck size={17} />Ambiente seguro</div>
        </form>
      </section>

      {loading && (
        <div className="loading-screen">
          <div className="loading-orbit">
            <div className="loading-ring" />
            <div className="loading-brand"><strong>J&amp;P</strong><span>Carregando portal...</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
