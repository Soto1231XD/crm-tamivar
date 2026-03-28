import { useEffect, useMemo, useState } from "react";
import { BaseTable, type ColumnDef } from "@/components/ui/BaseTable";
import {
  FilterCard,
  FilterDateInput,
  FilterSearchInput,
  FilterSelect,
} from "@/components/ui/AppFilters";
import type { MovementRecord } from "@/interfaces/movement.interface";
import { getMovements } from "../services/movements.api";

const PAGE_SIZE = 10;
const METHOD_OPTIONS = ["Todos", "GET", "POST", "PATCH", "DELETE"];
const MODULE_LABELS: Record<string, string> = {
  auth: "Autenticacion",
  users: "Usuarios",
  roles: "Roles",
  properties: "Propiedades",
  registros: "Registros",
  blogs: "Blogs",
  dashboard: "Dashboard",
  movimientos: "Movimientos",
};

function normalizeMovementText(value?: string | null): string {
  if (!value) return "";

  return value
    .replaceAll("CreÃƒÂ³", "Creo")
    .replaceAll("EditÃƒÂ³", "Edito")
    .replaceAll("ActualizÃƒÂ³", "Actualizo")
    .replaceAll("EliminÃƒÂ³", "Elimino")
    .replaceAll("RealizÃƒÂ³", "Realizo")
    .replaceAll("realizÃ³", "realizo")
    .replaceAll("Ã¡", "a")
    .replaceAll("Ã©", "e")
    .replaceAll("Ã­", "i")
    .replaceAll("Ã³", "o")
    .replaceAll("Ãº", "u")
    .replaceAll("Ã±", "n");
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getMethodBadgeClass(method: string): string {
  const normalized = method.toUpperCase();

  if (normalized === "GET") return "bg-sky-100 text-sky-700";
  if (normalized === "POST") return "bg-emerald-100 text-emerald-700";
  if (normalized === "PATCH") return "bg-amber-100 text-amber-700";
  if (normalized === "DELETE") return "bg-rose-100 text-rose-700";

  return "bg-slate-100 text-slate-700";
}

function getStatusBadgeClass(statusCode: number): string {
  if (statusCode >= 200 && statusCode < 300) {
    return "bg-emerald-100 text-emerald-700";
  }
  if (statusCode >= 400 && statusCode < 500) {
    return "bg-amber-100 text-amber-700";
  }
  if (statusCode >= 500) {
    return "bg-rose-100 text-rose-700";
  }

  return "bg-slate-100 text-slate-700";
}

function getModuleLabel(module?: string | null): string {
  if (!module) return "Sin modulo";
  return MODULE_LABELS[module] ?? module;
}

function getActionLabel(action?: string | null): string {
  if (!action) return "Accion";

  const normalized = action.trim().toLowerCase();
  if (normalized === "crear") return "Creacion";
  if (normalized === "editar") return "Edicion";
  if (normalized === "actualizar") return "Actualizacion";
  if (normalized === "eliminar") return "Eliminacion";

  return action;
}

function getMethodLabel(method: string): string {
  const normalized = method.toUpperCase();
  if (normalized === "POST") return "Creacion";
  if (normalized === "PATCH") return "Edicion";
  if (normalized === "PUT") return "Actualizacion";
  if (normalized === "DELETE") return "Eliminacion";
  if (normalized === "GET") return "Consulta";
  return method;
}

export function MovementsPage() {
  const [movements, setMovements] = useState<MovementRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let isMounted = true;

    async function loadMovements() {
      setIsLoading(true);
      setError("");

      try {
        const data = await getMovements({
          modulo: moduleFilter || undefined,
          metodo: methodFilter || undefined,
          desde: fromDate || undefined,
          hasta: toDate || undefined,
        });

        if (isMounted) {
          setMovements(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "No fue posible cargar los movimientos.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadMovements();

    return () => {
      isMounted = false;
    };
  }, [moduleFilter, methodFilter, fromDate, toDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, moduleFilter, methodFilter, fromDate, toDate]);

  const moduleOptions = useMemo(() => {
    const values = Array.from(
      new Set(
        movements
          .map((movement) => movement.modulo?.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    ).sort((a, b) => a.localeCompare(b));

    return ["Todos", ...values];
  }, [movements]);

  const filteredMovements = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return movements;
    }

      return movements.filter((movement) => {
        const haystack = [
          movement.ruta,
          movement.modulo,
          getModuleLabel(movement.modulo),
          movement.accion,
          getActionLabel(movement.accion),
          normalizeMovementText(movement.descripcion),
          movement.usuario?.nombres,
          movement.usuario?.correo_electronico,
          movement.metodo,
          getMethodLabel(movement.metodo),
          String(movement.statusCode),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [movements, search]);

  const totalPages = Math.max(1, Math.ceil(filteredMovements.length / PAGE_SIZE));

  const paginatedMovements = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredMovements.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredMovements]);

  const columns = useMemo<ColumnDef<MovementRecord>[]>(
    () => [
      {
        header: "Fecha",
        render: (movement) => (
          <div className="min-w-[155px] text-left">
            <p className="font-semibold text-slate-900">
              {formatDate(movement.creado_en)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              ID #{movement.id}
            </p>
          </div>
        ),
      },
      {
        header: "Usuario",
        render: (movement) => (
          <div className="min-w-[200px] text-left">
            <p className="font-semibold text-slate-900">
              {movement.usuario?.nombres ?? "Sistema"}
            </p>
            <p className="mt-1 break-words text-xs text-slate-500">
              {movement.usuario?.correo_electronico ?? "Sin correo asociado"}
            </p>
          </div>
        ),
        cellClassName: "whitespace-normal break-words",
      },
      {
        header: "Tipo",
        render: (movement) => (
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getMethodBadgeClass(
              movement.metodo,
            )}`}
          >
            {getMethodLabel(movement.metodo)}
          </span>
        ),
      },
      {
        header: "Modulo",
        render: (movement) => (
          <span className="font-medium text-slate-700">
            {getModuleLabel(movement.modulo)}
          </span>
        ),
      },
      {
        header: "Movimiento",
        render: (movement) => (
          <div className="min-w-[260px] text-left">
            <p className="font-medium text-slate-900">
              {normalizeMovementText(movement.descripcion) || "Accion realizada"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {getActionLabel(movement.accion)} | {movement.ruta}
            </p>
          </div>
        ),
        cellClassName: "whitespace-normal break-words",
      },
      {
        header: "Detalle",
        render: (movement) => (
          <div className="max-w-[320px] text-left">
            <p className="whitespace-normal break-words text-sm text-slate-600">
              {movement.usuario?.nombres
                ? `${movement.usuario.nombres} realizó un movimiento en ${getModuleLabel(
                    movement.modulo,
                  ).toLowerCase()}.`
                : "Movimiento ejecutado por el sistema."}
            </p>
          </div>
        ),
        cellClassName: "whitespace-normal break-words",
      },
      {
        header: "Status",
        render: (movement) => (
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(
              movement.statusCode,
            )}`}
          >
            {movement.statusCode}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="min-w-0 space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Bitacora del sistema
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-[2rem]">
          Movimientos
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Consulta el historial de actividad del CRM con descripciones claras
          sobre lo que hizo cada usuario, en que modulo y cuando ocurrio.
        </p>
      </header>

      <FilterCard
        description="Busca por usuario, modulo o accion realizada y filtra por tipo y fechas para ubicar movimientos mas rapido."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <FilterSearchInput
            placeholder="Buscar en movimientos"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="xl:col-span-2"
          />

          <FilterSelect
            value={moduleFilter || "Todos"}
            onChange={(event) =>
              setModuleFilter(
                event.target.value === "Todos" ? "" : event.target.value,
              )
            }
          >
            {moduleOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            value={methodFilter || "Todos"}
            onChange={(event) =>
              setMethodFilter(
                event.target.value === "Todos" ? "" : event.target.value,
              )
            }
          >
            {METHOD_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </FilterSelect>

          <FilterDateInput
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
          />

          <FilterDateInput
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
          />
        </div>
      </FilterCard>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <BaseTable
          data={paginatedMovements}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="No se encontraron movimientos con los filtros seleccionados."
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          tableClassName="min-w-[1080px] text-center"
        />
      </section>
    </div>
  );
}
