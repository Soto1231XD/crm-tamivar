import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getReadableErrorMessage } from "@/shared/utils/errorMessages";
import { useNavigate } from "react-router-dom";
import type { PropertyRecord } from "@/interfaces/property.interface";
import { useAuthStore } from "@/shared/auth/useAuthStore";
import { isSalesAdvisorOnly } from "@/shared/auth/role.utils";
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
import {
  getPaginatedProperties,
  getPropertyFilterOptions,
} from "../services/properties.api";

const COMMISSION_CALCULATOR_URL = "https://tamivar-tabulador.netlify.app/";
const PAGE_SIZE = 10;

export function PropertiesPage() {
  const navigate = useNavigate();
  const { can } = useHasPermission();
  const user = useAuthStore((state) => state.user);

  const {
    filteredProperties,
    filters,
    setFilters,
    totalPages,
    totalItems,
    isLoading,
    fetchProperties,
    removeProperty,
  } = usePropertiesStore();

  const [search, setSearch] = useState(filters.search ?? "");
  const [currentPage, setCurrentPage] = useState(filters.page ?? 1);
  const [municipalityOptions, setMunicipalityOptions] = useState<string[]>([
    "Todos los municipios",
  ]);
  const [deletingProperty, setDeletingProperty] =
    useState<PropertyRecord | null>(null);

  const canEdit = can("propiedades", "actualizar");
  const canCreate = can("propiedades", "crear");
  const canDelete = can("propiedades", "eliminar");
  const isSalesAdvisorView = user ? isSalesAdvisorOnly(user) : false;
  const visibleStatusOptions = isSalesAdvisorView
    ? STATUS_OPTIONS.filter((option) => option !== "Interno")
    : STATUS_OPTIONS;

  useEffect(() => {
    let isMounted = true;

    getPropertyFilterOptions()
      .then((response) => {
        if (!isMounted) return;
        setMunicipalityOptions([
          "Todos los municipios",
          ...response.municipios,
        ]);
      })
      .catch(() => {
        if (!isMounted) return;
        setMunicipalityOptions(["Todos los municipios"]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isSalesAdvisorView && filters.estatus === "Interno") {
      setFilters({ estatus: "Todos los estados", page: 1 });
    }
  }, [filters.estatus, isSalesAdvisorView, setFilters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    filters.estatus,
    filters.tipo_inmueble,
    filters.direccionMunicipio,
    filters.exclusiva,
    filters.tipo_operacion,
    filters.minPrecio,
    filters.maxPrecio,
  ]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchProperties({ page: currentPage, limit: PAGE_SIZE });
    }, 200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    fetchProperties,
    currentPage,
    filters.estatus,
    filters.tipo_inmueble,
    filters.direccionMunicipio,
    filters.exclusiva,
    filters.tipo_operacion,
    filters.minPrecio,
    filters.maxPrecio,
    filters.search,
  ]);

  function openDeleteModal(property: PropertyRecord) {
    setDeletingProperty(property);
  }

  function closeDeleteModal() {
    setDeletingProperty(null);
  }

  async function handleDelete(propertyId: number): Promise<string | null> {
    try {
      const nextPage =
        filteredProperties.length === 1 && currentPage > 1
          ? currentPage - 1
          : currentPage;

      await removeProperty(propertyId);
      setDeletingProperty(null);

      if (nextPage !== currentPage) {
        setCurrentPage(nextPage);
      } else {
        await fetchProperties({ page: nextPage, limit: PAGE_SIZE });
      }

      toast.success("La propiedad se elimino con éxito.");
      return null;
    } catch (error) {
      toast.error(
        getReadableErrorMessage(
          error,
          "No fue posible eliminar la propiedad.",
        ),
      );
      return error instanceof Error
        ? error.message
        : "No fue posible eliminar la propiedad.";
    }
  }

  async function handleDownloadProperties() {
    try {
      const response = await getPaginatedProperties({
        ...filters,
        search: search.trim() || undefined,
        page: 1,
        limit: Math.max(totalItems, PAGE_SIZE),
      });
      downloadPropertiesAsExcel(response.data);
    } catch (error) {
      toast.error(
        getReadableErrorMessage(
          error,
          "No fue posible descargar las propiedades.",
        ),
      );
    }
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
        <div className="grid grid-cols-1 gap-3 items-start sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {!isSalesAdvisorView && (
            <FilterSelect
              value={filters.estatus || "Todos los estados"}
              onChange={(e) => setFilters({ estatus: e.target.value, page: 1 })}
            >
              {visibleStatusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </FilterSelect>
          )}

          <FilterSelect
            value={filters.tipo_inmueble || "Todos los tipos"}
            onChange={(e) =>
              setFilters({ tipo_inmueble: e.target.value, page: 1 })
            }
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            value={filters.direccionMunicipio || "Todos los municipios"}
            onChange={(e) =>
              setFilters({ direccionMunicipio: e.target.value, page: 1 })
            }
          >
            {municipalityOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            value={filters.exclusiva || "Todas las exclusividades"}
            onChange={(e) => setFilters({ exclusiva: e.target.value, page: 1 })}
          >
            {EXCLUSIVE_FILTER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            value={filters.tipo_operacion || "Todas las operaciones"}
            onChange={(e) =>
              setFilters({ tipo_operacion: e.target.value, page: 1 })
            }
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
            onChange={(val) => setFilters({ minPrecio: val, page: 1 })}
          />

          <FilterPriceInput
            placeholder="Precio máximo"
            value={filters.maxPrecio}
            onChange={(val) => setFilters({ maxPrecio: val, page: 1 })}
          />

          <div className="sm:col-span-2 xl:col-span-3">
            <FilterSearchInput
              type="text"
              placeholder="Buscar por título o calle"
              value={search}
              onChange={(event) => {
                const value = event.target.value;
                setSearch(value);
                setFilters({ search: value, page: 1 });
              }}
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

      <PropertiesTable
        data={filteredProperties}
        isLoading={isLoading}
        canEdit={canEdit}
        canDelete={canDelete}
        onDelete={openDeleteModal}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        statusOptions={visibleStatusOptions}
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
