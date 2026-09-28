import { ImageIcon } from 'lucide-react';

export default function ImagePlaceholder({ label, className }: { label: string; className?: string }) {
  return (
    <div className={`image-placeholder ${className ?? ''}`}>
      <div className="ph-inner">
        <ImageIcon size={26} strokeWidth={1.4} />
        <small>{label}</small>
      </div>
    </div>
  );
}
