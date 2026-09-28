import type { ReactNode } from 'react';
import { motion } from 'motion/react';

type Props = {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
};

export default function RevealOnScroll({ children, delay = 0, y = 24, className }: Props) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease: [0.2, 0.75, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}
