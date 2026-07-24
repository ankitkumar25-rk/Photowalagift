import { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomDropdown({
  options = [],
  value = '',
  onChange,
  placeholder = '--Select--',
  disabled = false,
  className = '',
  name = '',
  id,
  required = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const generatedId = useId();
  const dropdownId = id || generatedId;

  // Normalize options into { value, label }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        value: opt.value !== undefined ? opt.value : opt.id || opt.name,
        label: opt.label !== undefined ? opt.label : opt.name || opt.value || opt.id
      };
    }
    return { value: opt, label: String(opt) };
  });

  // Find currently selected option
  const selectedOption = normalizedOptions.find(
    (opt) => String(opt.value) === String(value)
  );

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle item selection
  const handleSelect = (optVal) => {
    if (disabled) return;
    setIsOpen(false);
    if (onChange) {
      // Create synthetic event to work with (e) => e.target.value as well as direct val => ...
      const event = {
        target: { name, value: optVal },
        currentTarget: { name, value: optVal },
        preventDefault: () => {},
        stopPropagation: () => {}
      };
      // Allow calling with event or direct value
      onChange(event, optVal);
    }
  };

  return (
    <div
      ref={dropdownRef}
      className={`relative inline-block w-full ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
    >
      <button
        type="button"
        id={dropdownId}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-gray-800 bg-white border rounded-xl shadow-xs transition-all outline-none cursor-pointer hover:border-[#b88a2f] focus:border-[#b88a2f] focus:ring-2 focus:ring-[#b88a2f]/25 ${
          isOpen ? 'border-[#b88a2f] ring-2 ring-[#b88a2f]/25' : 'border-gray-200'
        }`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : <span className="text-gray-400 font-normal">{placeholder}</span>}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#b88a2f]' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-1.5 max-h-60 overflow-y-auto bg-white border border-cream-200 rounded-xl shadow-xl py-1 text-sm animate-in fade-in zoom-in-95 duration-150"
        >
          {placeholder && (
            <div
              role="option"
              aria-selected={!value}
              onClick={() => handleSelect('')}
              className={`px-4 py-2.5 cursor-pointer flex items-center justify-between transition-colors text-gray-400 hover:bg-cream-50 ${
                !value ? 'bg-cream-50/80 text-brand-primary font-medium' : ''
              }`}
            >
              <span>{placeholder}</span>
            </div>
          )}

          {normalizedOptions.map((opt, index) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <div
                key={opt.value || index}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(opt.value)}
                className={`px-4 py-2.5 cursor-pointer flex items-center justify-between transition-colors hover:bg-cream-50 ${
                  isSelected
                    ? 'bg-brand-surface/40 text-brand-primary font-semibold'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className="w-4 h-4 text-brand-secondary shrink-0 ml-2" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
