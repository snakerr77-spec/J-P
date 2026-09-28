import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import ServiceIcon from '../ui/ServiceIcon';
import RevealOnScroll from '../ui/RevealOnScroll';
import { services } from '../../data';
import type { ServiceCategory } from '../../types';

const categories: { id: ServiceCategory | 'todas'; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'dermatologia', label: 'Dermatologia' },
  { id: 'capilar', label: 'Capilar' },
  { id: 'corporal', label: 'Corporal' },
  { id: 'nutricao', label: 'Nutrição' },
  { id: 'cirurgico', label: 'Cirúrgico' }
];

export default function Services() {
  const [active, setActive] = useState<ServiceCategory | 'todas'>('todas');

  const filtered = useMemo(
    () => (active === 'todas' ? services : services.filter(s => s.category === active)),
    [active]
  );

  return (
    <section className="section" id="especialidades">
      <div className="container">
        <RevealOnScroll>
          <div className="section-head centered">
            <span className="eyebrow">Especialidades</span>
            <h2>Tratamentos pensados para cada objetivo</h2>
            <p>Da pele aos fios, protocolos individualizados com acompanhamento próximo em cada etapa.</p>
          </div>
        </RevealOnScroll>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActive(cat.id)}
              className="btn"
              style={{
                padding: '9px 18px',
                fontSize: 13,
                border: '1px solid var(--border)',
                background: active === cat.id ? 'var(--ink)' : 'var(--surface)',
                color: active === cat.id ? '#fff8ef' : 'var(--ink-soft)'
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <motion.div layout className="services-grid">
          <AnimatePresence mode="popLayout">
            {filtered.map((service, i) => (
              <motion.div
                key={service.id}
                layout
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4, delay: i * 0.04, ease: [0.2, 0.75, 0.25, 1] }}
                className="card service-card"
              >
                {service.highlight && <span className="service-tag">{service.highlight}</span>}
                <span className="service-icon"><ServiceIcon name={service.icon} /></span>
                <h3>{service.name}</h3>
                <p>{service.shortDescription}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
