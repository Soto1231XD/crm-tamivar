import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import type { PropertyRecord } from "@/interfaces/property.interface";
import { DeletePropertyConfirmModal } from "../components/DeletePropertyConfirmModal";
import agregarIcon from "@/assets/images/Agregar.png";
import desArcIcon from "@/assets/images/DesArc.png";
import {
  EXCLUSIVE_FILTER_OPTIONS,
  PROPERTY_OPERATION_FILTER_OPTIONS,
  STATUS_OPTIONS,
  TYPE_OPTIONS,
} from "../utils/property-constants";
import { usePropertiesStore } from "../store/usePropertiesStore";
import { useHasPermission } from "@/shared/auth/permissions/useHasPermission";
import { downloadPropertiesAsExcel } from "../utils/propertyExport";
import {
  FilterCard,
  FilterSearchInput,
  FilterSelect,
  FilterPriceInput,
} from "@/components/ui/AppFilters";
import { PropertiesTable } from "../components/PropertiesTable";

const COMMISSION_CALCULATOR_URL = "https://tamivar-tabulador.netlify.app/";

export function PropertiesPage() {
  const navigate = useNavigate();
  const { can } = useHasPermission();

  const {
    properties,
    filteredProperties,
    filters,
    setFilters,
    isLoading,
    fetchProperties,
    removeProperty,
  } = usePropertiesStore();

  const [search, setSearch] = useState("");
  const [deletingProperty, setDeletingProperty] =
    useState<PropertyRecord | null>(null);

  const canEdit = can("propiedades", "actualizar");
  const canCreate = can("propiedades", "crear");
  const canDelete = can("propiedades", "eliminar");

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // La búsqueda por texto la hacemos localmente sobre los resultados ya filtrados por el Store
  const finalDisplayProperties = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return filteredProperties;

    return filteredProperties.filter(
      (property) =>
        property.titulo.toLowerCase().includes(query) ||
        (property.direccion?.calle ?? "").toLowerCase().includes(query),
    );
  }, [filteredProperties, search]);

  const addressStateOptions = useMemo(() => {
    const uniqueStates = Array.from(
      new Set(
        properties
          .map((property) => property.direccion?.estado?.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    ).sort((left, right) => left.localeCompare(right, "es"));

    return ["Todos los estados de ubicación", ...uniqueStates];
  }, [properties]);

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

        <div className="ml-auto flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          {/* Botón Tabulador */}
          <button
            type="button"
            onClick={() =>
              window.open(
                COMMISSION_CALCULATOR_URL,
                "_blank",
                "noopener,noreferrer",
              )
            }
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#4F5EF8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3b47db] sm:w-auto"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <span className="whitespace-nowrap">Tabulador de comisiones</span>
          </button>

          {/* Botón Nueva Propiedad */}
          <button
            type="button"
            disabled={!canCreate}
            onClick={() => navigate("/modulos/propiedades/nuevo")}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#312C85] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#27226f] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            <img
              src={agregarIcon}
              alt=""
              className="h-6 w-6 shrink-0"
              aria-hidden="true"
            />
            <span className="whitespace-nowrap">Nueva propiedad</span>
          </button>
        </div>
      </header>

      <FilterCard description="Busca propiedades por título y combina solo los filtros clave para ubicar resultados sin cansar la vista.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 items-start">
          <FilterSelect
            value={filters.estatus || "Todos los estados"}
            onChange={(e) => setFilters({ estatus: e.target.value })}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            value={filters.tipo_inmueble || "Todos los tipos"}
            onChange={(e) => setFilters({ tipo_inmueble: e.target.value })}
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            value={filters.direccionEstado || "Todos los estados de ubicación"}
            onChange={(e) => setFilters({ direccionEstado: e.target.value })}
          >
            {addressStateOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            value={filters.exclusiva || "Todas las exclusividades"}
            onChange={(e) => setFilters({ exclusiva: e.target.value })}
          >
            {EXCLUSIVE_FILTER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            value={filters.tipo_operacion || "Todas las operaciones"}
            onChange={(e) => setFilters({ tipo_operacion: e.target.value })}
          >
            {PROPERTY_OPERATION_FILTER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </FilterSelect>

          <FilterPriceInput
            placeholder="Precio mínimo"
            value={filters.minPrecio}
            onChange={(val) => setFilters({ minPrecio: val })}
          />

          <FilterPriceInput
            placeholder="Precio máximo"
            value={filters.maxPrecio}
            onChange={(val) => setFilters({ maxPrecio: val })}
          />

          <div className="sm:col-span-2 xl:col-span-3">
            <FilterSearchInput
              type="text"
              placeholder="Buscar por título o calle"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="sm:col-span-2 md:col-span-1 xl:col-span-1">
            <button
              type="button"
              onClick={handleDownloadProperties}
              className="inline-flex h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-[#16A34A] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#15803d]"
            >
              <img
                src={desArcIcon}
                alt=""
                className="h-5 w-5 shrink-0"
                aria-hidden="true"
              />
              <span>Descargar Excel</span>
            </button>
          </div>
        </div>
      </FilterCard>

      {/* Tabla */}
      <PropertiesTable
        data={finalDisplayProperties}
        isLoading={isLoading}
        canEdit={canEdit}
        canDelete={canDelete}
        onDelete={openDeleteModal}
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
