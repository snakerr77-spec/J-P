import { lazy, Suspense, useEffect, useState } from 'react';
import BookingPage from './booking/BookingPage';

// O painel da clínica carrega sob demanda: o paciente não baixa o código administrativo.
const AdminApp = lazy(() => import('./admin/AdminApp'));

type Route = { name: 'admin' } | { name: 'booking'; professionalId?: string };

/**
 * Rotas por hash (funciona em hospedagem estática):
 *   #/ ou #/agendar            -> agendamento
 *   #/agendar/<id>             -> agendamento já no profissional
 *   #/painel[/seção]           -> painel da clínica
 */
export function parseRoute(hash: string): Route {
  const value = hash.toLowerCase();
  if (value === '#/painel' || value.startsWith('#/painel/')) return { name: 'admin' };
  const match = value.match(/^#\/agendar\/([a-z0-9-]+)/);
  return { name: 'booking', professionalId: match?.[1] };
}

export default function App() {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));

  useEffect(() => {
    const sync = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  if (route.name === 'admin') {
    return <Suspense fallback={<div aria-busy="true" style={{ minHeight: '100vh' }} />}><AdminApp /></Suspense>;
  }
  return <BookingPage key={route.professionalId ?? 'home'} initialProfessionalId={route.professionalId} />;
}
