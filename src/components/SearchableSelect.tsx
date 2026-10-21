import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
}

interface SearchableSelectProps {
  value: string | number;
  onChange: (value: any) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  disabledMessage?: string;
  required?: boolean;
  className?: string;
  allowCustom?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Seleccione una opción...',
  disabled = false,
  disabledMessage,
  required = false,
  className = '',
  allowCustom = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const selectedOption = options.find(
    opt => String(opt.value) === String(value) && opt.value !== ''
  );

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const displayLabel = selectedOption
    ? selectedOption.label
    : (allowCustom && value ? String(value) : (disabled && disabledMessage ? disabledMessage : placeholder));

  const hasValue = !!(selectedOption || (allowCustom && value));

  const handleSelect = (val: string | number) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  const exactMatch = filteredOptions.some(
    opt => opt.label.toLowerCase() === searchTerm.toLowerCase().trim() ||
           String(opt.value).toLowerCase() === searchTerm.toLowerCase().trim()
  );

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Hidden input to ensure required forms or tab navigation works */}
      {required && (
        <input
          type="text"
          value={value ? String(value) : ''}
          onChange={() => {}}
          required={required}
          className="sr-only"
          tabIndex={-1}
        />
      )}

      {/* Trigger Button (Click 1: Opens the list) */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-xs text-left border rounded-lg p-2.5 flex items-center justify-between transition-all bg-white ${
          disabled
            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
            : isOpen
            ? 'border-[#0B4D94] ring-2 ring-[#0B4D94]/20 shadow-xs'
            : 'border-slate-300 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B4D94]'
        }`}
      >
        <span className={`truncate mr-2 ${hasValue ? 'font-medium text-slate-900' : 'text-slate-400'}`}>
          {displayLabel}
        </span>

        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {hasValue && !disabled && (
            <span
              onClick={handleClear}
              title="Borrar selección"
              className="p-0.5 hover:text-slate-600 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#0B4D94]' : ''}`}
          />
        </div>
      </button>

      {/* Popover Dropdown (Click 2: Selects the item) */}
      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-64 flex flex-col overflow-hidden animate-slide-in">
          {/* Quick Filter Box */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/70 sticky top-0 z-10">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={allowCustom ? "Escriba para buscar o ingrese otra..." : "Escriba para filtrar..."}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-[#0B4D94]"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto max-h-52 divide-y divide-slate-50 p-1">
            {allowCustom && searchTerm.trim().length > 1 && !exactMatch && (
              <div
                onClick={() => handleSelect(searchTerm.trim())}
                className="px-3 py-2 text-xs rounded-lg cursor-pointer bg-blue-50/80 hover:bg-blue-100 text-[#0B4D94] font-medium flex items-center justify-between transition-colors mb-1"
              >
                <span className="truncate">
                  + Usar &quot;{searchTerm.trim()}&quot; (otra institución)
                </span>
              </div>
            )}

            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400">
                {allowCustom && searchTerm.trim() ? (
                  <span>Pulse arriba para usar &quot;{searchTerm.trim()}&quot;</span>
                ) : (
                  'No se encontraron opciones'
                )}
              </div>
            ) : (
              filteredOptions.map(opt => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <div
                    key={String(opt.value)}
                    onClick={() => handleSelect(opt.value)}
                    className={`px-3 py-2 text-xs rounded-lg cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-blue-50 text-[#0B4D94] font-bold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#0B4D94] shrink-0 ml-2" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

