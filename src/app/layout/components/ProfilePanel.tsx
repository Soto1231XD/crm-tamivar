import { getFullImageUrl } from "@/shared/utils/imageUrl";
import type { AppUser } from "@/shared/auth/interfaces/auth.interface";
import { SunIcon, MoonIcon } from "./AppIcons";

type ProfilePanelProps = {
  user: AppUser | null;
  displayName: string;
  primaryRoleDisplay: string;
  isDark: boolean;
  toggleTheme: () => void;
  onClose: () => void;
};

export function ProfilePanel({ user, displayName, primaryRoleDisplay, isDark, toggleTheme, onClose }: ProfilePanelProps) {
  return (
    <div
      className="fixed inset-0 z-[90] bg-slate-950/35 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className={`absolute right-4 top-20 w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-[28px] border shadow-[0_32px_80px_rgba(15,23,42,0.32)] md:right-8 ${
          isDark
            ? "border-slate-700 bg-[linear-gradient(180deg,#0F172A_0%,#111827_100%)] text-slate-100"
            : "border-slate-200 bg-white text-slate-900"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`px-5 pb-5 pt-4 ${
          isDark
            ? "bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.22),transparent_38%),linear-gradient(180deg,#0F172A_0%,#111827_100%)]"
            : "bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_38%),linear-gradient(180deg,#F8FAFC_0%,#FFFFFF_100%)]"
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Perfil rápido
              </p>
              <h3 className={`mt-2 text-xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-950"}`}>
                {displayName}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border text-lg transition ${
                isDark
                  ? "border-slate-700 bg-white/5 text-slate-200 hover:bg-white/10"
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              }`}
              aria-label="Cerrar perfil"
            >
              ×
            </button>
          </div>

          <div className="mt-5 flex items-center gap-4">
            <div className={`flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[24px] text-xl font-bold ${
              isDark
                ? "bg-white/10 text-white ring-1 ring-inset ring-white/10"
                : "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200"
            }`}>
              {user?.foto_url ? (
                <img src={getFullImageUrl(user.foto_url)} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <span>{`${user?.nombres?.[0] || ""}${user?.apellido_paterno?.[0] || ""}`.toUpperCase()}</span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                  isDark
                    ? "bg-sky-500/12 text-sky-200 ring-1 ring-inset ring-sky-400/20"
                    : "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200"
                }`}>
                  {primaryRoleDisplay}
                </span>
                <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                  user?.activo === false
                    ? isDark
                      ? "bg-rose-500/12 text-rose-200 ring-1 ring-inset ring-rose-400/20"
                      : "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200"
                    : isDark
                      ? "bg-emerald-500/12 text-emerald-200 ring-1 ring-inset ring-emerald-400/20"
                      : "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                }`}>
                  {user?.activo === false ? "Inactivo" : "Activo"}
                </span>
              </div>

              {user?.codigo_usuario && (
                <p className={`mt-3 text-sm font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                  ID {user.codigo_usuario}
                </p>
              )}
              <p className={`mt-1 text-sm ${isDark ? "text-slate-300" : "text-slate-500"}`}>
                {user?.correo_electronico || "Sin correo"}
              </p>
            </div>
          </div>
        </div>

        <div className={`px-5 py-5 ${isDark ? "bg-slate-950/25" : "bg-white"}`}>
          <div className={`overflow-hidden rounded-[24px] border ${isDark ? "border-slate-700 bg-slate-900/70" : "border-slate-200 bg-slate-50"}`}>
            <ProfileInfoRow label="Teléfono" value={user?.telefono || "Sin teléfono"} isDark={isDark} />
            <ProfileInfoRow label="Apellido paterno" value={user?.apellido_paterno || "Sin dato"} isDark={isDark} />
            <ProfileInfoRow label="Apellido materno" value={user?.apellido_materno || "Sin dato"} isDark={isDark} />
            <ProfileInfoRow label="Folio de certificación" value={user?.folio_certificacion || "Sin dato"} isDark={isDark} />
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={toggleTheme}
              className={`inline-flex w-full items-center justify-between rounded-[22px] border px-4 py-3.5 text-left transition ${
                isDark
                  ? "border-slate-700 bg-slate-900/70 text-slate-100 hover:bg-slate-900"
                  : "border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100"
              }`}
              aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            >
              <span className="flex items-center gap-3">
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${
                  isDark ? "bg-slate-800 text-slate-100" : "bg-white text-slate-700 ring-1 ring-inset ring-slate-200"
                }`}>
                  {isDark ? <SunIcon className="h-4.5 w-4.5" /> : <MoonIcon className="h-4.5 w-4.5" />}
                </span>
                <span>
                  <span className={`block text-[11px] font-semibold uppercase tracking-[0.16em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Apariencia
                  </span>
                  <span className="mt-1 block text-sm font-semibold">
                    {isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                  </span>
                </span>
              </span>
              <span className={`text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {isDark ? "Claro" : "Oscuro"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileInfoRow({ label, value, isDark }: { label: string; value: string; isDark: boolean }) {
  return (
    <div className={`flex items-start justify-between gap-4 px-4 py-3.5 ${
      isDark ? "border-b border-slate-800 last:border-b-0" : "border-b border-slate-200 last:border-b-0"
    }`}>
      <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
        {label}
      </p>
      <p className={`max-w-[62%] break-words text-right text-sm font-medium leading-6 ${isDark ? "text-slate-200" : "text-slate-800"}`}>
        {value}
      </p>
    </div>
  );
}
