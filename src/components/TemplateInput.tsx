import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TemplateInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  rows?: number;
  dataSources?: Record<string, any>;
  disabled?: boolean;
  type?: string;
}

interface TemplateVariable {
  variable: string;
  startIndex: number;
  endIndex: number;
  value: any;
}

const TemplateInput: React.FC<TemplateInputProps> = ({
  value = '',
  onChange,
  placeholder,
  className = '',
  multiline = false,
  rows = 1,
  dataSources = {},
  disabled = false,
  type = 'text'
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [currentVariables, setCurrentVariables] = useState<TemplateVariable[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout>();

  // Parse template variables from input value
  const parseTemplateVariables = (text: string): TemplateVariable[] => {
    const variables: TemplateVariable[] = [];
    const regex = /\{\{([^}]+)\}\}/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const variable = match[1].trim();
      const fullMatch = match[0];
      const startIndex = match.index;
      const endIndex = match.index + fullMatch.length;

      // Resolve the variable value from dataSources
      let resolvedValue = resolveVariableValue(variable, dataSources);

      variables.push({
        variable: fullMatch,
        startIndex,
        endIndex,
        value: resolvedValue
      });
    }

    return variables;
  };

  // Resolve variable value from nested object paths
  const resolveVariableValue = (path: string, data: Record<string, any>): any => {
    try {
      const keys = path.split('.');
      let current = data;

      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key];
        } else {
          return `[${path}] - No data`;
        }
      }

      return current;
    } catch (error) {
      return `[${path}] - Error`;
    }
  };

  // Generate the complete interpolated text with variables replaced by actual values
  const getInterpolatedText = (): string => {
    if (!value || currentVariables.length === 0) {
      return value;
    }

    let result = value;
    
    // Replace variables with their actual values (in reverse order to maintain indices)
    currentVariables
      .sort((a, b) => b.startIndex - a.startIndex)
      .forEach(variable => {
        const replacement = typeof variable.value === 'object' 
          ? JSON.stringify(variable.value)
          : String(variable.value);
        
        result = result.substring(0, variable.startIndex) + 
                replacement + 
                result.substring(variable.endIndex);
      });

    return result;
  };

  // Render text with blue template variables
  const renderColoredText = () => {
    if (!value) {
      return isFocused ? null : (
        <span className="text-gray-400 select-none">
          {placeholder}
        </span>
      );
    }

    if (currentVariables.length === 0) {
      return <span className="text-white">{value}</span>;
    }

    const parts = [];
    let lastIndex = 0;

    currentVariables.forEach((variable, index) => {
      // Add text before variable
      if (variable.startIndex > lastIndex) {
        parts.push(
          <span key={`text-${index}`} className="text-white">
            {value.substring(lastIndex, variable.startIndex)}
          </span>
        );
      }

      // Add blue template variable
      parts.push(
        <span key={`var-${index}`} className="text-blue-400">
          {variable.variable}
        </span>
      );

      lastIndex = variable.endIndex;
    });

    // Add remaining text
    if (lastIndex < value.length) {
      parts.push(
        <span key="text-end" className="text-white">
          {value.substring(lastIndex)}
        </span>
      );
    }

    return parts;
  };

  // Update variables when value or dataSources change
  useEffect(() => {
    const variables = parseTemplateVariables(value);
    setCurrentVariables(variables);
  }, [value, dataSources]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsTyping(true);

    // Clear existing timeout
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }

    // Show tooltip if there are variables and user is typing
    const variables = parseTemplateVariables(newValue);
    if (variables.length > 0) {
      setShowTooltip(true);
      updateTooltipPosition();

      // Hide tooltip after 3 seconds of no typing
      tooltipTimeoutRef.current = setTimeout(() => {
        setShowTooltip(false);
        setIsTyping(false);
      }, 3000);
    } else {
      setShowTooltip(false);
      setIsTyping(false);
    }
  };

  // Update tooltip position to be well above the input
  const updateTooltipPosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 200 // Much higher above the input to avoid covering
      });
    }
  };

  // Handle input focus
  const handleFocus = () => {
    setIsFocused(true);
    if (currentVariables.length > 0) {
      setShowTooltip(true);
      updateTooltipPosition();
    }
  };

  // Handle input blur
  const handleBlur = () => {
    setIsFocused(false);
    // Delay hiding tooltip to allow for hover
    setTimeout(() => {
      setShowTooltip(false);
      setIsTyping(false);
    }, 200);
  };

  // Render tooltip with interpolated text
  const renderTooltip = () => {
    if (!showTooltip || currentVariables.length === 0) return null;

    const interpolatedText = getInterpolatedText();

    return (
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.9 }}
        className="fixed z-[10000] bg-gray-900 border border-gray-600 rounded-lg shadow-2xl p-3 max-w-md"
        style={{
          left: tooltipPosition.x,
          top: tooltipPosition.y,
          transform: 'translateX(-50%) translateY(-100%)'
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="text-xs text-gray-400 mb-2 font-medium">Preview with actual values:</div>
        <div className="text-sm text-white bg-gray-800 rounded p-2 max-h-32 overflow-auto whitespace-pre-wrap">
          {interpolatedText}
        </div>
        <div className="text-xs text-gray-500 mt-2">
          💡 Template variables resolved at runtime
        </div>
      </motion.div>
    );
  };

  const baseClasses = `
    bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm
    focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
    transition-all duration-200 font-mono
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `;

  const InputComponent = multiline ? 'textarea' : 'input';

  return (
    <div className="relative">
      {/* Hidden input for actual functionality */}
      <InputComponent
        ref={inputRef as any}
        type={multiline ? undefined : type}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder=""
        disabled={disabled}
        rows={multiline ? rows : undefined}
        className={`${baseClasses} absolute inset-0 text-transparent caret-white resize-none`}
        style={{
          background: 'transparent',
          border: 'none',
          outline: 'none',
          resize: multiline ? ('vertical' as const) : undefined,
          minHeight: multiline ? `${rows * 1.5}rem` : undefined
        }}
      />

      {/* Visible display with colored text */}
      <div
        className={`${baseClasses} pointer-events-none select-none overflow-hidden`}
        style={{
          minHeight: multiline ? `${rows * 1.5}rem` : undefined,
          whiteSpace: multiline ? 'pre-wrap' : 'nowrap'
        }}
      >
        {renderColoredText()}
      </div>

      {/* Tooltip positioned well above input */}
      <AnimatePresence>
        {renderTooltip()}
      </AnimatePresence>
    </div>
  );
};

export default TemplateInput; 