import type { ChangeEvent } from "react";

export function LabelText({
  label,
  required,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <span>
      {label}
      {required ? (
        <span className="ml-0.5 font-semibold text-red-600">*</span>
      ) : null}
    </span>
  );
}

// Field Input
type FieldInputProps = {
  label: string;
  name: string;
  value: string;
  onChange: (
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => void;
  type?: string;
  inputMode?:
    | "text"
    | "decimal"
    | "numeric"
    | "email"
    | "search"
    | "tel"
    | "url"
    | "none";
  required?: boolean;
  min?: string;
  step?: string;
  className?: string;
  error?: string;
};

export function FieldInput({
  label,
  name,
  value,
  onChange,
  type = "text",
  inputMode,
  required,
  min,
  step,
  className,
  error
}: FieldInputProps) {
  return (
    <label
      className={`flex flex-col gap-1 text-sm text-slate-700 ${className ?? ""}`}
    >
      <LabelText label={label} required={required} />
      <input
        name={name}
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={onChange}
        required={required}
        min={min}
        step={step}
        className={`rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
          error ? 'border-red-500 ring-red-500 focus:ring-1' : 'border-slate-300 ring-brand-700 focus:ring'
        }`}
      />
      {/* Mostramos el error si existe */}
      {error && <span className="text-xs font-medium text-red-500">{error}</span>}
    </label>
  );
}

// Field Select
type FieldSelectProps = {
  label: string;
  name: string;
  value: string;
  onChange: (
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => void;
  options: readonly string[];
  required?: boolean;
  className?: string;
  error?: string;
};

export function FieldSelect({
  label,
  name,
  value,
  onChange,
  options,
  required,
  className,
  error
}: FieldSelectProps) {
  return (
    <label
      className={`flex flex-col gap-1 text-sm text-slate-700 ${className ?? ""}`}
    >
      <LabelText label={label} required={required} />
      <div className="relative">
        <select
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className={`w-full appearance-none rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
            error ? 'border-red-500 ring-red-500 focus:ring-1' : 'border-slate-300 ring-brand-700 focus:ring'
          }`}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </div>

      {error && <span className="text-xs font-medium text-red-500">{error}</span>}
    </label>
  );
}

type FieldTextareaProps = {
  label: string;
  name: string;
  value: string;
  onChange: (
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => void;
  className?: string;
};

export function FieldTextarea({
  label,
  name,
  value,
  onChange,
  className,
}: FieldTextareaProps) {
  return (
    <label
      className={`flex flex-col gap-1 text-sm text-slate-700 ${className ?? ""}`}
    >
      <LabelText label={label} />
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        className="min-h-24 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
      />
    </label>
  );
}

type ToggleProps = {
  name: string;
  label: string;
  checked: boolean;
  onChange: (
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => void;
  className?: string;
};

export function Toggle({
  name,
  label,
  checked,
  onChange,
  className,
}: ToggleProps) {
  return (
    <label
      className={`flex items-center gap-2 text-sm text-slate-700 ${className ?? ""}`}
    >
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
      />
      {label}
    </label>
  );
}

type PaymentMultiSelectProps = {
  label: string;
  selectedValues: string[];
  options: readonly string[];
  onToggle: (option: string) => void;
  className?: string;
  required?: boolean;
  error?: string;
};

export function PaymentMultiSelect({
  label,
  selectedValues,
  options,
  onToggle,
  className,
  required,
  error
}: PaymentMultiSelectProps) {
  return (
    <div
      className={`flex flex-col gap-1 text-sm text-slate-700 ${className ?? ""}`}
    >
      <LabelText label={label} required={required} />
      <details className="group relative">
        <summary className={`list-none rounded-lg border px-3 py-2 text-sm outline-none cursor-pointer ${
          error ? 'border-red-500 ring-red-500 focus:ring-1' : 'border-slate-300 ring-brand-700 focus:ring'
        }`}>
          <div className="flex items-center justify-between gap-3">
            <span className="truncate">
              {selectedValues.length > 0
                ? selectedValues.join(", ")
                : "Selecciona uno o más tipos de pago"}
            </span>
            <span className="text-slate-500 transition-transform duration-200 group-open:rotate-180">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </div>
        </summary>
        <div className="absolute z-10 mt-2 w-full rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
          <div className="space-y-2">
            {options.map((option) => (
              <label
                key={option}
                className="flex items-center gap-2 text-sm text-slate-700"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={() => onToggle(option)}
                />
                {option}
              </label>
            ))}
          </div>
        </div>
      </details>
      {error && <span className="text-xs font-medium text-red-500">{error}</span>}
    </div>
  );
}