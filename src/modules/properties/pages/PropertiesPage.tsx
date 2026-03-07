import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProperties, updateProperty, updatePropertyStatus, type PropertyRecord } from '../services/properties.api';
import { DeletePropertyConfirmModal } from '../components/DeletePropertyConfirmModal';
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
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>('Todos los estados');
  const [typeFilter, setTypeFilter] = useState<(typeof TYPE_OPTIONS)[number]>('Todos los tipos');
  const [isLoading, setIsLoading] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [deletingProperty, setDeletingProperty] = useState<PropertyRecord | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    getProperties()
      .then((data) => {
        if (!active) return;
        setProperties(data.filter((property) => property.activo !== false));
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
      if (property.activo === false) return false;

      const matchesStatus =
        statusFilter === 'Todos los estados' ||
        property.estatus.trim().toLowerCase() === statusFilter.trim().toLowerCase();

      const matchesType =
        typeFilter === 'Todos los tipos' ||
        property.tipo_inmueble.trim().toLowerCase() === typeFilter.trim().toLowerCase();

      const address = formatDireccion(property.direccion).toLowerCase();
      const title = (property.titulo ?? '').trim().toLowerCase();
      const query = search.trim().toLowerCase();
      const matchesSearch =
        query.length === 0 ||
        title.includes(query) ||
        address.includes(query) ||
        property.estatus.toLowerCase().includes(query);

      return matchesStatus && matchesType && matchesSearch;
    });
  }, [properties, search, statusFilter, typeFilter]);

  function openDeleteModal(property: PropertyRecord) {
    setDeletingProperty(property);
  }

  function closeDeleteModal() {
    setDeletingProperty(null);
  }

  async function handleDeleteProperty(propertyId: number): Promise<string | null> {
    try {
      await updatePropertyStatus(propertyId, { activo: false }, accessToken);
      setProperties((prev) => prev.filter((property) => property.id !== propertyId));
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'No fue posible desactivar la propiedad.';
    }
  }

  function handleDownloadProperty(property: PropertyRecord) {
    downloadPropertyAsExcel(property);
  }

  async function handleQuickStatusChange(propertyId: number, nextStatus: string) {
    const targetProperty = properties.find((property) => property.id === propertyId);
    if (!targetProperty || targetProperty.estatus === nextStatus) return;

    const previousStatus = targetProperty.estatus;
    setUpdatingStatusId(propertyId);
    setProperties((prev) =>
      prev.map((property) => (property.id === propertyId ? { ...property, estatus: nextStatus } : property)),
    );

    try {
      await updateProperty(propertyId, { estatus: nextStatus }, accessToken);
    } catch {
      setProperties((prev) =>
        prev.map((property) => (property.id === propertyId ? { ...property, estatus: previousStatus } : property)),
      );
    } finally {
      setUpdatingStatusId(null);
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
          onClick={() => navigate('/modulos/properties/new')}
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
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Propiedad</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Tipo de inmueble</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Dirección</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Precio (MXN)</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Estados</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-600">
                    Cargando propiedades...
                  </td>
                </tr>
              ) : filteredProperties.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-600">
                    No se encontraron propiedades
                  </td>
                </tr>
              ) : (
                filteredProperties.map((property) => (
                  <tr key={property.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{property.titulo || 'Sin título'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{property.tipo_inmueble}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{formatDireccion(property.direccion)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-[#4F5EF8]">{formatCurrency(property.precio)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={property.estatus}
                        onChange={(event) => handleQuickStatusChange(property.id, event.target.value)}
                        disabled={updatingStatusId === property.id}
                        className="min-w-32 rounded-full border-0 px-3 py-1 text-xs font-semibold outline-none ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
                        style={getPropertyStatusStyles(property.estatus)}
                      >
                        {STATUS_OPTIONS.filter((option) => option !== 'Todos los estados').map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label="Editar"
                          title="Editar"
                          className="rounded-md border border-slate-300 p-1.5 text-slate-700"
                          onClick={() => navigate(`/modulos/properties/${property.id}/edit`)}
                        >
                          <img src={editarIcon} alt="" className="h-6 w-6" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label="Descargar"
                          title="Descargar"
                          className="rounded-md border border-slate-300 p-1.5 text-slate-700"
                          onClick={() => handleDownloadProperty(property)}
                        >
                          <img src={descInfIcon} alt="" className="h-6 w-6" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label="Eliminar"
                          title="Eliminar"
                          className="rounded-md border border-slate-300 p-1.5 text-slate-700"
                          onClick={() => openDeleteModal(property)}
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

      <DeletePropertyConfirmModal
        isOpen={Boolean(deletingProperty)}
        property={deletingProperty}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteProperty}
      />
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
  return parts.length > 0 ? parts.join(', ') : 'Sin dirección';
}

function formatCurrency(value: string | number): string {
  const parsedValue = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(parsedValue)) return '$0.00';

  const formattedValue = new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parsedValue);

  return `$${formattedValue} MXN`;
}

function downloadPropertyAsExcel(property: PropertyRecord) {
  const rows = [
    ['Campo', 'Valor'],
    ['ID', String(property.id ?? '')],
    ['Propiedad', property.titulo?.trim() || 'Sin título'],
    ['Tipo de inmueble', property.tipo_inmueble?.trim() || 'Sin tipo'],
    ['Tipo de operación', property.tipo_operacion?.trim() || 'Sin especificar'],
    ['Estatus', property.estatus?.trim() || 'Sin estatus'],
    ['Precio', formatCurrency(property.precio)],
    ['Precio condicionado', formatConditionalPrice(property.precio_condicionado)],
    ['Cuota mantenimiento', formatOptionalCurrency(property.cuota_mantenimiento)],
    ['Dirección', formatFullDireccion(property.direccion)],
    ['Descripción', property.descripcion?.trim() || 'Sin descripción'],
    ['Tipos de pago', property.tipos_pago?.filter(Boolean).join(', ') || 'Sin especificar'],
    ['Terreno (m2)', formatOptionalNumber(property.medidas?.terreno_m2)],
    ['Construccion (m2)', formatOptionalNumber(property.medidas?.construccion_m2)],
    ['Frente', formatOptionalNumber(property.medidas?.frente)],
    ['Fondo', formatOptionalNumber(property.medidas?.fondo)],
    ['Recámaras', formatOptionalNumber(property.caracteristicas?.recamaras)],
    ['Baños', formatOptionalNumber(property.caracteristicas?.banos)],
    ['Estacionamiento', formatOptionalNumber(property.caracteristicas?.estacionamiento)],
    ['Comentarios', property.comentarios?.trim() || 'Sin comentarios'],
  ];

  const tableRows = rows
    .map(
      ([label, value], index) => `
        <tr>
          <td style="${index === 0 ? HEADER_CELL_STYLE : LABEL_CELL_STYLE}">${escapeHtml(label)}</td>
          <td style="${index === 0 ? HEADER_CELL_STYLE : VALUE_CELL_STYLE}">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join('');

  const excelContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta charset="UTF-8" />
        <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>Propiedad</x:Name>
                  <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
        <![endif]-->
      </head>
      <body>
        <table border="1" cellspacing="0" cellpadding="0">
          ${tableRows}
        </table>
      </body>
    </html>`;

  const blob = new Blob([`\ufeff${excelContent}`], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeFileName(property.titulo || `propiedad-${property.id}`)}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const HEADER_CELL_STYLE =
  'background:#E2E8F0;font-weight:700;color:#0F172A;padding:8px 12px;border:1px solid #CBD5E1;';
const LABEL_CELL_STYLE =
  'background:#F8FAFC;font-weight:600;color:#334155;padding:8px 12px;border:1px solid #CBD5E1;';
const VALUE_CELL_STYLE = 'color:#0F172A;padding:8px 12px;border:1px solid #CBD5E1;';

function formatConditionalPrice(
  conditionalPrice?: { descripcion?: string; monto?: number },
): string {
  if (conditionalPrice?.monto == null) return 'No aplica';
  const amount = formatCurrency(conditionalPrice.monto);
  const description = conditionalPrice.descripcion?.trim();
  return description ? `${amount} - ${description}` : amount;
}

function formatOptionalCurrency(value?: string | number): string {
  if (value == null || value === '') return 'No aplica';
  return formatCurrency(value);
}

function formatOptionalNumber(value?: string | number): string {
  if (value == null || value === '') return 'No aplica';
  return String(value);
}

function formatFullDireccion(direccion?: {
  cp?: number;
  calle?: string;
  municipio?: string;
  fraccionamiento?: string;
  smz?: number;
  mza?: number;
  lote?: number;
  num_ext?: number;
  num_int?: number;
  estado?: string;
  referencias?: string;
}): string {
  if (!direccion) return 'Sin dirección';

  const parts = [
    direccion.calle,
    direccion.num_ext != null ? `Ext. ${direccion.num_ext}` : '',
    direccion.num_int != null ? `Int. ${direccion.num_int}` : '',
    direccion.fraccionamiento,
    direccion.municipio,
    direccion.estado,
    direccion.cp != null ? `CP ${direccion.cp}` : '',
    direccion.smz != null ? `SMZ ${direccion.smz}` : '',
    direccion.mza != null ? `MZA ${direccion.mza}` : '',
    direccion.lote != null ? `Lote ${direccion.lote}` : '',
    direccion.referencias,
  ]
    .map((part) => (typeof part === 'string' ? part.trim() : String(part).trim()))
    .filter((part) => part && part !== 'undefined');

  return parts.length > 0 ? parts.join(', ') : 'Sin dirección';
}

function sanitizeFileName(value: string): string {
  return value
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
