import { useEffect, useRef, useState } from 'react';

type Option = { id: number; label: string };

type SearchableSelectProps = {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function SearchableSelect({ options, value, onChange, placeholder, className }: SearchableSelectProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => String(o.id) === value);

  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleFocus() {
    setIsOpen(true);
    setQuery('');
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setIsOpen(true);
    if (!e.target.value) onChange('');
  }

  function handleSelect(option: Option) {
    onChange(String(option.id));
    setIsOpen(false);
    setQuery('');
  }

  const displayValue = isOpen ? query : (selectedOption?.label ?? '');

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={displayValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {isOpen && (
        <ul className="absolute z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
          {filtered.length === 0 ? (
            <li className="px-3.5 py-2.5 text-sm text-slate-400">Sin resultados</li>
          ) : (
            filtered.map((option) => (
              <li
                key={option.id}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(option); }}
                className={[
                  'cursor-pointer px-3.5 py-2.5 text-sm transition-colors hover:bg-slate-50',
                  String(option.id) === value ? 'font-semibold text-[var(--crm-primary)]' : 'text-slate-700',
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
