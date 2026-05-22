import { useThemeStore } from "@/shared/theme/useThemeStore";
import blogsIcon from "../../../assets/images/Blogs.png";
import propertyAvailableIcon from "../../../assets/images/Propiety.png";
import propertySoldIcon from "../../../assets/images/PropetySell.png";
import systemRolesIcon from "../../../assets/images/Roles.png";
import systemUsersIcon from "../../../assets/images/System.png";
import leadsIcon from "../../../assets/images/users.png";

type DashboardSummaryCardsProps = {
  titles: readonly string[];
  values: Record<string, string | number>;
  isLoading: boolean;
};

const DASHBOARD_CARD_ICONS: Partial<Record<string, string>> = {
  "Propiedades Disponibles": propertyAvailableIcon,
  "Registros visitas": leadsIcon,
  "Registros leads": leadsIcon,
  "Propiedades vendidas": propertySoldIcon,
  Blogs: blogsIcon,
  "Usuarios del sistema": systemUsersIcon,
  "Roles del sistema": systemRolesIcon,
};

export function DashboardSummaryCards({
  titles,
  values,
  isLoading,
}: DashboardSummaryCardsProps) {
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === "dark";

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {titles.map((title) => (
        <article
          key={title}
          className={[
            "group relative overflow-hidden rounded-3xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
            isDark
              ? "border border-slate-700/70 bg-slate-900/90 shadow-[0_20px_45px_rgba(2,6,23,0.28)]"
              : "border border-slate-200/80 bg-white shadow-sm",
          ].join(" ")}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(79,94,248,0.45),transparent)]" />
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p
                className={[
                  "text-xs font-semibold uppercase tracking-[0.18em]",
                  isDark ? "text-slate-400" : "text-slate-500",
                ].join(" ")}
              >
                Resumen
              </p>
              <h3
                className={[
                  "mt-2 text-sm font-semibold",
                  isDark ? "text-slate-200" : "text-slate-700",
                ].join(" ")}
              >
                {title}
              </h3>
              <p
                className={[
                  "mt-5 text-3xl font-black tracking-tight sm:text-[2rem]",
                  isDark ? "text-white" : "text-slate-950",
                ].join(" ")}
              >
                {isLoading ? "..." : (values[title] ?? 0)}
              </p>
            </div>

            {DASHBOARD_CARD_ICONS[title] ? (
              <div
                className={[
                  "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl transition-colors",
                  isDark
                    ? "bg-[linear-gradient(180deg,#172554,#111827)] ring-1 ring-inset ring-slate-700 group-hover:bg-[linear-gradient(180deg,#1e3a8a,#172554)]"
                    : "bg-[linear-gradient(180deg,#F8FAFC,#EEF2FF)] ring-1 ring-inset ring-slate-200 group-hover:bg-[linear-gradient(180deg,#F8FAFC,#E6EBFF)]",
                ].join(" ")}
              >
                <img
                  src={DASHBOARD_CARD_ICONS[title]}
                  alt=""
                  className="h-10 w-10 shrink-0 object-contain"
                  aria-hidden="true"
                />
              </div>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
