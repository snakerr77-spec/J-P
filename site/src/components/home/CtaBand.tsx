import { Link } from 'react-router-dom';
import { ArrowRight, Phone } from 'lucide-react';
import RevealOnScroll from '../ui/RevealOnScroll';
import { clinicInfo } from '../../data';

export default function CtaBand() {
  return (
    <section className="container" style={{ paddingBottom: 108 }}>
      <RevealOnScroll>
        <div className="cta-band">
          <div>
            <h2>Pronta para dar o próximo passo no seu cuidado?</h2>
            <p>Agende uma avaliação e monte, com nossa equipe, um plano feito para o seu objetivo.</p>
          </div>
          <div className="cta-band-actions">
            <Link to="/agendamento" className="btn" style={{ background: '#fff8ef', color: 'var(--wine-deep)' }}>
              Agendar avaliação <ArrowRight size={16} />
            </Link>
            <a href={`https://wa.me/${clinicInfo.whatsapp}`} target="_blank" rel="noreferrer" className="btn btn-outline on-dark">
              <Phone size={15} /> Falar no WhatsApp
            </a>
          </div>
        </div>
      </RevealOnScroll>
    </section>
  );
}
