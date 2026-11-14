import type { Empleado } from "../../services/empleados.api";
import type { Falta } from "../../services/faltas.api";
import type { Vacacion } from "../../services/vacaciones.api";
import type { PermisoEmpleado } from "../../services/permisos.api";
import type { Incapacidad } from "../../services/incapacidades.api";
import type { Baja } from "../../services/bajas.api";
import type { Amonestacion } from "../../services/amonestaciones.api";
import { calcularAntigüedad, calcularDerechoVacaciones } from "../../services/vacaciones.api";

function formatDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

interface Props {
  empleado: Empleado;
  faltas: Falta[];
  vacaciones: Vacacion[];
  permisos: PermisoEmpleado[];
  incapacidades: Incapacidad[];
  bajas: Baja[];
  amonestaciones: Amonestacion[];
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">{title}</h3>
      {children}
    </div>
  );
}

function StatRow({ label, value, color = "text-slate-800" }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm font-semibold ${color}`}>{value}</span>
    </div>
  );
}

export function ReporteTab({ empleado, faltas, vacaciones, permisos, incapacidades, bajas, amonestaciones }: Props) {
  const antiguedad     = calcularAntigüedad(empleado.fecha_ingreso);
  const derechoVac     = calcularDerechoVacaciones(antiguedad);
  const vacAprobadas   = vacaciones.filter((v) => v.estatus === "Aprobada" || v.estatus === "Pendiente").reduce((s, v) => s + v.dias, 0);
  const vacDisponibles = Math.max(0, derechoVac - vacAprobadas);

  const faltasJust   = faltas.filter((f) => f.tipo === "Justificada").length;
  const faltasInjust = faltas.filter((f) => f.tipo === "Injustificada").length;

  const permisosConGoce = permisos.filter((p) => p.con_goce).length;
  const permisosSinGoce = permisos.filter((p) => !p.con_goce).length;

  const diasIncap = incapacidades.reduce((s, i) => s + i.dias, 0);
  const incIMSS   = incapacidades.filter((i) => i.tipo === "IMSS").length;
  const incPart   = incapacidades.filter((i) => i.tipo === "Particular").length;

  const ultimaBaja = bajas.length > 0
    ? [...bajas].sort((a, b) => new Date(b.fecha_baja).getTime() - new Date(a.fecha_baja).getTime())[0]
    : null;

  const amonVerbales     = amonestaciones.filter((a) => a.tipo === "Verbal").length;
  const amonEscritas     = amonestaciones.filter((a) => a.tipo === "Escrita").length;
  const amonSuspensiones = amonestaciones.filter((a) => a.tipo === "Suspensión").length;

  const handlePrint = () => {
    const fecha = new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
    const nombreCompleto = `${empleado.nombre} ${empleado.apellido_paterno} ${empleado.apellido_materno}`;

    const row = (label: string, value: string | number) =>
      `<tr><td class="label">${label}</td><td class="value">${value}</td></tr>`;

    const card = (title: string, rows: string) =>
      `<div class="card"><h3>${title}</h3><table>${rows}</table></div>`;

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Reporte Individual – ${nombreCompleto}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1e293b; padding: 32px; }
    h1 { font-size: 18px; font-weight: 700; color: #0f172a; }
    .meta { font-size: 11px; color: #64748b; margin-top: 4px; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    @media print { .grid { grid-template-columns: repeat(3, 1fr); } }
    .card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; }
    .card h3 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #64748b; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 4px 0; vertical-align: top; }
    td.label { color: #64748b; width: 55%; }
    td.value { font-weight: 600; color: #0f172a; text-align: right; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>${nombreCompleto}</h1>
  <p class="meta">Reporte al ${fecha} · ${empleado.puesto} · ${empleado.area}</p>
  <div class="grid">
    ${card("Datos generales", [
      row("Fecha de ingreso", formatDate(empleado.fecha_ingreso)),
      row("Antigüedad", `${antiguedad} año${antiguedad !== 1 ? "s" : ""}`),
      row("Estatus", empleado.estatus),
      ...(empleado.tipo_sangre ? [row("Tipo de sangre", empleado.tipo_sangre)] : []),
      ...(empleado.contacto_emergencia_nombre ? [row("Contacto emergencia", empleado.contacto_emergencia_nombre)] : []),
      ...(empleado.contacto_emergencia_telefono ? [row("Tel. emergencia", empleado.contacto_emergencia_telefono)] : []),
    ].join(""))}
    ${card("Vacaciones", [
      row("Derecho LFT", `${derechoVac} días`),
      row("Días tomados", `${vacAprobadas} días`),
      row("Días disponibles", `${vacDisponibles} días`),
      row("Períodos registrados", vacaciones.length),
    ].join(""))}
    ${card("Faltas", [
      row("Total de faltas", faltas.length),
      row("Justificadas", faltasJust),
      row("Injustificadas", faltasInjust),
    ].join(""))}
    ${card("Permisos", [
      row("Total de permisos", permisos.length),
      row("Con goce de sueldo", permisosConGoce),
      row("Sin goce de sueldo", permisosSinGoce),
      row("Aprobados", permisos.filter((p) => p.estatus === "Aprobado").length),
      row("Pendientes", permisos.filter((p) => p.estatus === "Pendiente").length),
    ].join(""))}
    ${card("Incapacidades", [
      row("Total", incapacidades.length),
      row("Días totales", `${diasIncap} días`),
      row("IMSS", incIMSS),
      row("Particulares", incPart),
      row("Aprobadas", incapacidades.filter((i) => i.estatus === "Aprobada").length),
    ].join(""))}
    ${card("Bajas", bajas.length === 0
      ? row("Bajas registradas", "Ninguna")
      : [
          row("Total de bajas", bajas.length),
          ...(ultimaBaja ? [
            row("Última baja", formatDate(ultimaBaja.fecha_baja)),
            row("Tipo", ultimaBaja.tipo),
          ] : []),
        ].join("")
    )}
    ${card("Amonestaciones", amonestaciones.length === 0
      ? row("Amonestaciones", "Ninguna")
      : [
          row("Total", amonestaciones.length),
          row("Verbales", amonVerbales),
          row("Escritas", amonEscritas),
          row("Suspensiones", amonSuspensiones),
        ].join("")
    )}
  </div>
  <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); };<\/script>
</body>
</html>`;

    const win = window.open("", "_blank", "width=900,height=700");
    if (win) { win.document.write(html); win.document.close(); }
  };

  const nombreCompleto = `${empleado.nombre} ${empleado.apellido_paterno} ${empleado.apellido_materno}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[var(--crm-text)]">
          Reporte al {new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })}
        </p>
        <button
          type="button"
          onClick={handlePrint}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          Imprimir
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Section title="Datos generales">
          <StatRow label="Nombre"          value={nombreCompleto} />
          <StatRow label="Puesto"           value={empleado.puesto} />
          <StatRow label="Área"             value={empleado.area} />
          <StatRow label="Fecha de ingreso" value={formatDate(empleado.fecha_ingreso)} />
          <StatRow label="Antigüedad"       value={`${antiguedad} año${antiguedad !== 1 ? "s" : ""}`} color="text-[#312C85]" />
          <StatRow
            label="Estatus"
            value={empleado.estatus}
            color={empleado.estatus === "Activo" ? "text-green-600" : "text-red-600"}
          />
          {empleado.tipo_sangre && <StatRow label="Tipo de sangre" value={empleado.tipo_sangre} color="text-red-600" />}
          {empleado.contacto_emergencia_nombre && <StatRow label="Contacto emergencia" value={empleado.contacto_emergencia_nombre} />}
          {empleado.contacto_emergencia_telefono && <StatRow label="Tel. emergencia" value={empleado.contacto_emergencia_telefono} />}
        </Section>

        <Section title="Vacaciones">
          <StatRow label="Derecho LFT"      value={`${derechoVac} días`}      color="text-[#312C85]" />
          <StatRow label="Días tomados"      value={`${vacAprobadas} días`}    color="text-amber-600" />
          <StatRow label="Días disponibles"  value={`${vacDisponibles} días`}  color={vacDisponibles > 0 ? "text-green-600" : "text-red-600"} />
          <StatRow label="Períodos registrados" value={vacaciones.length} />
        </Section>

        <Section title="Faltas">
          <StatRow label="Total de faltas"  value={faltas.length}  color={faltas.length > 0 ? "text-red-600" : "text-slate-800"} />
          <StatRow label="Justificadas"     value={faltasJust}     color={faltasJust > 0 ? "text-blue-600" : "text-slate-800"} />
          <StatRow label="Injustificadas"   value={faltasInjust}   color={faltasInjust > 0 ? "text-red-600" : "text-slate-800"} />
        </Section>

        <Section title="Permisos">
          <StatRow label="Total de permisos"  value={permisos.length} />
          <StatRow label="Con goce de sueldo" value={permisosConGoce} color="text-green-600" />
          <StatRow label="Sin goce de sueldo" value={permisosSinGoce} color={permisosSinGoce > 0 ? "text-amber-600" : "text-slate-800"} />
          <StatRow label="Aprobados"          value={permisos.filter((p) => p.estatus === "Aprobado").length}  color="text-green-600" />
          <StatRow label="Pendientes"         value={permisos.filter((p) => p.estatus === "Pendiente").length} color="text-amber-600" />
          <StatRow label="Rechazados"         value={permisos.filter((p) => p.estatus === "Rechazado").length} color={permisos.filter((p) => p.estatus === "Rechazado").length > 0 ? "text-red-600" : "text-slate-800"} />
        </Section>

        <Section title="Incapacidades">
          <StatRow label="Total de incapacidades" value={incapacidades.length} />
          <StatRow label="Días totales"            value={`${diasIncap} días`} color={diasIncap > 0 ? "text-amber-600" : "text-slate-800"} />
          <StatRow label="IMSS"                    value={incIMSS}  color="text-blue-600" />
          <StatRow label="Particulares"            value={incPart}  color="text-purple-600" />
          <StatRow label="Aprobadas"               value={incapacidades.filter((i) => i.estatus === "Aprobada").length}  color="text-green-600" />
          <StatRow label="Pendientes"              value={incapacidades.filter((i) => i.estatus === "Pendiente").length} color="text-amber-600" />
        </Section>

        <Section title="Bajas">
          {bajas.length === 0 ? (
            <p className="py-2 text-sm text-slate-400">Sin bajas registradas</p>
          ) : (
            <>
              <StatRow label="Total de bajas" value={bajas.length} />
              {ultimaBaja && (
                <>
                  <StatRow label="Última baja" value={formatDate(ultimaBaja.fecha_baja)} />
                  <StatRow
                    label="Tipo"
                    value={ultimaBaja.tipo}
                    color={ultimaBaja.tipo === "Despido" ? "text-red-600" : "text-amber-600"}
                  />
                  {ultimaBaja.descripcion && (
                    <div className="mt-2 rounded-lg bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">{ultimaBaja.descripcion}</p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </Section>

        <Section title="Amonestaciones">
          {amonestaciones.length === 0 ? (
            <p className="py-2 text-sm text-slate-400">Sin amonestaciones registradas</p>
          ) : (
            <>
              <StatRow label="Total"        value={amonestaciones.length} color="text-orange-600" />
              <StatRow label="Verbales"     value={amonVerbales}     color={amonVerbales    > 0 ? "text-amber-600"  : "text-slate-800"} />
              <StatRow label="Escritas"     value={amonEscritas}     color={amonEscritas    > 0 ? "text-orange-600" : "text-slate-800"} />
              <StatRow label="Suspensiones" value={amonSuspensiones} color={amonSuspensiones > 0 ? "text-red-600"   : "text-slate-800"} />
            </>
          )}
        </Section>
      </div>
    </div>
  );
}
