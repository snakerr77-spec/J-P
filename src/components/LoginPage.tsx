import { useState } from 'react';
import { AUTH_KEY } from '../data';
import { Icons } from '../icons';

type Props = { onLogin: () => void };

export default function LoginPage({ onLogin }: Props) {
  const [email, setEmail] = useState('admin@jpservicosmedicos.com.br');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      setMessage('Preencha e-mail e senha para continuar.');
      return;
    }
    setMessage('');
    setLoading(true);
    window.setTimeout(() => {
      localStorage.setItem(AUTH_KEY, '1');
      onLogin();
    }, 1100);
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
          <span className="login-eyebrow">ÁREA RESTRITA</span>
          <h2>Bem-vindo de volta</h2>
          <p>Entre com suas credenciais para acessar o painel.</p>

          <label>
            Endereço de e-mail
            <div className="login-input">
              <Icons.Mail size={18} />
              <input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="Seu e-mail" />
            </div>
          </label>

          <label>
            Senha
            <div className="login-input">
              <span className="lock-symbol">⌑</span>
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} placeholder="Sua senha" />
              <button type="button" onClick={() => setShowPassword(value => !value)}>{showPassword ? 'Ocultar' : 'Mostrar'}</button>
            </div>
          </label>

          <div className="login-meta">
            <label><input type="checkbox" defaultChecked /> <span>Manter conectado</span></label>
            <button type="button">Esqueci minha senha</button>
          </div>

          {message && <div className="login-message">{message}</div>}
          <button className="login-submit" type="submit" disabled={loading}>{loading ? 'Validando acesso...' : 'Entrar'}</button>
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
