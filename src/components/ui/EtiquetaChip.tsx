import type { Etiqueta } from '@/interfaces/lead.interface';

type Props = {
  etiqueta: Etiqueta;
  compact?: boolean;
  onRemove?: () => void;
};

function isDark(hex: string) {
  if (hex.length !== 7) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

const TAG_CLIP = 'polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)';

export function EtiquetaChip({ etiqueta, compact = false, onRemove }: Props) {
  if (compact) {
    return (
      <span
        title={etiqueta.nombre}
        className="inline-block shrink-0 cursor-default"
        style={{
          width: '26px',
          height: '16px',
          backgroundColor: etiqueta.color,
          clipPath: TAG_CLIP,
        }}
      />
    );
  }

  const dark = isDark(etiqueta.color);
  return (
    <span
      className="inline-flex items-center pl-2 pr-5 text-[11px] font-semibold leading-none whitespace-nowrap"
      style={{
        backgroundColor: etiqueta.color,
        color: dark ? '#fff' : '#1e293b',
        minHeight: '20px',
        clipPath: TAG_CLIP,
      }}
    >
      {etiqueta.nombre}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="ml-1 opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Quitar etiqueta"
        >
          ×
        </button>
      )}
    </span>
  );
}
