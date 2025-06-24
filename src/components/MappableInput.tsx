import React, { useRef, useState } from 'react';
import InsertValueDropdown from './InsertValueDropdown';
import TemplateInput from './TemplateInput';

interface MappableInputProps {
  value: string | number | any; // Allow any value that can be converted to string
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
  compact?: boolean;
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
  description,
  compact = false
}: MappableInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);

  // Convert value to string for safe operations
  const stringValue = String(value || '');

  // Convert dataSources to the format expected by TemplateInput
  const templateDataSources = React.useMemo(() => {
    const combined: Record<string, any> = {};
    dataSources.forEach(source => {
      combined[source.id] = source.data;
    });
    return combined;
  }, [dataSources]);

  const handleInsert = (template: string) => {
    const element = multiline ? textareaRef.current : inputRef.current;
    if (!element) return;

    const start = element.selectionStart || cursorPosition;
    const end = element.selectionEnd || cursorPosition;
    
    const newValue = stringValue.slice(0, start) + template + stringValue.slice(end);
    onChange(newValue);

    // Set cursor position after the inserted template
    setTimeout(() => {
      const newPosition = start + template.length;
      element.setSelectionRange(newPosition, newPosition);
      element.focus();
    }, 0);
  };

  const handleSelectionChange = () => {
    const element = multiline ? textareaRef.current : inputRef.current;
    if (element) {
      setCursorPosition(element.selectionStart || 0);
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const template = e.dataTransfer.getData('text/plain');
    if (template && template.startsWith('{{') && template.endsWith('}}')) {
      handleInsert(template);
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-300">
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
      
      {!label && dataSources.length > 0 && !compact && (
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

      <div 
        className="relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <TemplateInput
          value={stringValue}
          onChange={onChange}
          placeholder={placeholder}
          className={`${compact ? 'px-2 py-1 text-xs' : ''} ${
            isDragOver ? 'ring-2 ring-blue-500 border-blue-500' : ''
          } ${className}`}
          multiline={multiline}
          rows={rows}
          dataSources={templateDataSources}
          disabled={disabled}
        />
        
        {/* Drop zone indicator */}
        {isDragOver && (
          <div className="absolute inset-0 border-2 border-dashed border-blue-400 bg-blue-400/10 rounded-md flex items-center justify-center pointer-events-none z-10">
            <span className="text-blue-600 text-sm font-medium">Drop to insert template</span>
          </div>
        )}

        {/* Compact mode: show insert dropdown as overlay on focus */}
        {compact && dataSources.length > 0 && (
          <div className="absolute right-1 top-1/2 transform -translate-y-1/2 z-20">
            <InsertValueDropdown
              onInsert={handleInsert}
              dataSources={dataSources}
              disabled={disabled}
              compact={true}
            />
          </div>
        )}
      </div>

      {description && !compact && (
        <p className="text-xs text-gray-400">{description}</p>
      )}
    </div>
  );
} 