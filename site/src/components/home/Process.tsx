import RevealOnScroll from '../ui/RevealOnScroll';
import { processSteps } from '../../data';

export default function Process() {
  return (
    <section className="section">
      <div className="container">
        <RevealOnScroll>
          <div className="section-head centered">
            <span className="eyebrow">Como funciona</span>
            <h2>Uma jornada clara, do início ao resultado</h2>
          </div>
        </RevealOnScroll>

        <div className="process-grid">
          {processSteps.map((step, i) => (
            <RevealOnScroll key={step.id} delay={i * 0.08}>
              <div className="process-step">
                <div className="step-index">0{i + 1}</div>
                <h4>{step.title}</h4>
                <p>{step.description}</p>
                {i < processSteps.length - 1 && <span className="process-connector" aria-hidden="true" />}
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
