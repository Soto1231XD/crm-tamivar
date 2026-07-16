export type PieSegment = { label: string; value: number; color: string };

const PALETTE = [
  '#312C85', '#E74C3C', '#F39C12', '#27AE60',
  '#2980B9', '#8E44AD', '#16A085', '#D35400',
];

export function assignColors(labels: string[]): string[] {
  return labels.map((_, i) => PALETTE[i % PALETTE.length]);
}

export function drawPieChartPng(segments: PieSegment[], title: string): string {
  const W = 720, H = 480;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Fondo blanco
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);

  // Título
  ctx.fillStyle = '#312C85';
  ctx.font = 'bold 18px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, W / 2, 32);

  // Línea decorativa bajo el título
  ctx.strokeStyle = '#312C85';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 120, 40);
  ctx.lineTo(W / 2 + 120, 40);
  ctx.stroke();

  const total = segments.reduce((s, seg) => s + seg.value, 0);

  if (total === 0) {
    ctx.fillStyle = '#888';
    ctx.font = '14px Arial';
    ctx.fillText('Sin datos', W / 2, H / 2);
    return canvas.toDataURL('image/png').split(',')[1];
  }

  // Posición del pastel
  const cx = W * 0.36;
  const cy = H * 0.54;
  const r  = Math.min(cx - 30, cy - 60) * 0.9;

  let angle = -Math.PI / 2;

  // Dibujar sectores
  segments.forEach(seg => {
    if (seg.value === 0) return;
    const sweep = (seg.value / total) * 2 * Math.PI;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle + sweep);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Porcentaje dentro del sector (solo si es suficientemente grande)
    if (seg.value / total > 0.06) {
      const mid = angle + sweep / 2;
      const lx  = cx + Math.cos(mid) * r * 0.62;
      const ly  = cy + Math.sin(mid) * r * 0.62;
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 13px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(((seg.value / total) * 100).toFixed(0) + '%', lx, ly + 5);
    }

    angle += sweep;
  });

  // Sombra suave del pastel
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, 2 * Math.PI);
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 6;
  ctx.stroke();

  // Leyenda (lado derecho)
  const lx0   = W * 0.62;
  const segsActivos = segments.filter(s => s.value > 0);
  const itemH  = Math.min(44, (H - 80) / Math.max(segsActivos.length, 1));
  const ly0   = (H - itemH * segsActivos.length) / 2 + 10;

  segsActivos.forEach((seg, i) => {
    const y   = ly0 + i * itemH;
    const pct = ((seg.value / total) * 100).toFixed(1);

    // Caja de color con bordes redondeados
    ctx.fillStyle = seg.color;
    ctx.beginPath();
    ctx.roundRect?.(lx0, y - 11, 16, 16, 3) ??
      ctx.rect(lx0, y - 11, 16, 16);
    ctx.fill();

    // Nombre
    ctx.fillStyle = '#1A1A1A';
    ctx.font = '13px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(seg.label, lx0 + 24, y + 1);

    // Cantidad y porcentaje
    ctx.fillStyle = '#555555';
    ctx.font = 'bold 12px Arial';
    ctx.fillText(`${seg.value.toLocaleString()}  ·  ${pct}%`, lx0 + 24, y + 17);
  });

  return canvas.toDataURL('image/png').split(',')[1];
}
