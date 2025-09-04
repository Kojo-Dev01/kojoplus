'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function CustomDropdown({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Select an option", 
  className = "",
  disabled = false,
  showDescription = false // New prop for showing descriptions
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedOption = options.find(option => option.value === value);

  const handleSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-3 text-left border rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          disabled 
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer'
        } ${
          isDarkMode 
            ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' 
            : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={selectedOption ? '' : isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''} ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`} />
        </div>
        {showDescription && selectedOption?.description && (
          <div className={`text-xs mt-1 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {selectedOption.description}
          </div>
        )}
      </button>

      {isOpen && (
        <div className={`absolute z-50 w-full mt-1 border rounded-xl shadow-lg max-h-60 overflow-auto ${
          isDarkMode 
            ? 'bg-gray-700 border-gray-600' 
            : 'bg-white border-gray-200'
        }`}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option)}
              className={`w-full px-4 py-3 text-left transition-colors ${
                value === option.value
                  ? isDarkMode
                    ? 'bg-blue-900/50 text-blue-300'
                    : 'bg-blue-50 text-blue-700'
                  : isDarkMode
                    ? 'text-white hover:bg-gray-600'
                    : 'text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="font-medium">{option.label}</div>
              {showDescription && option.description && (
                <div className={`text-xs mt-1 ${
                  value === option.value
                    ? isDarkMode ? 'text-blue-200' : 'text-blue-600'
                    : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {option.description}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
