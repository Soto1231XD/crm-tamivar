import type { ReactNode } from 'react';
import cerrarIcon from '@/assets/images/Cerrar.png';

type AppModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxWidthClassName?: string;
  bodyClassName?: string;
  panelClassName?: string;
  scrollBody?: boolean;
  children: ReactNode;
};

export function AppModal({
  isOpen,
  onClose,
  title,
  subtitle,
  maxWidthClassName = 'max-w-2xl',
  bodyClassName = '',
  panelClassName = '',
  scrollBody = true,
  children,
}: AppModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[var(--crm-overlay)] p-3 sm:p-4">
      <div className="mx-auto flex min-h-full w-full items-start justify-center py-3 sm:py-6">
        <div
          className={`flex w-full flex-col rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4 text-[var(--crm-text)] shadow-[var(--crm-shadow-lg)] sm:p-6 ${maxWidthClassName} ${panelClassName}`.trim()}
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-[var(--crm-text-strong)]">{title}</h3>
              {subtitle ? <p className="mt-1 text-sm text-[var(--crm-text-muted)]">{subtitle}</p> : null}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar modal"
              title="Cerrar"
              className="rounded-md p-1 transition hover:bg-[var(--crm-muted)]"
            >
              <img src={cerrarIcon} alt="" className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <div className={`${scrollBody ? 'min-h-0 flex-1 overflow-y-auto pr-1' : ''} ${bodyClassName}`.trim()}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
