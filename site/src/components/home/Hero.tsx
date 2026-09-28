import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, HeartHandshake, Sparkles } from 'lucide-react';
import ImagePlaceholder from '../ui/ImagePlaceholder';
import AnimatedCounter from '../ui/AnimatedCounter';
import { services } from '../../data';

const lineVariants = {
  hidden: { opacity: 0, y: 26 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: 0.1 + i * 0.09, ease: [0.2, 0.75, 0.25, 1] as const }
  })
};

export default function Hero() {
  return (
    <section className="hero" id="home">
      <div className="hero-glow" aria-hidden="true" />
      <div className="container hero-grid">
        <div className="hero-copy">
          <motion.div initial="hidden" animate="show" custom={0} variants={lineVariants}>
            <span className="eyebrow"><Sparkles size={13} /> Dermatologia &amp; estética premium</span>
          </motion.div>

          <h1 style={{ marginTop: 18, overflow: 'hidden' }}>
            <motion.span style={{ display: 'block' }} initial="hidden" animate="show" custom={1} variants={lineVariants}>
              Cuidado que revela
            </motion.span>
            <motion.span style={{ display: 'block', color: 'var(--wine)' }} initial="hidden" animate="show" custom={2} variants={lineVariants}>
              a melhor versão da sua pele
            </motion.span>
          </h1>

          <motion.p className="hero-lede" initial="hidden" animate="show" custom={3} variants={lineVariants}>
            Protocolos personalizados em dermatologia, capilar e bem-estar, conduzidos por uma equipe
            especializada em Cerquilho-SP — da avaliação ao acompanhamento, em cada etapa.
          </motion.p>

          <motion.div className="hero-actions" initial="hidden" animate="show" custom={4} variants={lineVariants}>
            <Link to="/agendamento" className="btn btn-primary">
              Agendar avaliação <ArrowRight size={16} />
            </Link>
            <a href="/#especialidades" className="btn btn-outline">Ver especialidades</a>
          </motion.div>

          <motion.div className="hero-stats" initial="hidden" animate="show" custom={5} variants={lineVariants}>
            <div className="hero-stat">
              <strong><AnimatedCounter value={services.length} suffix="+" /></strong>
              <span>Especialidades em um só lugar</span>
            </div>
            <div className="hero-stat">
              <strong style={{ fontSize: 22 }}>Pioneira</strong>
              <span>Técnica exclusiva de Seroterapia</span>
            </div>
            <div className="hero-stat">
              <strong style={{ fontSize: 22 }}>Próximo</strong>
              <span>Acompanhamento em cada etapa</span>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="hero-visual"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.2, 0.75, 0.25, 1] }}
        >
          <ImagePlaceholder label="Foto da clínica / equipe" />
          <motion.div
            className="hero-visual-badge"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <span className="badge-icon"><Award size={17} /></span>
            <div>
              <strong>Equipe especializada</strong>
              <span>Protocolos individualizados</span>
            </div>
          </motion.div>
          <motion.div
            className="hero-visual-badge"
            style={{ left: 'auto', right: -28, bottom: 'auto', top: 28 }}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.75 }}
          >
            <span className="badge-icon"><HeartHandshake size={17} /></span>
            <div>
              <strong>Cuidado próximo</strong>
              <span>Do diagnóstico ao resultado</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
