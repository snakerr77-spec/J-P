import { Link } from 'react-router-dom';
import { Instagram, Facebook, MapPin, Phone, Mail } from 'lucide-react';
import { clinicInfo, navLinks } from '../../data';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-logo">Goute<i>.</i></div>
            <p className="footer-about">
              Dermatologia, estética e bem-estar em Cerquilho-SP. Cuidado individualizado, do diagnóstico ao acompanhamento.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
              <a href="https://instagram.com/clinicagoute" target="_blank" rel="noreferrer" aria-label="Instagram" style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,248,239,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Instagram size={16} />
              </a>
              <a href="https://facebook.com/clinicagoute" target="_blank" rel="noreferrer" aria-label="Facebook" style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,248,239,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Facebook size={16} />
              </a>
            </div>
          </div>

          <div className="footer-col">
            <h5>Navegação</h5>
            <ul>
              {navLinks.map(link => (
                <li key={link.hash}><Link to={`/${link.hash}`}>{link.label}</Link></li>
              ))}
              <li><Link to="/agendamento">Agendar horário</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h5>Especialidades</h5>
            <ul>
              <li><span>Dermatologia</span></li>
              <li><span>Capilar</span></li>
              <li><span>Corporal</span></li>
              <li><span>Nutrição</span></li>
            </ul>
          </div>

          <div className="footer-col">
            <h5>Contato</h5>
            <ul>
              <li style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}><MapPin size={15} style={{ marginTop: 3, flex: '0 0 auto' }} /><span>{clinicInfo.address}</span></li>
              <li style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Phone size={15} style={{ flex: '0 0 auto' }} /><a href={`tel:${clinicInfo.phone.replace(/\D/g, '')}`}>{clinicInfo.phone}</a></li>
              <li style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Mail size={15} style={{ flex: '0 0 auto' }} /><a href={`mailto:${clinicInfo.email}`}>{clinicInfo.email}</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {year} Clínica Goute. Todos os direitos reservados.</span>
          <span>{clinicInfo.hours}</span>
        </div>
      </div>
    </footer>
  );
}
