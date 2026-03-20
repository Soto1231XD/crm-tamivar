import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import type { PropertyRecord } from "@/interfaces/property.interface";
import { DeletePropertyConfirmModal } from "../components/DeletePropertyConfirmModal";
import descInfIcon from "../../../assets/images/DescInf.png";
import agregarIcon from "../../../assets/images/Agregar.png";
import desArcIcon from "../../../assets/images/DesArc.png";
import verIcon from "@/assets/images/Ver.png";
import { STATUS_OPTIONS, TYPE_OPTIONS } from "../utils/property-constants";
import { usePropertiesStore } from "../store/usePropertiesStore";
import { useHasPermission } from "@/shared/auth/permissions/useHasPermission";
import { BaseTable, type ColumnDef } from "@/components/ui/BaseTable";
import {
  formatDireccion,
  getPropertyStatusStyles,
  formatCurrency,
} from "../utils/formatters";
import { DownloadPdfButton } from "../utils/DownloadPdfButton";

export function PropertiesPage() {
  const navigate = useNavigate();
  const { can } = useHasPermission();

  const {
    properties,
    isLoading,
    fetchProperties,
    removeProperty,
    editProperty,
  } = usePropertiesStore();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_OPTIONS)[number]>("Todos los estados");
  const [typeFilter, setTypeFilter] =
    useState<(typeof TYPE_OPTIONS)[number]>("Todos los tipos");
  const [deletingProperty, setDeletingProperty] =
    useState<PropertyRecord | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

  // Evaluamos permisos específicos
  const canEdit = can("propiedades", "actualizar");
  const canCreate = can("propiedades", "crear");
  const canDelete = can("propiedades", "eliminar");

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Configuración dinámica de las columnas de la tabla
  const columns: ColumnDef<PropertyRecord>[] = useMemo(
    () => [
      {
        header: "Propiedad",
        render: (property) => (
          <span className="font-medium text-slate-800">
            {property.titulo || "Sin título"}
          </span>
        ),
      },
      {
        header: "Tipo de inmueble",
        accessorKey: "tipo_inmueble",
      },
      {
        header: "Operación",
        render: (property) => (
          <span className="inline-flex items-center rounded-md bg-slate-100 p-2 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200">
            {property.tipo_operacion}
          </span>
        ),
      },
      {
        header: "Dirección",
        render: (property) => (
          <span className="text-slate-700">
            {formatDireccion(property.direccion)}
          </span>
        ),
      },
      {
        header: "Precio (MXN)",
        render: (property) => (
          <span className="font-semibold text-[#4F5EF8]">
            {formatCurrency(property.precio)}
          </span>
        ),
      },
      {
        header: "Asesor",
        render: (property) => (
          <div className="flex items-center justify-center gap-2 text-slate-700">
            <div className="h-6 w-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold uppercase overflow-hidden">
              {property.creador?.foto_url ? (
                <img
                  src={property.creador.foto_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                `${property.creador?.nombres?.[0] || ""}${property.creador?.apellido_paterno?.[0] || ""}`
              )}
            </div>
            <span>{`${property.creador?.nombres || ""} ${property.creador?.apellido_paterno || ""}`}</span>
          </div>
        ),
      },
      {
        header: "Estado",
        render: (property) => (
          <div className="relative inline-block w-[140px]">
            <select
              value={property.estatus}
              onChange={(event) =>
                handleStatusChange(property.id, event.target.value)
              }
              disabled={updatingStatusId === property.id || !canEdit}
              className="w-full appearance-none cursor-pointer rounded-full border-0 px-4 py-1.5 text-left text-xs font-semibold shadow-sm outline-none ring-1 ring-inset ring-slate-200 transition-all hover:ring-slate-300 focus:ring-2 focus:ring-[#312C85] disabled:cursor-not-allowed disabled:opacity-70"
              style={getPropertyStatusStyles(property.estatus)}
            >
              {STATUS_OPTIONS.filter(
                (option) => option !== "Todos los estados",
              ).map((option) => (
                <option
                  key={option}
                  value={option}
                  className="bg-white text-slate-800 font-medium"
                >
                  {option}
                </option>
              ))}
            </select>

            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-current opacity-70">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </span>
          </div>
        ),
      },
    ],
    [updatingStatusId, canEdit],
  );

  // Lógica de filtrado
  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const matchesStatus =
        statusFilter === "Todos los estados" ||
        property.estatus.toLowerCase() === statusFilter.toLowerCase();

      const matchesType =
        typeFilter === "Todos los tipos" ||
        property.tipo_inmueble.toLowerCase() === typeFilter.toLowerCase();

      const query = search.trim().toLowerCase();
      const matchesSearch =
        query === "" ||
        property.titulo.toLowerCase().includes(query) ||
        property.direccion.calle.toLowerCase().includes(query) ||
        property.creador.nombres.toLowerCase().includes(query); // Filtrar por asesor

      return matchesStatus && matchesType && matchesSearch;
    });
  }, [properties, search, statusFilter, typeFilter]);

  function openDeleteModal(property: PropertyRecord) {
    setDeletingProperty(property);
  }

  function closeDeleteModal() {
    setDeletingProperty(null);
  }

  async function handleDelete(propertyId: number): Promise<string | null> {
    try {
      await removeProperty(propertyId);
      setDeletingProperty(null);
      toast.success("La propiedad se eliminó con éxito.");
      return null;
    } catch (error) {
      toast.error("No fue posible eliminar la propiedad.");
      return error instanceof Error
        ? error.message
        : "No fue posible eliminar la propiedad.";
    }
  }

  const handleStatusChange = async (id: number, nextStatus: string) => {
    setUpdatingStatusId(id);
    try {
      await editProperty(id, { estatus: nextStatus });
      toast.success(`El estado de la propiedad cambió a ${nextStatus}.`);
    } catch {
      toast.error("No fue posible actualizar el estado de la propiedad.");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Propiedades</h2>
          <p className="mt-1 text-sm text-slate-600">
            Gestiona el catálogo de propiedades
          </p>
        </div>
        <button
          type="button"
          disabled={!canCreate}
          onClick={() => navigate("/modulos/propiedades/nuevo")}
          className="inline-flex items-center gap-2 rounded-lg bg-[#312C85] px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          <img
            src={agregarIcon}
            alt=""
            className="h-6 w-6 shrink-0"
            aria-hidden="true"
          />
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
            onChange={(event) =>
              setStatusFilter(
                event.target.value as (typeof STATUS_OPTIONS)[number],
              )
            }
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
            onChange={(event) =>
              setTypeFilter(event.target.value as (typeof TYPE_OPTIONS)[number])
            }
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
            <img
              src={desArcIcon}
              alt=""
              className="h-6 w-6 shrink-0"
              aria-hidden="true"
            />
            <span>Descargar</span>
          </button>
        </div>
      </section>

      {/* Tabla */}
      <BaseTable
        data={filteredProperties}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No se encontraron propiedades"
        canEdit={canEdit}
        canDelete={canDelete}
        onEdit={(property) =>
          navigate(`/modulos/propiedades/${property.id}/editar`)
        }
        onDelete={(property) => openDeleteModal(property)}
        customActions={(property) => (
          <>
            {/* Botón Ver Detalles */}
            <button
              type="button"
              aria-label="Ver detalles"
              title="Ver detalles"
              className="rounded-md border border-slate-300 p-1.5 text-slate-700 hover:bg-slate-100 transition-colors"
              onClick={() => navigate(`/modulos/propiedades/${property.id}`)}
            >
              <img
                src={verIcon}
                alt=""
                className="h-5 w-5"
                aria-hidden="true"
              />
            </button>

            {/* Botón Descargar */}
            <DownloadPdfButton
              property={property}
              className="rounded-md border border-slate-300 p-1.5 text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center"
            >
              {(loading) =>
                loading ? (
                  <div className="h-5 w-5 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin" />
                ) : (
                  <img src={descInfIcon} alt="Descargar" className="h-5 w-5" />
                )
              }
            </DownloadPdfButton>
          </>
        )}
      />

      {deletingProperty && (
        <DeletePropertyConfirmModal
          isOpen={true}
          property={deletingProperty}
          onConfirm={() => handleDelete(deletingProperty.id)}
          onClose={closeDeleteModal}
        />
      )}
    </div>
  );
}