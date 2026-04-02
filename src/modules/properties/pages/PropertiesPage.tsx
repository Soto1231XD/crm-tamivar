import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import type { PropertyRecord } from "@/interfaces/property.interface";
import { DeletePropertyConfirmModal } from "../components/DeletePropertyConfirmModal";
import descInfIcon from "@/assets/images/DescInf.png";
import agregarIcon from "@/assets/images/Agregar.png";
import desArcIcon from "@/assets/images/DesArc.png";
import verIcon from "@/assets/images/Ver.png";
import {
  PROPERTY_OPERATION_FILTER_OPTIONS,
  STATUS_OPTIONS,
  TYPE_OPTIONS,
} from "../utils/property-constants";
import { usePropertiesStore } from "../store/usePropertiesStore";
import { useHasPermission } from "@/shared/auth/permissions/useHasPermission";
import { BaseTable, type ColumnDef } from "@/components/ui/BaseTable";
import {
  formatDireccion,
  getPropertyStatusStyles,
  formatCurrency,
  calculateFinalPrice,
  getFullImageUrl,
} from "../utils/formatters";
import { downloadPropertiesAsExcel } from "../utils/propertyExport";
import { DownloadPdfButton } from "../utils/DownloadPdfButton";
import { searchProperties } from "../services/properties.api";
import {
  FilterCard,
  FilterSearchInput,
  FilterSelect,
} from "@/components/ui/AppFilters";

const COMMISSION_CALCULATOR_URL = "https://tamivar-tabulador.netlify.app/";

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
  const [operationFilter, setOperationFilter] = useState<
    (typeof PROPERTY_OPERATION_FILTER_OPTIONS)[number]
  >("Todas las operaciones");
  const [deletingProperty, setDeletingProperty] =
    useState<PropertyRecord | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [operationProperties, setOperationProperties] = useState<
    PropertyRecord[]
  >([]);
  const [isFilteringByOperation, setIsFilteringByOperation] = useState(false);

  const canEdit = can("propiedades", "actualizar");
  const canCreate = can("propiedades", "crear");
  const canDelete = can("propiedades", "eliminar");

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    let active = true;

    async function syncOperationFilter() {
      if (operationFilter === "Todas las operaciones") {
        setOperationProperties([]);
        setIsFilteringByOperation(false);
        return;
      }

      setIsFilteringByOperation(true);

      try {
        const data = await searchProperties({
          tipo_operacion: operationFilter,
        });
        if (!active) return;
        setOperationProperties(data);
      } catch {
        if (!active) return;
        toast.error("No fue posible filtrar por tipo de operación.");
        setOperationProperties([]);
      } finally {
        if (active) {
          setIsFilteringByOperation(false);
        }
      }
    }

    void syncOperationFilter();

    return () => {
      active = false;
    };
  }, [operationFilter]);

  // Configuración dinámica de las columnas de la tabla
  const columns: ColumnDef<PropertyRecord>[] = useMemo(
    () => [
      {
        header: "Propiedad",
        headerClassName: "min-w-[200px]",
        cellClassName: "min-w-[200px] whitespace-normal align-top",
        render: (property) => (
          <span className="font-medium text-slate-800">
            {property.titulo || "Sin título"}
          </span>
        ),
      },
      {
        header: "Tipo de inmueble",
        render: (property) => (
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            {property.tipo_inmueble}
          </span>
        ),
      },
      {
        header: "Operación",
        render: (property) => (
          <div className="flex flex-col gap-1.5 items-start">
            {property.esquema_comercial.map((esquema, idx) => (
              <span
                key={idx}
                className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700 ring-1 ring-inset ring-slate-200"
              >
                {esquema.tipo_operacion}
              </span>
            ))}
          </div>
        ),
      },
      {
        header: "Exclusivo",
        headerClassName: "w-[100px]",
        cellClassName: "w-[100px] align-top",
        render: (property) => (
          <span
            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
              property.exclusiva
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "text-slate-500"
            }`}
          >
            {property.exclusiva ? "Sí" : "No"}
          </span>
        ),
      },
      {
        header: "Dirección",
        headerClassName: "w-[320px]",
        cellClassName: "w-[320px] whitespace-normal align-top",
        render: (property) => (
          <div className="min-w-[300px] max-w-[320px] break-words text-sm leading-6 text-slate-600">
            {formatDireccion(property.direccion)}
          </div>
        ),
      },
      {
        header: "Precio (MXN)",
        headerClassName: "w-[160px]",
        cellClassName: "w-[160px] align-top",
        render: (property) => (
          <div className="flex flex-col gap-2 justify-center mt-0.5">
            {property.esquema_comercial.map((esquema, idx) => {
              const { finalPrice } = calculateFinalPrice(
                esquema.precio,
                esquema.descuento_cantidad,
              );

              return (
                <span
                  key={idx}
                  className="whitespace-nowrap font-semibold text-[#4F5EF8] leading-tight"
                >
                  <span className="text-xs text-slate-400 font-medium mr-1.5">
                    {esquema.tipo_operacion.charAt(0).toUpperCase()}:
                  </span>
                  {formatCurrency(finalPrice)}
                </span>
              );
            })}
          </div>
        ),
      },
      {
        header: "Registrado por",
        headerClassName: "min-w-[250px]",
        cellClassName: "min-w-[250px] align-top",
        render: (property) => (
          <div className="flex items-center justify-center gap-2 text-slate-700">
            <div className="h-6 w-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold uppercase overflow-hidden">
              {property.creador?.foto_url ? (
                <img
                  src={getFullImageUrl(property.creador.foto_url)}
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

  const sourceProperties =
    operationFilter === "Todas las operaciones"
      ? properties
      : operationProperties;

  const filteredProperties = useMemo(() => {
    return sourceProperties.filter((property) => {
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
        property.creador.nombres.toLowerCase().includes(query);

      return matchesStatus && matchesType && matchesSearch;
    });
  }, [search, sourceProperties, statusFilter, typeFilter]);

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
      toast.success("La propiedad se elimino con éxito.");
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
      toast.success(`El estado de la propiedad cambio a ${nextStatus}.`);
    } catch {
      toast.error("No fue posible actualizar el estado de la propiedad.");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  function handleDownloadProperties() {
    downloadPropertiesAsExcel(filteredProperties);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Catalogo inmobiliario
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-[2rem]">
            Propiedades
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Gestiona el catalogo de propiedades, revisa su estado y encuentra
            inmuebles más rápido con filtros claros.
          </p>
        </div>

        <div className="ml-auto flex flex-col items-end gap-3">
          <button
            type="button"
            disabled={!canCreate}
            onClick={() => navigate("/modulos/propiedades/nuevo")}
            className="inline-flex items-center gap-2 rounded-xl bg-[#312C85] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#27226f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <img
              src={agregarIcon}
              alt=""
              className="h-6 w-6 shrink-0"
              aria-hidden="true"
            />
            <span>Nueva propiedad</span>
          </button>

          <button
            type="button"
            onClick={() =>
              window.open(
                COMMISSION_CALCULATOR_URL,
                "_blank",
                "noopener,noreferrer",
              )
            }
            className="inline-flex items-center gap-2 rounded-xl bg-[#0F172A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1E293B]"
          >
            <span>Tabulador de comisiones</span>
          </button>
        </div>
      </header>

      <FilterCard description="Busca propiedades por titulo y combina los filtros para ubicar resultados más rápido.">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)_minmax(0,0.85fr)_minmax(0,0.95fr)_auto]">
          <FilterSearchInput
            type="text"
            placeholder="Buscar por titulo, calle o asesor"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <FilterSelect
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as (typeof STATUS_OPTIONS)[number],
              )
            }
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(event.target.value as (typeof TYPE_OPTIONS)[number])
            }
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            value={operationFilter}
            onChange={(event) =>
              setOperationFilter(
                event.target
                  .value as (typeof PROPERTY_OPERATION_FILTER_OPTIONS)[number],
              )
            }
          >
            {PROPERTY_OPERATION_FILTER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </FilterSelect>

          <button
            type="button"
            onClick={handleDownloadProperties}
            disabled={isFilteringByOperation}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#16A34A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-60"
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
      </FilterCard>

      <BaseTable
        data={filteredProperties}
        columns={columns}
        isLoading={isLoading || isFilteringByOperation}
        emptyMessage="No se encontraron propiedades"
        wrapperClassName="rounded-2xl"
        tableClassName="min-w-full text-left"
        actionsClassName="mx-auto flex w-max items-center justify-center gap-2"
        canEdit={canEdit}
        canDelete={canDelete}
        onEdit={(property) =>
          navigate(`/modulos/propiedades/${property.id}/editar`)
        }
        onDelete={(property) => openDeleteModal(property)}
        customActions={(property) => (
          <>
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
