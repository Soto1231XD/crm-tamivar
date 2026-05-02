import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import type {
  CommercialScheme,
  DevelopmentRecord,
} from "@/interfaces/development.interface";
import {
  FilterCard,
  FilterPriceInput,
  FilterSearchInput,
  FilterSelect,
} from "@/components/ui/AppFilters";
import { useDevelopmentsStore } from "../store/useDevelopmentsStore";
import { DevelopmentsTable } from "../components/DevelopmentsTable";
import { useHasPermission } from "@/shared/auth/permissions/useHasPermission";
import agregarIcon from "@/assets/images/Agregar.png";

const STATUS_OPTIONS = ["Todos los estados", "Disponible", "Apartado", "Vendido", "Baja"];

function getCommercialSchemes(development: DevelopmentRecord): CommercialScheme[] {
  const parentSchemes = Array.isArray(development.esquema_comercial)
    ? development.esquema_comercial
    : [];
  const modelSchemes = (development.modelos ?? []).flatMap((model) =>
    Array.isArray(model.esquema_comercial) ? model.esquema_comercial : [],
  );

  return [...parentSchemes, ...modelSchemes];
}

function getAvailableOperations(developments: DevelopmentRecord[]): string[] {
  return Array.from(
    new Set(
      developments.flatMap((development) =>
        getCommercialSchemes(development)
          .map((scheme) => scheme.tipo_operacion?.trim())
          .filter(Boolean) as string[],
      ),
    ),
  ).sort((left, right) => left.localeCompare(right, "es"));
}

function getLowestPrice(development: DevelopmentRecord): number | null {
  const prices = getCommercialSchemes(development)
    .map((scheme) => Number(scheme.precio))
    .filter((price) => Number.isFinite(price) && price > 0);

  return prices.length > 0 ? Math.min(...prices) : null;
}

function matchesOperation(
  development: DevelopmentRecord,
  selectedOperation: string,
): boolean {
  if (!selectedOperation || selectedOperation === "Todas las operaciones") {
    return true;
  }

  return getCommercialSchemes(development).some(
    (scheme) => scheme.tipo_operacion === selectedOperation,
  );
}

export function DevelopmentsPage() {
  const navigate = useNavigate();
  const { can } = useHasPermission();
  const { developments, isLoading, error, fetchDevelopments, removeDevelopment } =
    useDevelopmentsStore();
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Todos los estados");
  const [selectedType, setSelectedType] = useState("Todos los tipos");
  const [selectedOperation, setSelectedOperation] = useState(
    "Todas las operaciones",
  );
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const canCreate = can("desarrollos", "crear");
  const canDelete = can("desarrollos", "eliminar");

  useEffect(() => {
    fetchDevelopments();
  }, [fetchDevelopments]);

  const typeOptions = useMemo(
    () => [
      "Todos los tipos",
      ...Array.from(
        new Set(
          developments
            .map((development) => development.tipo_inmueble?.trim())
            .filter(Boolean) as string[],
        ),
      ).sort((left, right) => left.localeCompare(right, "es")),
    ],
    [developments],
  );

  const operationOptions = useMemo(
    () => ["Todas las operaciones", ...getAvailableOperations(developments)],
    [developments],
  );

  const filteredDevelopments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return developments.filter((development) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          development.titulo,
          development.slug,
          development.direccion?.fraccionamiento,
          development.direccion?.municipio,
          development.direccion?.estado,
        ]
          .filter(Boolean)
          .some((value) =>
            value!.toString().toLowerCase().includes(normalizedSearch),
          );

      const matchesStatus =
        selectedStatus === "Todos los estados" ||
        development.estatus === selectedStatus;

      const matchesType =
        selectedType === "Todos los tipos" ||
        development.tipo_inmueble === selectedType;

      const matchesSelectedOperation = matchesOperation(
        development,
        selectedOperation,
      );

      const lowestPrice = getLowestPrice(development);
      const matchesMinPrice =
        minPrice == null || (lowestPrice != null && lowestPrice >= minPrice);
      const matchesMaxPrice =
        maxPrice == null || (lowestPrice != null && lowestPrice <= maxPrice);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType &&
        matchesSelectedOperation &&
        matchesMinPrice &&
        matchesMaxPrice
      );
    });
  }, [
    developments,
    maxPrice,
    minPrice,
    search,
    selectedOperation,
    selectedStatus,
    selectedType,
  ]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Catálogo de desarrollos
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-[2rem]">
            Desarrollos
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Consulta el inventario de desarrollos y revisa su esquema comercial,
            ubicación, entrega y número de modelos desde una sola vista.
          </p>
          <p className="mt-3 text-sm text-[#312C85]">
            Esta primera versión ya deja consultar y filtrar desarrollos. La
            carga y edición completa con modelos la seguimos montando sobre esta
            base.
          </p>
        </div>
        <div className="ml-auto flex w-full sm:w-auto">
          <button
            type="button"
            disabled={!canCreate}
            onClick={() => navigate("/modulos/desarrollos/nuevo")}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#312C85] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#27226f] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            <img
              src={agregarIcon}
              alt=""
              className="h-6 w-6 shrink-0"
              aria-hidden="true"
            />
            <span className="whitespace-nowrap">Nuevo desarrollo</span>
          </button>
        </div>
      </header>

      <FilterCard description="Busca por título o ubicación y combina filtros para ubicar desarrollos más rápido.">
        <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <FilterSelect
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value)}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            value={selectedType}
            onChange={(event) => setSelectedType(event.target.value)}
          >
            {typeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            value={selectedOperation}
            onChange={(event) => setSelectedOperation(event.target.value)}
          >
            {operationOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </FilterSelect>

          <FilterPriceInput
            placeholder="Precio mínimo"
            value={minPrice}
            onChange={setMinPrice}
          />

          <FilterPriceInput
            placeholder="Precio máximo"
            value={maxPrice}
            onChange={setMaxPrice}
          />

          <div className="sm:col-span-2 md:col-span-3 lg:col-span-5">
            <FilterSearchInput
              type="text"
              placeholder="Buscar por título, fraccionamiento, municipio o estado"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>
      </FilterCard>

      {error ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 shadow-sm">
          No pudimos cargar los desarrollos en este momento. Detalle: {error}
        </section>
      ) : null}

      <DevelopmentsTable
        data={filteredDevelopments}
        isLoading={isLoading}
        canDelete={canDelete}
        onDelete={handleDeleteDevelopment}
      />
    </div>
  );

  async function handleDeleteDevelopment(development: DevelopmentRecord) {
    const confirmed = window.confirm(
      `¿Deseas eliminar el desarrollo "${development.titulo}"? Esta acción no se puede deshacer.`,
    );

    if (!confirmed) return;

    try {
      await removeDevelopment(development.id);
      toast.success("El desarrollo se eliminó correctamente.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No fue posible eliminar el desarrollo.",
      );
    }
  }
}
