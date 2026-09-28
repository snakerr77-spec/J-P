import { Award, FlaskConical, HeartHandshake, UsersRound } from 'lucide-react';
import RevealOnScroll from '../ui/RevealOnScroll';
import ImagePlaceholder from '../ui/ImagePlaceholder';

const points = [
  {
    icon: Award,
    title: 'Pioneira em Seroterapia',
    description: 'Técnica exclusiva desenvolvida pela clínica para revitalização da pele.'
  },
  {
    icon: FlaskConical,
    title: 'Fórmulas desenvolvidas na clínica',
    description: 'Protocolos como o Capillare unem cosmética própria e tecnologia.'
  },
  {
    icon: UsersRound,
    title: 'Equipe multidisciplinar',
    description: 'Dermatologia, nutrição e especialistas capilares sob o mesmo teto.'
  },
  {
    icon: HeartHandshake,
    title: 'Acompanhamento contínuo',
    description: 'Plano individualizado, com retornos e ajustes até o resultado desejado.'
  }
];

export default function About() {
  return (
    <section className="section section-alt" id="sobre">
      <div className="container about-grid">
        <RevealOnScroll className="about-visual">
          <ImagePlaceholder label="Foto do consultório" />
        </RevealOnScroll>

        <RevealOnScroll delay={0.1}>
          <span className="eyebrow">Sobre a clínica</span>
          <h2 style={{ marginTop: 14, fontSize: 'clamp(28px, 3.2vw, 38px)' }}>
            Referência em dermatologia e estética em Cerquilho
          </h2>
          <p style={{ marginTop: 18, fontSize: 16, maxWidth: '52ch' }}>
            Combinamos técnicas próprias, tecnologia e um olhar individualizado para cada pessoa —
            sempre com transparência sobre o que esperar de cada etapa do tratamento.
          </p>

          <div className="about-points">
            {points.map(point => (
              <div className="about-point" key={point.title}>
                <span className="point-icon"><point.icon size={17} /></span>
                <div>
                  <strong>{point.title}</strong>
                  <p>{point.description}</p>
                </div>
              </div>
            ))}
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
