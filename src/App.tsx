import { lazy, Suspense, useEffect, useState } from 'react';
import LoginPage from './components/LoginPage';
import ApplicationPage from './components/ApplicationPage';
import { AUTH_KEY } from './data';
import type { CandidateType } from './types';

// Painel e agendamento público carregam sob demanda: o paciente não baixa o painel e vice-versa.
const Dashboard = lazy(() => import('./components/Dashboard'));
const BookingPage = lazy(() => import('./booking/BookingPage'));

const RouteFallback = () => <div aria-busy="true" style={{ minHeight: '100vh' }}/>;

type Route = 'login' | 'dashboard' | 'application-medico' | 'application-colaborador' | 'booking';

function routeFromHash(): Route {
  const hash = window.location.hash.toLowerCase();
  if (hash.startsWith('#/agendar')) return 'booking';
  if (hash.includes('/candidatura/medico')) return 'application-medico';
  if (hash.includes('/candidatura/colaborador')) return 'application-colaborador';
  if (hash.includes('dashboard')) return 'dashboard';
  return localStorage.getItem(AUTH_KEY) === '1' ? 'dashboard' : 'login';
}

/** `#/agendar/<id-do-profissional>` abre o agendamento já no profissional escolhido. */
function bookingProfessionalFromHash() {
  const match = window.location.hash.match(/^#\/agendar\/([\w-]+)/i);
  return match ? match[1].toLowerCase() : undefined;
}

export default function App() {
  const [route, setRoute] = useState<Route>(() => routeFromHash());

  useEffect(() => {
    const sync = () => setRoute(routeFromHash());
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const go = (next: Route) => {
    const hash = next === 'dashboard'
      ? '#/dashboard/candidatos'
      : next === 'application-medico'
        ? '#/candidatura/medico'
        : next === 'application-colaborador'
          ? '#/candidatura/colaborador'
          : '#/login';
    if (window.location.hash === hash) setRoute(next);
    else window.location.hash = hash;
  };

  const openPublicApplication = (type: CandidateType) => {
    const hash = type === 'medico' ? '#/candidatura/medico' : '#/candidatura/colaborador';
    const url = `${window.location.origin}${window.location.pathname}${hash}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (route === 'booking') {
    return <Suspense fallback={<RouteFallback/>}><BookingPage key={window.location.hash} initialProfessionalId={bookingProfessionalFromHash()}/></Suspense>;
  }

  if (route === 'application-medico' || route === 'application-colaborador') {
    const profileType: CandidateType = route === 'application-medico' ? 'medico' : 'colaborador';
    return <ApplicationPage profileType={profileType}/>;
  }

  if (route === 'dashboard' && localStorage.getItem(AUTH_KEY) === '1') {
    return <Suspense fallback={<RouteFallback/>}><Dashboard onLogout={() => go('login')} onPublicApplication={openPublicApplication}/></Suspense>;
  }

  return <LoginPage onLogin={() => go('dashboard')}/>;
}
