import { useRef } from "react";

interface Props {
  value: string | null;
  onChange: (v: string | null) => void;
  placeholder?: string;
  className?: string;
}

function formatWithCommas(raw: string): string {
  if (!raw) return "";
  const [integer, decimal] = raw.split(".");
  const formatted = Number(integer).toLocaleString("es-MX");
  return decimal !== undefined ? `${formatted}.${decimal}` : formatted;
}

export function MoneyInput({ value, onChange, placeholder = "0.00", className = "" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const cursorPos = input.selectionStart ?? 0;
    const prevDisplayed = input.value;

    // Strip everything except digits and one dot
    const raw = prevDisplayed.replace(/[^0-9.]/g, "");

    // Allow at most one dot and up to 2 decimal places
    if (raw !== "" && !/^\d*\.?\d{0,2}$/.test(raw)) return;

    onChange(raw || null);

    // Calculate cursor in new formatted string
    // Count how many "real" chars (non-comma) were before cursor in old value
    const realCharsBefore = prevDisplayed.slice(0, cursorPos).replace(/,/g, "").length;

    const newFormatted = formatWithCommas(raw);

    // Walk through new formatted string to find same number of real chars
    let newCursor = newFormatted.length;
    let count = 0;
    for (let i = 0; i < newFormatted.length; i++) {
      if (newFormatted[i] !== ",") count++;
      if (count === realCharsBefore) {
        newCursor = i + 1;
        break;
      }
    }

    requestAnimationFrame(() => {
      inputRef.current?.setSelectionRange(newCursor, newCursor);
    });
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      className={className}
      value={formatWithCommas(value ?? "")}
      placeholder={placeholder}
      onChange={handleChange}
    />
  );
}
