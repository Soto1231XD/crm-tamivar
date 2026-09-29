import { useState, useRef, useEffect, useId } from 'react';

type Option = { id: number; label: string };

type SearchableSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Selecciona una opción',
  className = '',
  disabled = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const selected = options.find((o) => String(o.id) === value);
  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  function handleSelect(option: Option) {
    onChange(String(option.id));
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      {open ? (
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
          placeholder="Buscar..."
          className={className}
          aria-expanded
          aria-controls={listboxId}
          aria-autocomplete="list"
        />
      ) : (
        <button
          type="button"
          onClick={() => { if (!disabled) setOpen(true); }}
          disabled={disabled}
          className={`${className} flex items-center justify-between text-left`}
        >
          <span className={`truncate ${!selected ? 'text-[var(--crm-placeholder)]' : ''}`}>
            {selected ? selected.label : placeholder}
          </span>
          <svg
            className="ml-2 h-4 w-4 shrink-0 text-slate-400"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {filtered.length === 0 ? (
            <li className="px-4 py-2.5 text-sm text-slate-400">Sin resultados</li>
          ) : (
            filtered.map((option) => (
              <li
                key={option.id}
                role="option"
                aria-selected={String(option.id) === value}
                onMouseDown={() => handleSelect(option)}
                className={[
                  'cursor-pointer px-4 py-2.5 text-sm transition-colors',
                  String(option.id) === value
                    ? 'bg-[#312C85] font-semibold text-white'
                    : 'text-slate-700 hover:bg-slate-100',
                ].join(' ')}
              >
                {option.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
