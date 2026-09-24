import { useEffect, useState } from 'react';
import Dashboard from './components/Dashboard';
import LoginPage from './components/LoginPage';
import ApplicationPage from './components/ApplicationPage';
import { authApi } from './api';
import type { CandidateType, UserProfile } from './types';

function publicApplicationType(): CandidateType | null {
  const hash = window.location.hash.toLowerCase();
  if (hash.includes('/candidatura/medico')) return 'medico';
  if (hash.includes('/candidatura/colaborador')) return 'colaborador';
  return null;
}

export default function App() {
  const [applicationType, setApplicationType] = useState<CandidateType | null>(() => publicApplicationType());
  const [checkingSession, setCheckingSession] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const sync = () => setApplicationType(publicApplicationType());
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  useEffect(() => {
    if (applicationType) { setCheckingSession(false); return; }
    let cancelled = false;
    setCheckingSession(true);
    authApi.me()
      .then(({ profile }) => { if (!cancelled) setProfile(profile); })
      .catch(() => { if (!cancelled) setProfile(null); })
      .finally(() => { if (!cancelled) setCheckingSession(false); });
    return () => { cancelled = true; };
  }, [applicationType]);

  const openPublicApplication = (type: CandidateType) => {
    const hash = type === 'medico' ? '#/candidatura/medico' : '#/candidatura/colaborador';
    const url = `${window.location.origin}${window.location.pathname}${hash}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleLogout = () => {
    setProfile(null);
    window.location.hash = '#/login';
  };

  if (applicationType) return <ApplicationPage profileType={applicationType}/>;

  if (checkingSession) {
    return (
      <div className="loading-screen">
        <div className="loading-orbit">
          <div className="loading-ring" />
          <div className="loading-brand"><strong>J&amp;P</strong><span>Carregando portal...</span></div>
        </div>
      </div>
    );
  }

  if (profile) {
    return <Dashboard initialProfile={profile} onLogout={handleLogout} onPublicApplication={openPublicApplication}/>;
  }

  return <LoginPage onAuthenticated={setProfile}/>;
}
