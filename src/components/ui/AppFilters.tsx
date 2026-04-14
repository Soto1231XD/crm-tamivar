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
  "w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#312C85] focus:bg-white focus:ring-2 focus:ring-[#312C85]/10";

export function FilterCard({
  title = "Filtros",
  description,
  children,
  className = "",
}: FilterCardProps) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 ${className}`.trim()}
    >
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {title}
          </p>
          {description ? (
            <p className="mt-1 text-sm text-slate-600">{description}</p>
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
      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
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
      <span className="absolute left-3.5 font-bold text-slate-600">
        $
      </span>
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        {...props}
        className={`w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-8 pr-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-500 focus:border-[#312C85] focus:ring-1 focus:ring-[#312C85] ${
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