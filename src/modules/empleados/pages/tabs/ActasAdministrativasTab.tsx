import { BaseTable } from "@/components/ui/BaseTable";
import agregarIcon from "@/assets/images/Agregar.png";
import type { Empleado } from "../../services/empleados.api";
import type { ActaAdministrativa } from "../../services/actas-administrativas.api";
import { generarActaAdministrativa } from "../../utils/documentos-rh/doc-acta-administrativa";
import { generarActaHechos } from "../../utils/documentos-rh/doc-acta-hechos";
import { generarActaDisciplinaria } from "../../utils/documentos-rh/doc-acta-disciplinaria";
import { generarPlanMejora } from "../../utils/documentos-rh/doc-plan-mejora";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

const TIPO_LABEL: Record<string, string> = {
  voluntaria:    "Voluntaria",
  hechos:        "Acta de Hechos",
  disciplinaria: "Disciplinaria",
  pip:           "Plan de Mejora",
};

interface Props {
  actas: ActaAdministrativa[];
  loading: boolean;
  empleado: Empleado;
  canEdit: boolean;
  onAdd: () => void;
  onEdit: (a: ActaAdministrativa) => void;
  onDelete: (a: ActaAdministrativa) => void;
}

export function ActasAdministrativasTab({ actas, loading, empleado, canEdit, onAdd, onEdit, onDelete }: Props) {

  function handleDescargar(a: ActaAdministrativa) {
    let gen: Promise<unknown>;
    if (a.tipo === "hechos") {
      gen = generarActaHechos(empleado, a);
    } else if (a.tipo === "disciplinaria") {
      gen = generarActaDisciplinaria(empleado, a);
    } else if (a.tipo === "pip") {
      gen = generarPlanMejora(empleado, a);
    } else {
      gen = generarActaAdministrativa(empleado, a);
    }
    gen.catch((e) => alert("Error al generar el documento: " + (e?.message ?? e)));
  }

  const columns = [
    {
      header: "Tipo",
      render: (a: ActaAdministrativa) => (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
          a.tipo === "hechos"        ? "bg-amber-50 text-amber-700"
          : a.tipo === "disciplinaria" ? "bg-red-50 text-red-700"
          : a.tipo === "pip"           ? "bg-blue-50 text-blue-700"
          : "bg-purple-50 text-purple-700"
        }`}>
          {TIPO_LABEL[a.tipo] ?? a.tipo}
        </span>
      ),
    },
    { header: "Fecha del acta",  render: (a: ActaAdministrativa) => formatDate(a.fecha_acta ?? null) },
    { header: "Fecha de hechos", render: (a: ActaAdministrativa) => formatDate(a.fecha_hechos) },
    { header: "Hora",            render: (a: ActaAdministrativa) => `${a.hora_inicio} – ${a.hora_cierre}` },
    {
      header: "Testigo",
      render: (a: ActaAdministrativa) => {
        if (a.tipo === "pip") return "—";
        if (a.tipo === "disciplinaria") {
          try {
            const arr = JSON.parse(a.testigo_nombre ?? "[]") as string[];
            return arr.filter(Boolean).join(" / ") || "—";
          } catch { return a.testigo_nombre ?? "—"; }
        }
        return a.testigo_nombre ?? (a.tipo === "hechos" ? "Jenny Rivera" : "—");
      },
    },
    {
      header: "Documento",
      render: (a: ActaAdministrativa) => (
        <button
          type="button"
          onClick={() => handleDescargar(a)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Descargar
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-2 rounded-xl bg-[#312C85] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2a2570]"
          >
            <img src={agregarIcon} alt="" className="h-4 w-4" />
            Nueva acta
          </button>
        </div>
      )}

      <BaseTable
        columns={columns}
        data={actas}
        isLoading={loading}
        emptyMessage="Sin actas administrativas registradas"
        onEdit={canEdit ? onEdit : undefined}
        onDelete={canEdit ? onDelete : undefined}
      />
    </div>
  );
}
