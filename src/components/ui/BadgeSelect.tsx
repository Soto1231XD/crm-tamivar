import React from "react";

interface BadgeSelectProps {
  value: string;
  options?: readonly string[];
  onChange?: (newValue: string) => void;
  disabled?: boolean;
  canEdit?: boolean;
  getStyles: (value: string) => React.CSSProperties;
  className?: string;
  omitFirstOption?: boolean;
}

export const BadgeSelect = ({
  value,
  options = [],
  onChange,
  disabled = false,
  canEdit = true,
  getStyles,
  className = "w-[140px]",
  omitFirstOption = false,
}: BadgeSelectProps) => {
  const currentStyle = getStyles(value);

  // Evaluamos qué opciones renderizar según la nueva propiedad
  const optionsToRender = omitFirstOption ? options.slice(1) : options;

  // Si no puede editar, renderizamos un simple Badge (span)
  if (!canEdit) {
    return (
      <span
        className={`inline-flex justify-center rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm border border-transparent ${className}`}
        style={currentStyle}
      >
        {value}
      </span>
    );
  }

  // Si puede editar, renderizamos el Select con la flecha
  return (
    <div className={`relative inline-block ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className="w-full appearance-none cursor-pointer rounded-full border-0 px-4 py-1.5 text-left text-xs font-semibold shadow-sm outline-none ring-1 ring-inset ring-slate-200 transition-all hover:ring-slate-300 focus:ring-2 focus:ring-[#312C85] disabled:cursor-not-allowed disabled:opacity-70"
        style={currentStyle}
      >
        {optionsToRender.map((option) => (
          <option
            key={option}
            value={option}
            className="bg-white text-slate-800 font-medium"
          >
            {option}
          </option>
        ))}
      </select>

      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-current opacity-70">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </span>
    </div>
  );
};