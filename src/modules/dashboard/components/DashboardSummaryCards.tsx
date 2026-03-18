import blogsIcon from '../../../assets/images/Blogs.png';
import propertyAvailableIcon from '../../../assets/images/Propiety.png';
import propertySoldIcon from '../../../assets/images/PropetySell.png';
import systemRolesIcon from '../../../assets/images/Roles.png';
import systemUsersIcon from '../../../assets/images/System.png';
import leadsIcon from '../../../assets/images/users.png';

type DashboardSummaryCardsProps = {
  titles: readonly string[];
  values: Record<string, string | number>;
  isLoading: boolean;
};

const DASHBOARD_CARD_ICONS: Partial<Record<string, string>> = {
  'Propiedades Disponibles': propertyAvailableIcon,
  Registros: leadsIcon,
  'Propiedades vendidas': propertySoldIcon,
  Blogs: blogsIcon,
  'Usuarios del sistema': systemUsersIcon,
  'Roles del sistema': systemRolesIcon,
};

export function DashboardSummaryCards({ titles, values, isLoading }: DashboardSummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {titles.map((title) => (
        <article
          key={title}
          className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-700">{title}</p>
              <p className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-[2rem]">
                {isLoading ? '...' : values[title]}
              </p>
            </div>
            {DASHBOARD_CARD_ICONS[title] ? (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-100 ring-1 ring-inset ring-slate-200 transition-colors group-hover:bg-slate-50">
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
