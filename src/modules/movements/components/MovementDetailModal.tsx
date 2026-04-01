import type { MovementRecord } from "@/interfaces/movement.interface";
import {
  formatChangedFieldLabel,
  formatMovementValue,
  getActionLabel,
  getChangedFields,
  getMethodBadgeClass,
  getMethodLabel,
  getModuleLabel,
  getMovementSnapshotSections,
  getMovementSummaryItems,
  getStatusBadgeClass,
  getStatusLabel,
  normalizeMovementText,
} from "../utils/movements.utils";

type MovementDetailModalProps = {
  movement: MovementRecord | null;
  onClose: () => void;
};

function SnapshotSection({
  title,
  items,
}: {
  title: string;
  items: Array<{ key: string; label: string; value: string }>;
}) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <div
            key={`${title}-${item.key}`}
            className="rounded-xl border border-slate-200 bg-white p-3"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {item.label}
            </p>
            <pre className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-700">
              {item.value}
            </pre>
          </div>
        ))}
      </div>
    </section>
  );
}

export function MovementDetailModal({
  movement,
  onClose,
}: MovementDetailModalProps) {
  if (!movement) return null;

  const changedFields = getChangedFields(movement);
  const { before, after } = getMovementSnapshotSections(movement);
  const summaryItems = getMovementSummaryItems(movement);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Detalle del movimiento
            </p>
            <h3 className="mt-2 text-2xl font-bold text-slate-900">
              {normalizeMovementText(movement.descripcion) || "Accion realizada"}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Aquí puedes revisar el contexto completo del movimiento y los
              datos guardados de una forma mas clara y fácil de entender.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Cerrar
          </button>
        </div>

        <div className="max-h-[calc(90vh-110px)] space-y-6 overflow-y-auto px-6 py-6">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {summaryItems.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {item.label}
                </p>
                <p className="mt-2 break-words text-sm font-medium text-slate-900">
                  {item.value}
                </p>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getMethodBadgeClass(
                  movement.metodo,
                )}`}
              >
                {getMethodLabel(movement.metodo)}
              </span>
              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                {getModuleLabel(movement.modulo)}
              </span>
              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                {getActionLabel(movement.accion)}
              </span>
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(
                  movement.statusCode,
                )}`}
              >
                {getStatusLabel(movement.statusCode)}
              </span>
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold text-slate-900">
                Cambios realizados
              </h4>
              <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                {changedFields.length} cambio{changedFields.length === 1 ? "" : "s"}
              </span>
            </div>

            {changedFields.length === 0 ? (
              <p className="text-sm text-slate-600">
                Este movimiento no trae suficiente información para comparar un
                antes y un después con precision. Aun asi puedes revisar el
                resumen general y los datos guardados mas abajo.
              </p>
            ) : (
              <div className="space-y-3">
                {changedFields.map((field, index) => (
                  <div
                    key={`${field.campo}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {formatChangedFieldLabel(field.campo)}
                    </p>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">
                          Valor anterior
                        </p>
                        <pre className="mt-2 whitespace-pre-wrap break-words text-sm text-rose-900">
                          {formatMovementValue(field.antes, field.campo)}
                        </pre>
                      </div>
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                          Valor nuevo
                        </p>
                        <pre className="mt-2 whitespace-pre-wrap break-words text-sm text-emerald-900">
                          {formatMovementValue(field.despues, field.campo)}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <SnapshotSection title="Información previa al movimiento" items={before} />
          <SnapshotSection title="Información posterior al movimiento" items={after} />
        </div>
      </div>
    </div>
  );
}
