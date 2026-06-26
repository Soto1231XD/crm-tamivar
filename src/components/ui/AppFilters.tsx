import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes
} from "react";
import React, { useState, useEffect } from "react";

type FilterCardProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

type FilterSearchInputProps = InputHTMLAttributes<HTMLInputElement>;
type FilterSelectProps = SelectHTMLAttributes<HTMLSelectElement>;
type FilterDateInputProps = InputHTMLAttributes<HTMLInputElement>;

const baseControlClassName =
  "w-full rounded-xl border border-[var(--crm-border-strong)] bg-[var(--crm-surface-soft)] px-3 py-2.5 text-sm text-[var(--crm-text)] outline-none transition placeholder:text-[var(--crm-text-soft)] focus:border-[var(--crm-primary)] focus:bg-[var(--crm-surface)] focus:ring-2 focus:ring-[var(--crm-primary-soft)]";

export function FilterCard({
  title = "Filtros",
  description,
  children,
  className = "",
}: FilterCardProps) {
  return (
    <section
      className={`rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4 shadow-sm sm:p-5 ${className}`.trim()}
    >
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--crm-text-soft)]">
            {title}
          </p>
          {description ? (
            <p className="mt-1 text-sm text-[var(--crm-text-muted)]">{description}</p>
          ) : null}
        </div>

        {children}
      </div>
    </section>
  );
}

export function FilterSearchInput({
  className = "",
  ...props
}: FilterSearchInputProps) {
  return (
    <label className={`relative block ${className}`.trim()}>
      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--crm-text-soft)]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-4 w-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-4.35-4.35"
          />
          <circle cx="11" cy="11" r="6.25" />
        </svg>
      </span>

      <input
        {...props}
        className={`${baseControlClassName} pl-10 ${className}`.trim()}
      />
    </label>
  );
}

interface FilterPriceInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: number | string;
  onChange?: (value: number | undefined) => void;
}

export const FilterPriceInput = ({ value, onChange, className, ...props }: FilterPriceInputProps) => {
  const [displayValue, setDisplayValue] = useState("");

  // Sincroniza el valor numérico externo con el string formateado local
  useEffect(() => {
    if (value === undefined || value === null || value === "") {
      setDisplayValue("");
    } else {
      setDisplayValue(Number(value).toLocaleString("en-US"));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "");

    // Actualizamos la vista y emitimos el valor real
    if (rawValue === "") {
      setDisplayValue("");
      onChange?.(undefined);
    } else {
      const numericValue = parseInt(rawValue, 10);
      setDisplayValue(numericValue.toLocaleString("en-US")); // Ponemos las comas
      onChange?.(numericValue); // Enviamos el número limpio a Zustand
    }
  };

  return (
    <div className="relative flex items-center">
      <span className="absolute left-3.5 font-bold text-[var(--crm-text-muted)]">
        $
      </span>
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        {...props}
        className={`w-full rounded-xl border border-[var(--crm-border-strong)] bg-[var(--crm-surface)] py-2.5 pl-8 pr-4 text-sm text-[var(--crm-text)] shadow-sm outline-none transition placeholder:text-[var(--crm-text-soft)] focus:border-[var(--crm-primary)] focus:ring-1 focus:ring-[var(--crm-primary)] ${
          className || ""
        }`}
      />
    </div>
  );
};

export function FilterSelect({ className = "", ...props }: FilterSelectProps) {
  return (
    <select
      {...props}
      className={`${baseControlClassName} ${className}`.trim()}
    />
  );
}

export function FilterDateInput({
  className = "",
  ...props
}: FilterDateInputProps) {
  return (
    <input
      {...props}
      className={`${baseControlClassName} ${className}`.trim()}
    />
  );
}

export { baseControlClassName as filterControlClassName };

type CollapsibleFiltersProps = {
  searchSlot: ReactNode;
  activeCount?: number;
  downloadSlot?: ReactNode;
  children: ReactNode;
};

function FilterListIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="7" y1="12" x2="17" y2="12" />
      <line x1="10" y1="18" x2="14" y2="18" />
    </svg>
  );
}

function FilterChevronIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function CollapsibleFilters({
  searchSlot,
  activeCount = 0,
  downloadSlot,
  children,
}: CollapsibleFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">{searchSlot}</div>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={[
            "flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-[0.6rem] text-sm font-semibold transition",
            isOpen
              ? "border-[var(--crm-primary)] bg-[var(--crm-primary-soft)] text-[var(--crm-primary)]"
              : "border-[var(--crm-border-strong)] bg-[var(--crm-surface-soft)] text-[var(--crm-text)] hover:bg-[var(--crm-muted)]",
          ].join(" ")}
        >
          <FilterListIcon className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Filtros</span>
          {activeCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--crm-primary)] px-1 text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
          <FilterChevronIcon
            className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {downloadSlot}
      </div>

      {isOpen && (
        <div className="mt-4 border-t border-[var(--crm-border)] pt-4">
          {children}
        </div>
      )}
    </section>
  );
}
