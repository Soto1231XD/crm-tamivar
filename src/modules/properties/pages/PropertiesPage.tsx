import { useEffect, useMemo, useState } from 'react';
import { createProperty, getProperties, type CreatePropertyPayload, type PropertyRecord } from '../services/properties.api';
import { CreatePropertyModal } from '../components/CreatePropertyModal';
import { useAuth } from '../../../shared/context/AuthContext';
import descInfIcon from '../../../assets/images/DescInf.png';
import editarIcon from '../../../assets/images/Editar.png';
import borrarIcon from '../../../assets/images/Borrar.png';
import agregarIcon from '../../../assets/images/Agregar.png';
import desArcIcon from '../../../assets/images/DesArc.png';

const STATUS_OPTIONS = ['Todos los estados', 'Disponible', 'Apartado', 'Vendido', 'Preventa', 'Baja'] as const;
const TYPE_OPTIONS = [
  'Todos los tipos',
  'Casa',
  'Departamento',
  'Desarrollo',
  'Terreno',
  'Local comercial',
  'Edificio comercial',
] as const;

const PROPERTY_STATUS_STYLES: Record<string, { backgroundColor: string; color: string }> = {
  disponible: { backgroundColor: '#D0FAE5', color: '#4D8236' },
  apartado: { backgroundColor: '#FEF9C2', color: '#E4AE1F' },
  vendido: { backgroundColor: '#B3B3B5', color: '#000000' },
  preventa: { backgroundColor: '#DBEAFE', color: '#1480F0' },
  baja: { backgroundColor: '#FEF3C7', color: '#CA5874' },
};

export function PropertiesPage() {
  const { user, accessToken } = useAuth();
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>('Todos los estados');
  const [typeFilter, setTypeFilter] = useState<(typeof TYPE_OPTIONS)[number]>('Todos los tipos');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    getProperties()
      .then((data) => {
        if (!active) return;
        setProperties(data);
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const matchesStatus =
        statusFilter === 'Todos los estados' ||
        property.estatus.trim().toLowerCase() === statusFilter.trim().toLowerCase();

      const matchesType =
        typeFilter === 'Todos los tipos' ||
        property.tipo_inmueble.trim().toLowerCase() === typeFilter.trim().toLowerCase();

      const address = formatDireccion(property.direccion).toLowerCase();
      const query = search.trim().toLowerCase();
      const matchesSearch =
        query.length === 0 ||
        property.tipo_inmueble.toLowerCase().includes(query) ||
        address.includes(query) ||
        property.estatus.toLowerCase().includes(query);

      return matchesStatus && matchesType && matchesSearch;
    });
  }, [properties, search, statusFilter, typeFilter]);

  function openCreateModal() {
    setIsCreateModalOpen(true);
  }

  function closeCreateModal() {
    setIsCreateModalOpen(false);
  }

  async function handleCreateProperty(payload: Omit<CreatePropertyPayload, 'creado_por_id'>): Promise<string | null> {
    if (!user?.id) {
      return 'No hay una sesion valida para asociar el creador.';
    }

    try {
      const createdPayload: CreatePropertyPayload = {
        ...payload,
        creado_por_id: user.id,
      };
      const createdProperty = await createProperty(createdPayload, accessToken);
      setProperties((prev) => [createdProperty, ...prev]);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'No fue posible crear la propiedad.';
    }
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Propiedades</h2>
          <p className="mt-1 text-sm text-slate-600">Gestiona el catálogo de propiedades</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-[#312C85] px-4 py-2 text-sm font-semibold text-white shadow-sm"
        >
          <img src={agregarIcon} alt="" className="h-6 w-6 shrink-0" aria-hidden="true" />
          <span>Nueva propiedad</span>
        </button>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_auto]">
          <input
            type="text"
            placeholder="Buscar propiedades"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as (typeof STATUS_OPTIONS)[number])}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as (typeof TYPE_OPTIONS)[number])}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-[#16A34A] px-4 py-2 text-sm font-semibold text-white shadow-sm"
          >
            <img src={desArcIcon} alt="" className="h-6 w-6 shrink-0" aria-hidden="true" />
            <span>Descargar</span>
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">tipo inmueble</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">direccion</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Precio</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Estatus</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-600">
                    Cargando propiedades...
                  </td>
                </tr>
              ) : filteredProperties.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-600">
                    No se encontraron propiedades
                  </td>
                </tr>
              ) : (
                filteredProperties.map((property) => (
                  <tr key={property.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{property.tipo_inmueble}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{formatDireccion(property.direccion)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-[#4F5EF8]">{formatCurrency(property.precio)}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex rounded-full px-2 py-1 text-xs font-semibold"
                        style={getPropertyStatusStyles(property.estatus)}
                      >
                        {property.estatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label="Editar"
                          title="Editar"
                          className="rounded-md border border-slate-300 p-1.5 text-slate-700"
                        >
                          <img src={editarIcon} alt="" className="h-6 w-6" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label="Descargar"
                          title="Descargar"
                          className="rounded-md border border-slate-300 p-1.5 text-slate-700"
                        >
                          <img src={descInfIcon} alt="" className="h-6 w-6" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label="Eliminar"
                          title="Eliminar"
                          className="rounded-md border border-slate-300 p-1.5 text-slate-700"
                        >
                          <img src={borrarIcon} alt="" className="h-6 w-6" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <CreatePropertyModal isOpen={isCreateModalOpen} onClose={closeCreateModal} onCreate={handleCreateProperty} />
    </div>
  );
}

function getPropertyStatusStyles(estatus: string): { backgroundColor: string; color: string } {
  const normalizedStatus = estatus.trim().toLowerCase();
  return PROPERTY_STATUS_STYLES[normalizedStatus] ?? { backgroundColor: '#E2E8F0', color: '#334155' };
}

function formatDireccion(direccion: { calle?: string; municipio?: string; fraccionamiento?: string }): string {
  const parts = [direccion.calle, direccion.municipio, direccion.fraccionamiento]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Sin direccion';
}

function formatCurrency(value: string | number): string {
  const parsedValue = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(parsedValue)) return '$0.00';

  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 2,
  }).format(parsedValue);
}
