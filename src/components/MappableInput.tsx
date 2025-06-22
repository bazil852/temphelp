import React, { useRef, useState } from 'react';
import InsertValueDropdown from './InsertValueDropdown';

interface MappableInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
  dataSources?: Array<{
    id: string;
    label: string;
    icon: string;
    data: any;
  }>;
  label?: string;
  description?: string;
}

export default function MappableInput({
  value,
  onChange,
  placeholder,
  className = '',
  disabled = false,
  multiline = false,
  rows = 3,
  dataSources = [],
  label,
  description
}: MappableInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState(0);

  const handleInsert = (template: string) => {
    const element = multiline ? textareaRef.current : inputRef.current;
    if (!element) return;

    const start = element.selectionStart || cursorPosition;
    const end = element.selectionEnd || cursorPosition;
    
    const newValue = value.slice(0, start) + template + value.slice(end);
    onChange(newValue);

    // Set cursor position after the inserted template
    setTimeout(() => {
      const newPosition = start + template.length;
      element.setSelectionRange(newPosition, newPosition);
      element.focus();
    }, 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleSelectionChange = () => {
    const element = multiline ? textareaRef.current : inputRef.current;
    if (element) {
      setCursorPosition(element.selectionStart || 0);
    }
  };

  const baseClassName = `w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`;
  
  const commonProps = {
    value,
    onChange: handleInputChange,
    onSelect: handleSelectionChange,
    onKeyUp: handleSelectionChange,
    onClick: handleSelectionChange,
    placeholder,
    disabled,
  };

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
          <div className="relative">
            <InsertValueDropdown
              onInsert={handleInsert}
              dataSources={dataSources}
              disabled={disabled || dataSources.length === 0}
            />
          </div>
        </div>
      )}
      
      {!label && dataSources.length > 0 && (
        <div className="flex justify-start">
          <div className="relative">
            <InsertValueDropdown
              onInsert={handleInsert}
              dataSources={dataSources}
              disabled={disabled}
            />
          </div>
        </div>
      )}

      {multiline ? (
        <textarea
          ref={textareaRef}
          {...commonProps}
          rows={rows}
          className={`${baseClassName} resize-vertical`}
        />
      ) : (
        <input
          ref={inputRef}
          {...commonProps}
          type="text"
          className={baseClassName}
        />
      )}

      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}

      {/* Template preview */}
      {value && value.includes('{{') && (
        <div className="text-xs text-blue-600 bg-black px-2 py-1 rounded">
          <span className="font-medium">Contains templates:</span>{' '}
          {value.match(/\{\{[^}]+\}\}/g)?.join(', ') || 'None'}
        </div>
      )}
    </div>
  );
} 