import type { ReactNode } from "react";
import { useThemeStore } from "@/shared/theme/useThemeStore";

type DashboardSectionCardProps = {
  title: string;
  hasItems: boolean;
  emptyMessage: string;
  children: ReactNode;
};

export function DashboardSectionCard({
  title,
  hasItems,
  emptyMessage,
  children,
}: DashboardSectionCardProps) {
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === "dark";

  return (
    <article
      className={[
        "overflow-hidden rounded-3xl transition-shadow duration-200 hover:shadow-lg",
        isDark
          ? "border border-slate-700/70 bg-slate-900/90 shadow-[0_20px_45px_rgba(2,6,23,0.28)]"
          : "border border-slate-200/80 bg-white shadow-sm",
      ].join(" ")}
    >
      <div
        className={[
          "px-5 py-4",
          isDark
            ? "border-b border-slate-700/70 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(15,23,42,0.85))]"
            : "border-b border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,0.98))]",
        ].join(" ")}
      >
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <p
              className={[
                "text-xs font-semibold uppercase tracking-[0.18em]",
                isDark ? "text-slate-400" : "text-slate-500",
              ].join(" ")}
            >
              Actividad
            </p>
            <h3
              className={[
                "mt-2 text-base font-bold tracking-tight",
                isDark ? "text-white" : "text-slate-950",
              ].join(" ")}
            >
              {title}
            </h3>
            <p
              className={[
                "mt-1 text-sm",
                isDark ? "text-slate-300" : "text-slate-500",
              ].join(" ")}
            >
              {hasItems
                ? "Elementos recientes disponibles"
                : "Sin actividad para mostrar"}
            </p>
          </div>
        </div>
      </div>

      <ul className="min-w-0 space-y-3 p-5">
        {hasItems ? (
          children
        ) : (
          <li
            className={[
              "rounded-3xl border px-5 py-9 text-center text-sm",
              isDark
                ? "border-dashed border-slate-700 bg-[linear-gradient(180deg,#111827,#0f172a)] text-slate-300"
                : "border-dashed border-slate-300 bg-[linear-gradient(180deg,#F8FAFC,#F1F5F9)] text-slate-600",
            ].join(" ")}
          >
            <div
              className={[
                "mx-auto flex h-12 w-12 items-center justify-center rounded-full ring-1 ring-inset",
                isDark ? "bg-slate-800 ring-slate-700" : "bg-white ring-slate-200",
              ].join(" ")}
            >
              <span
                className={["text-lg", isDark ? "text-slate-500" : "text-slate-400"].join(" ")}
              >
                +
              </span>
            </div>
            <p
              className={[
                "mt-4 font-semibold",
                isDark ? "text-white" : "text-slate-700",
              ].join(" ")}
            >
              Sin información disponible
            </p>
            <p className="mt-1">{emptyMessage}</p>
          </li>
        )}
      </ul>
    </article>
  );
}
