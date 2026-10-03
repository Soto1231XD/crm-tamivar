import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRecomendacionesStore } from '../store/useRecomendacionesStore';
import { useHasPermission } from '@/shared/auth/permissions/useHasPermission';
import type { RecomendacionRecord } from '@/interfaces/recomendacion.interface';

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function NombreUsuario({ u }: { u?: { nombres: string; apellido_paterno: string } | null }) {
  if (!u) return <span className="text-slate-400">—</span>;
  return <span>{`${u.nombres} ${u.apellido_paterno}`.trim()}</span>;
}

function RecibidaCard({
  rec,
  onMarcar,
}: {
  rec: RecomendacionRecord;
  onMarcar: (id: number) => void;
}) {
  return (
    <div
      className={`rounded-xl border p-3.5 transition ${
        rec.leida
          ? 'border-slate-200 bg-white'
          : 'border-[#312C85]/20 bg-[#312C85]/5 shadow-sm'
      }`}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-slate-500">
          De: <NombreUsuario u={rec.de} />
        </span>
        <span className="text-[10px] text-slate-400">{formatFecha(rec.creado_en)}</span>
      </div>
      {rec.referencia && (
        <div className="mb-2 flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5">
          <svg className="h-3.5 w-3.5 shrink-0 text-[#312C85]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-[11px] font-semibold text-slate-600">Sobre: {rec.referencia}</span>
        </div>
      )}
      <p className="text-sm leading-5 text-slate-700 whitespace-pre-wrap">{rec.contenido}</p>
      {!rec.leida && (
        <button
          type="button"
          onClick={() => onMarcar(rec.id)}
          className="mt-2.5 text-[11px] font-semibold text-[#312C85] hover:underline"
        >
          Marcar como leída ✓
        </button>
      )}
      {rec.leida && (
        <p className="mt-1.5 text-[10px] text-slate-400">
          Leída {rec.leida_en ? formatFecha(rec.leida_en) : ''}
        </p>
      )}
    </div>
  );
}

function EnviadaCard({ rec }: { rec: RecomendacionRecord }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-slate-500">
          Para: <NombreUsuario u={rec.para} />
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-block h-2 w-2 rounded-full ${rec.leida ? 'bg-emerald-500' : 'bg-amber-400'}`}
          />
          <span className="text-[10px] text-slate-400">
            {rec.leida ? 'Leída' : 'Pendiente'}
          </span>
        </div>
      </div>
      <p className="text-sm leading-5 text-slate-600 line-clamp-2">{rec.contenido}</p>
      <span className="mt-1 block text-[10px] text-slate-400">{formatFecha(rec.creado_en)}</span>
    </div>
  );
}

export function RecomendacionesBell() {
  const { can } = useHasPermission();
  const canLeer = can('recomendaciones', 'leer');
  const canCrear = can('recomendaciones', 'crear');

  const unreadCount = useRecomendacionesStore((s) => s.unreadCount);
  const recibidas = useRecomendacionesStore((s) => s.recibidas);
  const enviadas = useRecomendacionesStore((s) => s.enviadas);
  const isLoadingRecibidas = useRecomendacionesStore((s) => s.isLoadingRecibidas);
  const isLoadingEnviadas = useRecomendacionesStore((s) => s.isLoadingEnviadas);
  const fetchRecibidas = useRecomendacionesStore((s) => s.fetchRecibidas);
  const fetchEnviadas = useRecomendacionesStore((s) => s.fetchEnviadas);
  const marcarLeida = useRecomendacionesStore((s) => s.marcarLeida);

  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<'recibidas' | 'enviadas'>('recibidas');
  const panelRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canLeer) return;
    void fetchRecibidas();
    const id = window.setInterval(() => { void fetchRecibidas(); }, 60000);
    return () => window.clearInterval(id);
  }, [canLeer, fetchRecibidas]);

  useEffect(() => {
    if (!isOpen) return;
    void fetchRecibidas();
    if (canCrear) void fetchEnviadas();
  }, [isOpen, canCrear, fetchRecibidas, fetchEnviadas]);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideButton = panelRef.current?.contains(target);
      const insidePortal = portalRef.current?.contains(target);
      if (!insideButton && !insidePortal) setIsOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  if (!canLeer) return null;

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
        aria-label="Recomendaciones"
      >
        {/* Chat / message icon */}
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7 8h10M7 12h6m-6 4h10M3 5a2 2 0 012-2h14a2 2 0 012 2v11a2 2 0 01-2 2H7l-4 4V5z"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#312C85] px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && createPortal(
        <div ref={portalRef} className="fixed right-4 top-[72px] z-[9999] w-[340px] rounded-2xl border border-slate-200 bg-white shadow-2xl md:right-5">
          {/* Header */}
          <div className="border-b border-slate-200 px-4 py-3">
            <p className="text-sm font-bold text-slate-900">Recomendaciones</p>
          </div>

          {/* Tabs (solo si puede crear también) */}
          {canCrear && (
            <div className="flex border-b border-slate-200">
              <button
                type="button"
                onClick={() => setTab('recibidas')}
                className={`flex-1 py-2.5 text-xs font-semibold transition ${
                  tab === 'recibidas'
                    ? 'border-b-2 border-[#312C85] text-[#312C85]'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Recibidas
              </button>
              <button
                type="button"
                onClick={() => setTab('enviadas')}
                className={`flex-1 py-2.5 text-xs font-semibold transition ${
                  tab === 'enviadas'
                    ? 'border-b-2 border-[#312C85] text-[#312C85]'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Enviadas
                {enviadas.some((e) => !e.leida) && (
                  <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
                )}
              </button>
            </div>
          )}

          {/* Content */}
          <div className="max-h-[420px] overflow-y-auto p-3 space-y-2.5">
            {tab === 'recibidas' && (
              <>
                {isLoadingRecibidas ? (
                  <p className="py-8 text-center text-xs text-slate-400">Cargando...</p>
                ) : recibidas.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-400">
                    No tienes recomendaciones todavía.
                  </p>
                ) : (
                  recibidas.map((r) => (
                    <RecibidaCard key={r.id} rec={r} onMarcar={marcarLeida} />
                  ))
                )}
              </>
            )}

            {tab === 'enviadas' && (
              <>
                {isLoadingEnviadas ? (
                  <p className="py-8 text-center text-xs text-slate-400">Cargando...</p>
                ) : enviadas.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-400">
                    Aún no has enviado recomendaciones.
                  </p>
                ) : (
                  enviadas.map((r) => <EnviadaCard key={r.id} rec={r} />)
                )}
              </>
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
