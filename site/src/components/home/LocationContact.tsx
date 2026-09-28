import { Link } from 'react-router-dom';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import RevealOnScroll from '../ui/RevealOnScroll';
import { clinicInfo } from '../../data';

export default function LocationContact() {
  const mapQuery = encodeURIComponent(clinicInfo.address);

  return (
    <section className="section" id="contato">
      <div className="container">
        <RevealOnScroll>
          <div className="section-head">
            <span className="eyebrow">Localização &amp; contato</span>
            <h2>Venha nos conhecer</h2>
          </div>
        </RevealOnScroll>

        <div className="location-grid">
          <RevealOnScroll>
            <div className="card location-card">
              <div className="location-row">
                <span className="loc-icon"><MapPin size={16} /></span>
                <div><strong>Endereço</strong><span>{clinicInfo.address}</span></div>
              </div>
              <div className="location-row">
                <span className="loc-icon"><Phone size={16} /></span>
                <div><strong>Telefone / WhatsApp</strong><span>{clinicInfo.phone}</span></div>
              </div>
              <div className="location-row">
                <span className="loc-icon"><Mail size={16} /></span>
                <div><strong>E-mail</strong><span>{clinicInfo.email}</span></div>
              </div>
              <div className="location-row">
                <span className="loc-icon"><Clock size={16} /></span>
                <div><strong>Horário de atendimento</strong><span>{clinicInfo.hours}</span></div>
              </div>

              <Link to="/agendamento" className="btn btn-primary btn-block" style={{ marginTop: 10 }}>
                Agendar horário
              </Link>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={0.1}>
            <div className="map-embed">
              <iframe
                title="Localização da Clínica Goute"
                src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
