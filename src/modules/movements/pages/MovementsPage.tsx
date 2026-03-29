import { useEffect, useMemo, useState } from "react";
import { BaseTable, type ColumnDef } from "@/components/ui/BaseTable";
import type { MovementRecord } from "@/interfaces/movement.interface";
import { MovementsFilters } from "../components/MovementsFilters";
import { getMovements } from "../services/movements.api";
import {
  downloadMovementsAsExcel,
  formatDate,
  getActionLabel,
  getMethodBadgeClass,
  getMethodLabel,
  getModuleLabel,
  getMovementDetailText,
  getStatusBadgeClass,
  normalizeMovementText,
} from "../utils/movements.utils";

const PAGE_SIZE = 10;

export function MovementsPage() {
  const [movements, setMovements] = useState<MovementRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let isMounted = true;

    async function loadMovements() {
      setIsLoading(true);
      setError("");

      try {
        const data = await getMovements();

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
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedDate]);

  const filteredMovements = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return movements.filter((movement) => {
      const matchesUserSearch = !normalizedSearch
        ? true
        : [movement.usuario?.nombres, movement.usuario?.correo_electronico]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearch);

      const movementDate = new Date(movement.creado_en)
        .toISOString()
        .slice(0, 10);
      const matchesDate = selectedDate ? movementDate === selectedDate : true;

      return matchesUserSearch && matchesDate;
    });
  }, [movements, search, selectedDate]);

  const totalPages = Math.max(1, Math.ceil(filteredMovements.length / PAGE_SIZE));

  const paginatedMovements = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredMovements.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredMovements]);

  function handleDownloadMovements() {
    downloadMovementsAsExcel(filteredMovements);
  }

  const columns = useMemo<ColumnDef<MovementRecord>[]>(
    () => [
      {
        header: "Fecha",
        render: (movement) => (
          <div className="min-w-[155px] text-left">
            <p className="font-semibold text-slate-900">
              {formatDate(movement.creado_en)}
            </p>
            <p className="mt-1 text-xs text-slate-500">ID #{movement.id}</p>
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
              {getMovementDetailText(movement)}
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
          Bitácora del sistema
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-[2rem]">
          Movimientos
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Consulta el historial de actividad del CRM con descripciones claras
          sobre lo que hizo cada usuario, en que modulo y cuando ocurrió.
        </p>
      </header>

      <MovementsFilters
        search={search}
        selectedDate={selectedDate}
        hasResults={filteredMovements.length > 0}
        onSearchChange={setSearch}
        onDateChange={setSelectedDate}
        onDownload={handleDownloadMovements}
      />

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
