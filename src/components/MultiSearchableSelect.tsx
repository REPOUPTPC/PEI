import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, X, BookOpen, Plus } from 'lucide-react';

export interface MultiSelectOption {
  value: string;
  label: string;
  badge?: string;
}

interface MultiSearchableSelectProps {
  options: MultiSelectOption[];
  selectedValues: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  label?: string;
  helperText?: string;
  allowCustom?: boolean;
  onAddCustom?: (customValue: string) => Promise<void> | void;
  className?: string;
}

export const MultiSearchableSelect: React.FC<MultiSearchableSelectProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder = 'Seleccione una o más opciones...',
  searchPlaceholder = 'Escriba para filtrar opciones...',
  label,
  helperText,
  allowCustom = true,
  onAddCustom,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [addingCustom, setAddingCustom] = useState(false);
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
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const handleToggle = (val: string) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter(v => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const handleRemove = (e: React.MouseEvent, val: string) => {
    e.stopPropagation();
    onChange(selectedValues.filter(v => v !== val));
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const handleAddCustom = async () => {
    const trimmed = searchTerm.trim().toUpperCase();
    if (!trimmed) return;

    if (!selectedValues.includes(trimmed)) {
      onChange([...selectedValues, trimmed]);
    }
    if (onAddCustom) {
      setAddingCustom(true);
      try {
        await onAddCustom(trimmed);
      } catch (err) {
        console.error('Error adding custom option:', err);
      } finally {
        setAddingCustom(false);
      }
    }
    setSearchTerm('');
  };

  const exactMatchExists = options.some(
    opt => opt.label.trim().toLowerCase() === searchTerm.trim().toLowerCase()
  );

  return (
    <div ref={containerRef} className={`relative w-full space-y-2 ${className}`}>
      {label && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
              {label}
            </label>
            {helperText && (
              <p className="text-[11px] text-slate-500 leading-snug">{helperText}</p>
            )}
          </div>
          <span className="text-[11px] font-semibold text-[#0B4D94] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 self-start sm:self-auto shrink-0">
            {selectedValues.length} {selectedValues.length === 1 ? 'seleccionada' : 'seleccionadas'}
          </span>
        </div>
      )}

      {/* Selected Items Tags / Chips */}
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl shadow-xs max-h-36 overflow-y-auto">
          {selectedValues.map(val => (
            <span
              key={val}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#0B4D94] text-white text-xs font-medium rounded-lg shadow-2xs group transition-all"
            >
              <BookOpen className="w-3 h-3 text-cyan-200 shrink-0" />
              <span className="truncate max-w-[240px] sm:max-w-[360px]">{val}</span>
              <button
                type="button"
                onClick={e => handleRemove(e, val)}
                className="hover:text-rose-200 hover:bg-white/10 rounded-full p-0.5 transition-colors"
                title={`Quitar ${val}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}

          <button
            type="button"
            onClick={handleClearAll}
            className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold px-2 py-0.5 hover:underline ml-auto"
          >
            Limpiar todas
          </button>
        </div>
      )}

      {/* Trigger Bar with Search / Toggle */}
      <div className="relative">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full text-xs border rounded-xl p-2.5 flex items-center justify-between cursor-pointer transition-all bg-white ${
            isOpen
              ? 'border-[#0B4D94] ring-2 ring-[#0B4D94]/20 shadow-xs'
              : 'border-slate-300 hover:border-slate-400'
          }`}
        >
          <div className="flex items-center gap-2 text-slate-700 truncate pr-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <span className={selectedValues.length === 0 ? 'text-slate-400' : 'text-slate-800 font-medium'}>
              {selectedValues.length === 0
                ? placeholder
                : `${selectedValues.length} ${selectedValues.length === 1 ? 'Unidad seleccionada' : 'Unidades seleccionadas'} (Haga clic para desplegar abanico)`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
            <span className="text-[10px] text-slate-500 font-medium hidden sm:inline-block bg-slate-100 px-2 py-0.5 rounded-md">
              {isOpen ? 'Cerrar lista' : 'Desplegar opciones'}
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#0B4D94]' : ''}`}
            />
          </div>
        </div>

        {/* Dropdown Popover Menu ("Abanico de Opciones") */}
        {isOpen && (
          <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-slide-in">
            {/* Search Filter Header */}
            <div className="p-2.5 border-b border-slate-100 bg-slate-50/90 sticky top-0 z-10 space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg pl-8 pr-7 py-1.5 focus:outline-none focus:border-[#0B4D94] focus:ring-1 focus:ring-[#0B4D94]"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 px-0.5">
                <span>
                  Mostrando {filteredOptions.length} de {options.length} unidades
                </span>
                {searchTerm && (
                  <span className="text-[#0B4D94] font-medium truncate max-w-[200px]">
                    Filtro: &ldquo;{searchTerm}&rdquo;
                  </span>
                )}
              </div>
            </div>

            {/* Options List */}
            <div className="overflow-y-auto max-h-64 divide-y divide-slate-100 p-1">
              {filteredOptions.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 space-y-2">
                  <p>No se encontraron unidades curriculares con &ldquo;{searchTerm}&rdquo;</p>
                  {allowCustom && searchTerm.trim().length > 2 && !exactMatchExists && (
                    <button
                      type="button"
                      onClick={handleAddCustom}
                      disabled={addingCustom}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0B4D94] text-white text-xs font-semibold rounded-lg hover:bg-[#083b70] transition-colors shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{addingCustom ? 'Agregando...' : `Agregar "${searchTerm.trim().toUpperCase()}"`}</span>
                    </button>
                  )}
                </div>
              ) : (
                filteredOptions.map(opt => {
                  const isSelected = selectedValues.includes(opt.value);
                  return (
                    <div
                      key={opt.value}
                      onClick={() => handleToggle(opt.value)}
                      className={`px-3 py-2 text-xs rounded-lg cursor-pointer flex items-center justify-between transition-colors select-none ${
                        isSelected
                          ? 'bg-blue-50/90 text-[#0B4D94] font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate mr-2">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-[#0B4D94] border-[#0B4D94] text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="truncate">{opt.label}</span>
                      </div>

                      {opt.badge && (
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-normal shrink-0">
                          {opt.badge}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer with custom add or counter */}
            <div className="p-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-500">
                {selectedValues.length} de {options.length} seleccionadas
              </span>

              {allowCustom && searchTerm.trim().length > 2 && !exactMatchExists && (
                <button
                  type="button"
                  onClick={handleAddCustom}
                  disabled={addingCustom}
                  className="inline-flex items-center gap-1 text-[11px] text-[#0B4D94] hover:underline font-semibold"
                >
                  <Plus className="w-3 h-3" />
                  <span>Agregar &ldquo;{searchTerm.trim().toUpperCase()}&rdquo;</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium ml-auto"
              >
                Listo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
