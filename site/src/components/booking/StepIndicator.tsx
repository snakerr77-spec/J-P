type Props = { labels: string[]; current: number };

export default function StepIndicator({ labels, current }: Props) {
  return (
    <div className="booking-steps">
      {labels.map((label, i) => {
        const index = i + 1;
        const state = index < current ? 'done' : index === current ? 'active' : '';
        return (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className={`booking-step-dot ${state}`}>
              <span className="dot">{index < current ? '✓' : index}</span>
              {label}
            </span>
            {i < labels.length - 1 && <span className="booking-step-line" aria-hidden="true" />}
          </span>
        );
      })}
    </div>
  );
}
