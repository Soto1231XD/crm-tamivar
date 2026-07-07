import { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { AppModal } from '@/components/ui/AppModal';
import type { PropertyRecord } from '@/interfaces/property.interface';
import { formatCurrency, calculateFinalPrice, getFullImageUrl } from '../utils/formatters';

type Platform = 'facebook' | 'instagram' | 'whatsapp';

type GeneratePostModalProps = {
  isOpen: boolean;
  onClose: () => void;
  property: PropertyRecord;
};

// ─── Helpers de texto ────────────────────────────────────────────────────────

function buildSharedData(property: PropertyRecord) {
  const {
    titulo, tipo_inmueble, esquema_comercial, caracteristicas,
    medidas, direccion, amenidades, etiquetas, descripcion,
  } = property;

  const operaciones = esquema_comercial?.map((e) => e.tipo_operacion).join(' / ') ?? '';

  const precioBase = esquema_comercial?.[0];
  const precioInfo = precioBase ? calculateFinalPrice(precioBase.precio, precioBase.descuento_cantidad) : null;
  const precioStr = precioInfo
    ? precioInfo.hasDiscount
      ? `${formatCurrency(precioInfo.finalPrice)} (antes ${formatCurrency(precioInfo.originalPrice)})`
      : formatCurrency(precioInfo.finalPrice)
    : null;

  const ubicacion = [
    direccion?.fraccionamiento?.trim(),
    direccion?.municipio?.trim(),
    direccion?.estado?.trim(),
  ].filter(Boolean).join(', ') || 'Cancún, Q.Roo';

  const caract: string[] = [];
  if (caracteristicas?.recamaras) caract.push(`${caracteristicas.recamaras} recámara${caracteristicas.recamaras !== 1 ? 's' : ''}`);
  if (caracteristicas?.banos) caract.push(`${caracteristicas.banos} baño${caracteristicas.banos !== 1 ? 's' : ''}`);
  if (caracteristicas?.estacionamiento) caract.push(`${caracteristicas.estacionamiento} cajón${caracteristicas.estacionamiento !== 1 ? 'es' : ''} de est.`);
  if (medidas?.construccion_m2) caract.push(`${medidas.construccion_m2} m² construcción`);
  if (medidas?.terreno_m2) caract.push(`${medidas.terreno_m2} m² terreno`);

  const amenidadesList: string[] = [];
  if (caracteristicas?.alberca) amenidadesList.push('Alberca');
  if (caracteristicas?.jardin) amenidadesList.push('Jardín');
  if (caracteristicas?.terraza) amenidadesList.push('Terraza');
  if (caracteristicas?.aire_acondicionado) amenidadesList.push('A/A');
  if (caracteristicas?.amueblado) amenidadesList.push('Amueblado');
  if (amenidades?.trim()) amenidadesList.push(...amenidades.split(',').map((a) => a.trim()).filter(Boolean));

  const hashtags = [
    '#BienesRaices', '#Cancun', '#QRoo',
    tipo_inmueble ? `#${tipo_inmueble.replace(/\s+/g, '')}` : null,
    operaciones.includes('Venta') ? '#CasaEnVenta' : null,
    operaciones.includes('Renta') ? '#CasaEnRenta' : null,
    ...(etiquetas ?? []).slice(0, 3).map((t) => `#${t.replace(/\s+/g, '')}`),
  ].filter(Boolean).join(' ');

  const descripcionTexto = descripcion?.trim() || null;

  return { titulo, tipo_inmueble, operaciones, precioStr, ubicacion, caract, amenidadesList, hashtags, descripcionTexto };
}

function buildPostText(property: PropertyRecord, platform: Platform): string {
  const { titulo, tipo_inmueble, operaciones, precioStr, ubicacion, caract, amenidadesList, hashtags, descripcionTexto } = buildSharedData(property);

  if (platform === 'facebook') {
    const lines: string[] = [];
    lines.push(`🏠 ${tipo_inmueble ?? 'Inmueble'} en ${operaciones} — ${titulo}`);
    lines.push('');
    lines.push(`📍 ${ubicacion}`);
    if (precioStr) lines.push(`💰 ${precioStr}`);
    if (descripcionTexto) { lines.push(''); lines.push(descripcionTexto); }
    if (caract.length > 0) { lines.push(''); lines.push('✨ Características:'); caract.forEach((c) => lines.push(`   • ${c}`)); }
    if (amenidadesList.length > 0) { lines.push(''); lines.push(`🌟 Amenidades: ${amenidadesList.join(' · ')}`); }
    lines.push('');
    lines.push('¿Te interesa? ¡Contáctanos para más información o agenda tu visita!');
    lines.push('');
    lines.push('📞 [número de contacto]');
    lines.push('');
    lines.push(hashtags);
    return lines.join('\n');
  }

  if (platform === 'instagram') {
    const lines: string[] = [];
    lines.push(`${tipo_inmueble ?? 'Inmueble'} en ${operaciones} 🏠✨`);
    lines.push('');
    if (precioStr) lines.push(`💰 ${precioStr}`);
    lines.push(`📍 ${ubicacion}`);
    if (descripcionTexto) { lines.push(''); lines.push(descripcionTexto); }
    if (caract.length > 0) { lines.push(''); caract.forEach((c) => lines.push(`• ${c}`)); }
    if (amenidadesList.length > 0) { lines.push(''); lines.push(`🌟 ${amenidadesList.join(' · ')}`); }
    lines.push('');
    lines.push('📩 Escríbenos para más info o agenda tu visita 👇');
    lines.push('');
    lines.push('—');
    lines.push(hashtags);
    return lines.join('\n');
  }

  // WhatsApp
  const lines: string[] = [];
  lines.push('Hola, te comparto esta propiedad que puede interesarte:');
  lines.push('');
  lines.push(`*${titulo}*`);
  lines.push(`📍 ${ubicacion}`);
  if (precioStr) lines.push(`💰 *${precioStr}*`);
  if (descripcionTexto) { lines.push(''); lines.push(descripcionTexto); }
  if (caract.length > 0) { lines.push(''); caract.forEach((c) => lines.push(`• ${c}`)); }
  if (amenidadesList.length > 0) { lines.push(''); lines.push(`Amenidades: ${amenidadesList.join(', ')}`); }
  lines.push('');
  lines.push('¿Te gustaría agendar una visita? 😊');
  return lines.join('\n');
}

// ─── Helpers de archivos ─────────────────────────────────────────────────────

function sanitizeFileName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function getImageExtension(url: string): string {
  try {
    const path = new URL(url, window.location.origin).pathname;
    const match = path.match(/\.([a-zA-Z0-9]+)(\?|$)/);
    return match?.[1] ?? 'jpg';
  } catch {
    return 'jpg';
  }
}

function getPropertyImages(property: PropertyRecord) {
  return (property.imagenes ?? [])
    .map((img) => ({ ...img, url: getFullImageUrl(img.url) }))
    .filter((img) => img.url && !img.url.includes('/placeholder-image.jpg'));
}

async function fetchImageFiles(property: PropertyRecord, onProgress?: (current: number, total: number) => void): Promise<File[]> {
  const imagenes = getPropertyImages(property);
  const files: File[] = [];

  for (const [index, img] of imagenes.entries()) {
    onProgress?.(index + 1, imagenes.length);
    try {
      const response = await fetch(img.url);
      if (!response.ok) continue;
      const blob = await response.blob();
      const ext = getImageExtension(img.url);
      const safeTitle = sanitizeFileName(img.titulo || `imagen-${index + 1}`);
      const num = String(index + 1).padStart(2, '0');
      files.push(new File([blob], `${num}-${safeTitle}.${ext}`, { type: blob.type || 'image/jpeg' }));
    } catch {
      // Imagen no disponible, se omite
    }
  }

  return files;
}

// ─── Detección de capacidades del navegador ──────────────────────────────────

function detectCapabilities() {
  if (typeof navigator === 'undefined') return { canShare: false, canShareFiles: false };

  const canShare = 'share' in navigator;
  const canShareFiles =
    canShare &&
    'canShare' in navigator &&
    navigator.canShare({ files: [new File([''], 'test.jpg', { type: 'image/jpeg' })] });

  return { canShare, canShareFiles };
}

// ─── Constantes de UI ────────────────────────────────────────────────────────

const PLATFORM_LABELS: Record<Platform, string> = { facebook: 'Facebook', instagram: 'Instagram', whatsapp: 'WhatsApp' };
const PLATFORM_ICONS: Record<Platform, string> = { facebook: '📘', instagram: '📸', whatsapp: '💬' };

// ─── Componente ──────────────────────────────────────────────────────────────

export function GeneratePostModal({ isOpen, onClose, property }: GeneratePostModalProps) {
  const [platform, setPlatform] = useState<Platform>('facebook');
  const [text, setText] = useState(() => buildPostText(property, 'facebook'));
  const [copied, setCopied] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [imageError, setImageError] = useState('');

  const { canShare, canShareFiles } = detectCapabilities();
  const hasImages = getPropertyImages(property).length > 0;

  function handlePlatformChange(p: Platform) {
    setPlatform(p);
    setText(buildPostText(property, p));
    setCopied(false);
  }

  // ── Copiar texto al portapapeles ──────────────────────────────────────────
  function handleCopyText() {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // ── Compartir texto (Web Share API) ──────────────────────────────────────
  async function handleShareText() {
    try {
      await navigator.share({ text });
    } catch (err) {
      // AbortError = el usuario cerró el panel, no es un error real
      if (err instanceof Error && err.name === 'AbortError') return;
      // Cualquier otro fallo → fallback al portapapeles
      void navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  // ── Compartir imágenes (Web Share API con archivos) ───────────────────────
  async function handleShareImages() {
    if (isBusy) return;
    setIsBusy(true);
    setImageError('');
    setProgress('Cargando imágenes...');

    try {
      const files = await fetchImageFiles(property, (current, total) => {
        setProgress(`Cargando imagen ${current} de ${total}...`);
      });

      if (files.length === 0) {
        setImageError('No se pudieron cargar las imágenes. Intenta descargar el .zip.');
        return;
      }

      // Verificación final antes de compartir — algunos navegadores son estrictos
      if (!navigator.canShare({ files })) {
        setImageError('Tu navegador no puede compartir estas imágenes. Descarga el .zip.');
        return;
      }

      await navigator.share({ files });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setImageError('No fue posible compartir las imágenes. Intenta descargar el .zip.');
    } finally {
      setIsBusy(false);
      setProgress('');
    }
  }

  // ── Descargar ZIP (escritorio y fallback) ─────────────────────────────────
  async function handleDownloadZip() {
    if (isBusy) return;
    setIsBusy(true);
    setImageError('');
    setProgress('Preparando archivos de texto...');

    try {
      const zip = new JSZip();
      const folderName = sanitizeFileName(property.titulo || `propiedad-${property.id}`);
      const folder = zip.folder(folderName)!;
      const imagenesFolder = folder.folder('imagenes')!;

      folder.file('post-facebook.txt', buildPostText(property, 'facebook'));
      folder.file('post-instagram.txt', buildPostText(property, 'instagram'));
      folder.file('post-whatsapp.txt', buildPostText(property, 'whatsapp'));

      const imagenes = getPropertyImages(property);
      for (const [index, img] of imagenes.entries()) {
        setProgress(`Descargando imagen ${index + 1} de ${imagenes.length}...`);
        try {
          const response = await fetch(img.url);
          if (!response.ok) continue;
          const blob = await response.blob();
          const ext = getImageExtension(img.url);
          const safeTitle = sanitizeFileName(img.titulo || `imagen-${index + 1}`);
          const num = String(index + 1).padStart(2, '0');
          imagenesFolder.file(`${num}-${safeTitle}.${ext}`, blob);
        } catch {
          // Imagen no disponible, se omite
        }
      }

      setProgress('Generando archivo ZIP...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `${folderName}-redes-sociales.zip`);
    } finally {
      setIsBusy(false);
      setProgress('');
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Generar post para redes sociales"
      subtitle="Edita el texto por plataforma y compártelo o descárgalo junto con las imágenes."
      maxWidthClassName="max-w-2xl"
      panelClassName="max-h-[90vh]"
    >
      {/* overflow-hidden evita que contenido ancho cause scroll horizontal en móvil */}
      <div className="w-full overflow-hidden space-y-4">

        {/* ── Sección de imágenes / paquete ── */}
        {hasImages && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 sm:px-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {canShareFiles ? 'Compartir imágenes' : 'Paquete completo'}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 leading-snug">
                  {isBusy
                    ? progress
                    : canShareFiles
                    ? 'Se abre el menú de tu dispositivo'
                    : '3 archivos .txt + todas las imágenes'}
                </p>
                {imageError && (
                  <p className="mt-1 text-xs font-medium text-red-600 leading-snug">{imageError}</p>
                )}
              </div>

              {canShareFiles ? (
                <button
                  type="button"
                  onClick={() => void handleShareImages()}
                  disabled={isBusy}
                  className="shrink-0 flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isBusy
                    ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    : <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                  }
                  {isBusy ? 'Cargando...' : 'Compartir'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleDownloadZip()}
                  disabled={isBusy}
                  className="shrink-0 flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isBusy
                    ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    : <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                  }
                  {isBusy ? 'Descargando...' : 'Descargar .zip'}
                </button>
              )}
            </div>

            {canShareFiles && imageError && (
              <button
                type="button"
                onClick={() => void handleDownloadZip()}
                disabled={isBusy}
                className="mt-2 text-xs text-slate-500 underline hover:text-slate-700"
              >
                Descargar .zip en su lugar
              </button>
            )}
            {canShareFiles && !imageError && (
              <p className="mt-2 text-xs leading-snug text-slate-400">
                Texto e imágenes se comparten por separado — comparte primero el texto y luego las imágenes.
              </p>
            )}
          </div>
        )}

        {/* Sin imágenes en escritorio → solo .txt */}
        {!hasImages && !canShare && (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 sm:px-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800">Archivos de texto</p>
              <p className="text-xs text-slate-500">{isBusy ? progress : '3 archivos .txt listos para descargar'}</p>
            </div>
            <button
              type="button"
              onClick={() => void handleDownloadZip()}
              disabled={isBusy}
              className="shrink-0 flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isBusy
                ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                : <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
              }
              {isBusy ? 'Descargando...' : 'Descargar .zip'}
            </button>
          </div>
        )}

        <div className="relative flex items-center">
          <div className="flex-1 border-t border-slate-200" />
          <span className="mx-3 shrink-0 text-xs text-slate-400">texto por plataforma</span>
          <div className="flex-1 border-t border-slate-200" />
        </div>

        {/* ── Selector de plataforma — scroll horizontal en pantallas muy pequeñas ── */}
        <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          {(Object.keys(PLATFORM_LABELS) as Platform[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handlePlatformChange(p)}
              className={`shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                platform === p ? 'bg-[#312C85] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{PLATFORM_ICONS[p]}</span>
              {PLATFORM_LABELS[p]}
            </button>
          ))}
        </div>

        {/* ── Área de texto editable ── */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800 sm:px-4 sm:font-mono focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          spellCheck={false}
        />

        {/* ── Acciones del texto ── */}
        <div className="flex flex-col gap-3 border-t border-slate-200 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => { setText(buildPostText(property, platform)); setCopied(false); }}
            className="text-left text-sm text-slate-500 underline hover:text-slate-700"
          >
            Restablecer texto
          </button>

          <div className="flex items-center justify-between gap-3 sm:justify-end">
            {canShare && (
              <button
                type="button"
                onClick={handleCopyText}
                className={`text-xs transition-colors ${copied ? 'font-medium text-emerald-600' : 'text-slate-400 underline hover:text-slate-600'}`}
              >
                {copied ? '¡Copiado!' : 'Copiar texto'}
              </button>
            )}

            {canShare ? (
              <button
                type="button"
                onClick={() => void handleShareText()}
                className="flex items-center gap-2 rounded-lg bg-[#312C85] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#27226f]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Compartir texto
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCopyText}
                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                  copied ? 'bg-emerald-600 text-white' : 'bg-[#312C85] text-white hover:bg-[#27226f]'
                }`}
              >
                {copied ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    ¡Copiado!
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copiar texto
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </AppModal>
  );
}
