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
        <article key={title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-700">{title}</p>
              <p className="mt-3 text-3xl font-black text-slate-900">{isLoading ? '...' : values[title]}</p>
            </div>
            {DASHBOARD_CARD_ICONS[title] ? (
              <img
                src={DASHBOARD_CARD_ICONS[title]}
                alt=""
                className="h-14 w-14 shrink-0 object-contain"
                aria-hidden="true"
              />
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
