import { useEffect, useRef, useState } from 'react';
import anime from 'animejs';

type Props = {
  value: number;
  suffix?: string;
  prefix?: string;
};

export default function AnimatedCounter({ value, suffix = '', prefix = '' }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || started) return;
      setStarted(true);
      const counter = { val: 0 };
      anime({
        targets: counter,
        val: value,
        round: 1,
        duration: 1400,
        easing: 'easeOutExpo',
        update: () => {
          if (el) el.textContent = `${prefix}${counter.val}${suffix}`;
        }
      });
    }, { threshold: 0.4 });

    observer.observe(el);
    return () => observer.disconnect();
  }, [started, value, prefix, suffix]);

  return <span ref={ref}>{prefix}0{suffix}</span>;
}
