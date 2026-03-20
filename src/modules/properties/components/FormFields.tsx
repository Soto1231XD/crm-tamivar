import type { ChangeEvent } from "react";

export function LabelText({
  label,
  required,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <span className="text-sm font-semibold text-slate-700">
      {label}
      {required ? <span className="ml-1 font-semibold text-red-600">*</span> : null}
    </span>
  );
}

const baseFieldClassName =
  "w-full rounded-xl border bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#312C85]/10";

type FieldInputProps = {
  label: string;
  name: string;
  value: string;
  onChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
  type?: string;
  inputMode?: "text" | "decimal" | "numeric" | "email" | "search" | "tel" | "url" | "none";
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
  error,
}: FieldInputProps) {
  return (
    <label className={`flex flex-col gap-1.5 ${className ?? ""}`}>
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
        className={`${baseFieldClassName} ${
          error
            ? "border-red-500 focus:border-red-500"
            : "border-slate-300 focus:border-[#312C85]"
        }`}
      />
      {error ? <span className="text-xs font-medium text-red-500">{error}</span> : null}
    </label>
  );
}

type FieldSelectProps = {
  label: string;
  name: string;
  value: string;
  onChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
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
  error,
}: FieldSelectProps) {
  return (
    <label className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <LabelText label={label} required={required} />
      <div className="relative">
        <select
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className={`${baseFieldClassName} appearance-none pr-10 ${
            error
              ? "border-red-500 focus:border-red-500"
              : "border-slate-300 focus:border-[#312C85]"
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
      {error ? <span className="text-xs font-medium text-red-500">{error}</span> : null}
    </label>
  );
}

type FieldTextareaProps = {
  label: string;
  name: string;
  value: string;
  onChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
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
    <label className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <LabelText label={label} />
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        className={`${baseFieldClassName} min-h-28 resize-y border-slate-300 focus:border-[#312C85]`}
      />
    </label>
  );
}

type ToggleProps = {
  name: string;
  label: string;
  checked: boolean;
  onChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
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
      className={`flex min-h-[52px] cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 ${className ?? ""}`}
    >
      <span
        className={`relative flex h-5 w-5 items-center justify-center rounded-md border transition ${
          checked
            ? "border-[#312C85] bg-[#312C85] text-white"
            : "border-slate-300 bg-white text-transparent"
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M16.704 5.29a1 1 0 010 1.42l-7.25 7.25a1 1 0 01-1.415 0L3.296 9.217a1 1 0 011.414-1.414l4.036 4.035 6.543-6.547a1 1 0 011.415 0z"
            clipRule="evenodd"
          />
        </svg>
      </span>
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span className="font-medium">{label}</span>
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
  error,
}: PaymentMultiSelectProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <LabelText label={label} required={required} />
      <details className="group relative">
        <summary
          className={`${baseFieldClassName} list-none cursor-pointer ${
            error
              ? "border-red-500 focus:border-red-500"
              : "border-slate-300 focus:border-[#312C85]"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="truncate">
              {selectedValues.length > 0 ? selectedValues.join(", ") : "Selecciona uno o mas tipos de pago"}
            </span>
            <span className="text-slate-500 transition-transform duration-200 group-open:rotate-180">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </div>
        </summary>
        <div className="absolute z-10 mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          <div className="grid gap-2 sm:grid-cols-2">
            {options.map((option) => (
              <label
                key={option}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={() => onToggle(option)}
                  className="rounded border-slate-300 text-[#312C85] focus:ring-[#312C85]"
                />
                {option}
              </label>
            ))}
          </div>
        </div>
      </details>
      {error ? <span className="text-xs font-medium text-red-500">{error}</span> : null}
    </div>
  );
}
