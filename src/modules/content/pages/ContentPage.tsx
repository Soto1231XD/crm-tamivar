import { useEffect, useMemo, useState } from 'react';
import agregarIcon from '../../../assets/images/Agregar.png';
import { useAuth } from '../../../shared/context/AuthContext';
import { getDashboardSummary } from '../../dashboard/services/dashboard.api';

const ALL_CONTENT_STATES = 'Todos los estados';

type ContentItem = {
  titulo: string;
  fecha_creacion: string;
  publicado: boolean;
};

export function ContentPage() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(ALL_CONTENT_STATES);

  useEffect(() => {
    if (!accessToken) return;

    let active = true;
    setIsLoading(true);

    getDashboardSummary(accessToken)
      .then((summary) => {
        if (!active) return;
        setItems(Array.isArray(summary.mis_publicaciones) ? summary.mis_publicaciones : []);
      })
      .catch(() => {
        if (!active) return;
        setItems([]);
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [accessToken]);

  const filteredItems = useMemo(() => {
    const query = normalizeText(search);

    return items.filter((item) => {
      const matchesTitle = query.length === 0 || normalizeText(item.titulo).includes(query);
      const currentStatus = item.publicado ? 'Publicado' : 'Borrador';
      const matchesStatus = statusFilter === ALL_CONTENT_STATES || currentStatus === statusFilter;
      return matchesTitle && matchesStatus;
    });
  }, [items, search, statusFilter]);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Contenido</h2>
          <p className="mt-1 text-sm text-slate-600">Gestiona blogs y articulos del sitio web</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-[#312C85] px-4 py-2 text-sm font-semibold text-white shadow-sm"
        >
          <img src={agregarIcon} alt="" className="h-6 w-6 shrink-0" aria-hidden="true" />
          <span>Nuevo articulo</span>
        </button>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <input
            type="text"
            placeholder="Buscar por titulo"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
          >
            {[ALL_CONTENT_STATES, 'Publicado', 'Borrador'].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section>
        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600 shadow-sm">
            Cargando contenido...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600 shadow-sm">
            No se encontraron articulos
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item, index) => (
              <article
                key={`${item.titulo}-${item.fecha_creacion}-${index}`}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="grid flex-1 gap-3 md:grid-cols-3">
                    <InfoBlock label="Titulo" value={item.titulo || 'Sin titulo'} />
                    <InfoBlock
                      label="Estado"
                      value={item.publicado ? 'Publicado' : 'Borrador'}
                      statusStyle={getPublicationStatusStyles(item.publicado)}
                    />
                    <InfoBlock label="Fecha de creacion" value={formatDate(item.fecha_creacion)} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function InfoBlock({
  label,
  value,
  statusStyle,
}: {
  label: string;
  value: string;
  statusStyle?: { backgroundColor: string; color: string };
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-700">{label}:</p>
      {statusStyle ? (
        <span
          className="mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
          style={statusStyle}
        >
          {value}
        </span>
      ) : (
        <p className="mt-1 text-sm text-slate-600">{value}</p>
      )}
    </div>
  );
}

function getPublicationStatusStyles(publicado: boolean): { backgroundColor: string; color: string } {
  if (publicado) {
    return { backgroundColor: '#DBFCE7', color: '#4D8236' };
  }

  return { backgroundColor: '#FFEDD4', color: '#CA5874' };
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || 'Sin fecha';
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function normalizeText(value?: string | null): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
