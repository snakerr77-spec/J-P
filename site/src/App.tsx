import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import AgendamentoPage from './pages/AgendamentoPage';

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0 });
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/agendamento" element={<AgendamentoPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
