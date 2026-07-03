import { NavLink, useLocation } from "react-router-dom";
import { ChevronDownIcon } from "./AppIcons";
import logoBlanco from "@/assets/images/logo_blanco.png";
import MenuIcon from "@/assets/images/Menu.png";
import LogoutIcon from "@/assets/images/Logout.png";

type NavItem = { to: string; label: string; icon: string };
type ActiveNavGroup = { label: string; icon: string; items: NavItem[] };

type SidebarProps = {
  isCollapsed: boolean;
  onToggle: () => void;
  onClose: () => void;
  navItems: NavItem[];
  standaloneNavItems: NavItem[];
  activeNavGroups: ActiveNavGroup[];
  openGroups: Set<string>;
  toggleGroup: (label: string) => void;
  displayName: string;
  primaryRoleDisplay: string;
  onLogout: () => void;
};

export function Sidebar({
  isCollapsed,
  onToggle,
  onClose,
  navItems,
  standaloneNavItems,
  activeNavGroups,
  openGroups,
  toggleGroup,
  displayName,
  primaryRoleDisplay,
  onLogout,
}: SidebarProps) {
  const location = useLocation();
  const closeMobile = () => { if (window.innerWidth < 768) onClose(); };

  return (
    <>
      {!isCollapsed && (
        <div className="fixed inset-0 z-40 bg-slate-950/45 md:hidden" onClick={onClose} />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-800/80 bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)] text-slate-100 transition-all duration-300 md:relative",
          isCollapsed
            ? "-translate-x-full md:translate-x-0 md:w-[92px] md:px-3 md:py-5"
            : "w-[282px] translate-x-0 px-4 py-5 md:w-[264px] md:px-5 md:py-6",
        ].join(" ")}
      >
        <div className={isCollapsed ? "flex justify-center" : "flex justify-between"}>
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <img src={logoBlanco} alt="Logo Tamivar" className="h-11 w-auto shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">CRM TAMIVAR</p>
                <h2 className="truncate text-lg font-bold tracking-tight text-white">Panel</h2>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700/80 bg-white/5 text-slate-200 transition hover:bg-white/10"
          >
            <img src={MenuIcon} alt="Menu" className="h-5 w-5 shrink-0" />
          </button>
        </div>

        <nav className="crm-scrollbar-hidden mt-8 flex flex-1 flex-col gap-2 overflow-y-auto">
          {isCollapsed ? (
            navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeMobile}
                className={({ isActive }) =>
                  ["group flex items-center justify-center rounded-2xl px-2 py-3.5 text-sm transition-all duration-200",
                    isActive ? "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" : "text-slate-300 hover:bg-white/5 hover:text-white",
                  ].join(" ")
                }
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 ring-1 ring-inset ring-white/6 transition group-hover:bg-white/10">
                  <img src={item.icon} alt="" className="h-5 w-5 shrink-0" />
                </span>
              </NavLink>
            ))
          ) : (
            <>
              {standaloneNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={closeMobile}
                  className={({ isActive }) =>
                    ["group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm transition-all duration-200",
                      isActive ? "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" : "text-slate-300 hover:bg-white/5 hover:text-white",
                    ].join(" ")
                  }
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 ring-1 ring-inset ring-white/6 transition group-hover:bg-white/10">
                    <img src={item.icon} alt="" className="h-5 w-5 shrink-0" />
                  </span>
                  <span className="truncate font-medium">{item.label}</span>
                </NavLink>
              ))}

              {activeNavGroups.map((group) => {
                const isOpen = openGroups.has(group.label);
                const isGroupActive = group.items.some((item) => location.pathname.startsWith(item.to));

                return (
                  <div key={group.label}>
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.label)}
                      className={["group flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-sm transition-all duration-200",
                        isGroupActive ? "text-white" : "text-slate-400 hover:bg-white/5 hover:text-white",
                      ].join(" ")}
                    >
                      <span className={["flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-white/6 transition group-hover:bg-white/10",
                        isGroupActive ? "bg-white/10" : "bg-white/5",
                      ].join(" ")}>
                        <img src={group.icon} alt="" className="h-5 w-5 shrink-0" />
                      </span>
                      <span className="flex-1 truncate text-left font-medium">{group.label}</span>
                      <ChevronDownIcon className={["h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200",
                        isOpen ? "rotate-0" : "-rotate-90",
                      ].join(" ")} />
                    </button>

                    {isOpen && (
                      <div className="ml-5 mt-1 flex flex-col gap-1 border-l border-white/10 pl-3">
                        {group.items.map((item) => (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={closeMobile}
                            className={({ isActive }) =>
                              ["group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                                isActive ? "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" : "text-slate-400 hover:bg-white/5 hover:text-white",
                              ].join(" ")
                            }
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 ring-1 ring-inset ring-white/6 transition group-hover:bg-white/10">
                              <img src={item.icon} alt="" className="h-4 w-4 shrink-0" />
                            </span>
                            <span className="truncate font-medium">{item.label}</span>
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </nav>

        <div className="mt-auto space-y-4 pt-4">
          {!isCollapsed && (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="truncate text-sm font-semibold text-white">{displayName}</p>
              <p className="mt-1 text-xs text-slate-400">{primaryRoleDisplay}</p>
            </div>
          )}
          <button
            type="button"
            onClick={onLogout}
            className={["inline-flex w-full items-center justify-center rounded-2xl border border-red-500/60 bg-red-600 font-semibold text-white shadow-sm transition hover:bg-red-700",
              isCollapsed ? "h-11 px-2 py-3" : "gap-2 px-3 py-3 text-sm",
            ].join(" ")}
          >
            <img src={LogoutIcon} alt="Logout" className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
