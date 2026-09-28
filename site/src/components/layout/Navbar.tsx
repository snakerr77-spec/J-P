import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { CalendarHeart, Menu, X } from 'lucide-react';
import { navLinks } from '../../data';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <header className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container navbar-inner">
        <Link to="/" className="navbar-logo" onClick={() => setOpen(false)}>
          Goute<i>.</i>
        </Link>

        <nav className="navbar-links">
          {navLinks.map(link => (
            <Link key={link.hash} to={`/${link.hash}`}>{link.label}</Link>
          ))}
        </nav>

        <div className="navbar-actions">
          <Link to="/agendamento" className="btn btn-primary">
            <CalendarHeart size={16} />
            Agendar horário
          </Link>
          <button className="navbar-menu-btn" onClick={() => setOpen(v => !v)} aria-label="Abrir menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.2, 0.75, 0.25, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingBottom: 20, paddingTop: 8 }}>
              {navLinks.map(link => (
                <Link
                  key={link.hash}
                  to={`/${link.hash}`}
                  onClick={() => setOpen(false)}
                  style={{ padding: '12px 4px', fontSize: 15, fontWeight: 500, borderBottom: '1px solid var(--border)' }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
