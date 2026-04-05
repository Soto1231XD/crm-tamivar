import { getSoftBadgeStyles } from "@/components/ui/badgeStyles";
import { formatDate } from "../utils/formatters";
import { getFullImageUrl } from "../utils/formatters";

export const PropertyVisitsList = () => {
  const countBadgeStyles = getSoftBadgeStyles("indigo");
  const completedBadgeStyles = getSoftBadgeStyles("green");
  const pendingBadgeStyles = getSoftBadgeStyles("amber");

  const mockVisitas = [
    {
      id: 1,
      nombres: "Carlos Alberto",
      apellidos: "Gómez Pérez",
      telefono: "998 123 4567",
      estado: "Completada",
      fecha_visita: new Date().toISOString(),
      creador: {
        nombres: "Ana",
        foto_url: null,
      },
    },
    {
      id: 2,
      nombres: "María Fernanda",
      apellidos: "López Ruiz",
      telefono: "998 765 4321",
      estado: "Pendiente",
      fecha_visita: new Date(Date.now() - 86400000).toISOString(),
      creador: {
        nombres: "Roberto",
        foto_url: null,
      },
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
      {/* Encabezado del Listado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b-2 border-slate-300">
        <h3 className="text-xl font-bold text-slate-900">
          Historial de Visitas
        </h3>
        <span
          className="rounded-full border px-3 py-1.5 text-xs font-black"
          style={countBadgeStyles}
        >
          {mockVisitas.length} REGISTROS TOTALES
        </span>
      </div>

      <div className="divide-y divide-slate-200">
        {mockVisitas.map((visita) => (
          <div key={visita.id} className="py-6 first:pt-2 last:pb-2 group">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* BLOQUE IZQUIERDO: Datos del Cliente y Visita */}
              <div className="space-y-3 flex-1">
                <h4 className="font-extrabold text-slate-900 text-lg capitalize">
                  {visita.nombres} {visita.apellidos}
                </h4>

                <div className="flex flex-wrap gap-4 items-center text-xs font-bold uppercase tracking-tight">
                  {/* Teléfono */}
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Número de teléfono:</span>
                    <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-300">
                      {visita.telefono}
                    </span>
                  </div>

                  <span className="hidden sm:block text-slate-400">|</span>

                  {/* Fecha de Visita */}
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Fecha de visita:</span>
                    <span className="text-slate-800">
                      {formatDate(visita.fecha_visita)}
                    </span>
                  </div>
                </div>
              </div>

              {/* BLOQUE CENTRAL: Creador */}
              <div className="flex items-center gap-3 bg-slate-100 px-4 py-2.5 rounded-xl border border-slate-300 min-w-[180px]">
                <div className="h-9 w-9 rounded-full overflow-hidden bg-white border-2 border-slate-300 shrink-0 shadow-sm">
                  {visita.creador.foto_url ? (
                    <img
                      src={getFullImageUrl(visita.creador.foto_url)}
                      alt={visita.creador.nombres}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs font-extrabold text-slate-600 bg-slate-200">
                      {visita.creador.nombres[0]}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide leading-none mb-1">
                    Registrado por
                  </p>
                  <p className="text-sm font-extrabold text-slate-900">
                    {visita.creador.nombres}
                  </p>
                </div>
              </div>

              {/* BLOQUE DERECHO: Estado */}
              <div className="flex items-center justify-end min-w-[120px]">
                <span
                  className="w-full rounded-full border px-4 py-2 text-center text-[10px] font-black uppercase tracking-widest shadow-sm sm:w-auto"
                  style={visita.estado === "Completada" ? completedBadgeStyles : pendingBadgeStyles}
                >
                  {visita.estado}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Paginador - CONTRASTES MEJORADOS */}
      <div className="mt-8 pt-6 border-t-2 border-slate-300 flex items-center justify-between">
        <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">
          Página 1 de 1
        </p>
        <div className="flex gap-2">
          {/* Botones deshabilitados más visibles */}
          <button
            disabled
            className="p-2.5 rounded-lg bg-slate-100 text-slate-400 border border-slate-300 cursor-not-allowed"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 font-bold"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            disabled
            className="p-2.5 rounded-lg bg-slate-100 text-slate-400 border border-slate-300 cursor-not-allowed"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 font-bold"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
