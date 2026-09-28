import { Quote } from 'lucide-react';
import RevealOnScroll from '../ui/RevealOnScroll';
import { testimonials } from '../../data';

export default function Testimonials() {
  return (
    <section className="section section-alt" id="depoimentos">
      <div className="container">
        <RevealOnScroll>
          <div className="section-head centered">
            <span className="eyebrow">Depoimentos</span>
            <h2>Quem passou pela Goute conta</h2>
          </div>
        </RevealOnScroll>

        <div className="testimonials-grid">
          {testimonials.map((t, i) => (
            <RevealOnScroll key={t.id} delay={i * 0.08}>
              <div className="card testimonial-card">
                <Quote size={22} color="var(--gold)" />
                <p className="testimonial-quote">&ldquo;{t.quote}&rdquo;</p>
                <div className="testimonial-author">
                  <strong>{t.name}</strong>
                  <span>{t.treatment}</span>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
