import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { RecurrenceRule } from '../../types/content-planner';
import { RRule } from 'rrule';

interface RecurrenceEditorProps {
  recurrence: RecurrenceRule;
  onChange: (recurrence: RecurrenceRule) => void;
}

export default function RecurrenceEditor({ recurrence, onChange }: RecurrenceEditorProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFrequencyChange = (frequency: RecurrenceRule['frequency']) => {
    let newRecurrence: RecurrenceRule = { frequency };

    // Set default values based on frequency
    switch (frequency) {
      case 'weekly':
        newRecurrence.interval = 1;
        break;
      case 'bi-weekly':
        newRecurrence.interval = 2;
        break;
      case 'monthly':
        newRecurrence.interval = 1;
        break;
      case 'custom':
        newRecurrence.rruleString = 'FREQ=WEEKLY;INTERVAL=1';
        break;
    }

    onChange(newRecurrence);
  };

  const handleEndConditionChange = (type: 'count' | 'until' | 'never', value?: number | Date) => {
    const newRecurrence = { ...recurrence };
    
    // Clear existing end conditions
    delete newRecurrence.count;
    delete newRecurrence.until;
    
    if (type === 'count' && typeof value === 'number') {
      newRecurrence.count = value;
    } else if (type === 'until' && value instanceof Date) {
      newRecurrence.until = value;
    }
    
    onChange(newRecurrence);
  };

  const generateRRuleString = (): string => {
    if (recurrence.frequency === 'once') return '';
    if (recurrence.frequency === 'custom') return recurrence.rruleString || '';

    try {
      let freq: number;
      switch (recurrence.frequency) {
        case 'weekly':
        case 'bi-weekly':
          freq = RRule.WEEKLY;
          break;
        case 'monthly':
          freq = RRule.MONTHLY;
          break;
        default:
          return '';
      }

      const options: any = {
        freq,
        interval: recurrence.interval || 1
      };

      if (recurrence.count) {
        options.count = recurrence.count;
      } else if (recurrence.until) {
        options.until = recurrence.until;
      }

      const rule = new RRule(options);
      return rule.toString();
    } catch (error) {
      console.error('Error generating RRULE:', error);
      return '';
    }
  };

  const getFrequencyDescription = (): string => {
    switch (recurrence.frequency) {
      case 'once':
        return 'One-time event';
      case 'weekly':
        return 'Every week';
      case 'bi-weekly':
        return 'Every 2 weeks';
      case 'monthly':
        return 'Every month';
      case 'custom':
        return 'Custom recurrence';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Frequency Selection */}
      <div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {[
            { key: 'once', label: 'Once' },
            { key: 'weekly', label: 'Weekly' },
            { key: 'bi-weekly', label: 'Bi-weekly' },
            { key: 'monthly', label: 'Monthly' },
            { key: 'custom', label: 'Custom' }
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleFrequencyChange(key as RecurrenceRule['frequency'])}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                recurrence.frequency === key
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom RRULE Input */}
      {recurrence.frequency === 'custom' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            RRULE String
          </label>
          <input
            type="text"
            value={recurrence.rruleString || ''}
            onChange={(e) => onChange({ ...recurrence, rruleString: e.target.value })}
            placeholder="FREQ=WEEKLY;INTERVAL=1;BYDAY=MO"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Enter a valid iCal RRULE string. See{' '}
            <a
              href="https://icalendar.org/iCalendar-RFC-5545/3-8-5-3-recurrence-rule.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              RFC 5545
            </a>{' '}
            for syntax.
          </p>
        </div>
      )}

      {/* End Conditions - Only show for recurring events */}
      {recurrence.frequency !== 'once' && (
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ChevronDown className={`h-4 w-4 mr-1 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            End conditions
          </button>

          {showAdvanced && (
            <div className="mt-3 space-y-3 pl-5 border-l-2 border-gray-200">
              {/* Never ends */}
              <label className="flex items-center">
                <input
                  type="radio"
                  name="endCondition"
                  checked={!recurrence.count && !recurrence.until}
                  onChange={() => handleEndConditionChange('never')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Never ends</span>
              </label>

              {/* End after X occurrences */}
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="endCondition"
                  checked={!!recurrence.count}
                  onChange={() => handleEndConditionChange('count', 5)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">End after</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={recurrence.count || 5}
                  onChange={(e) => handleEndConditionChange('count', parseInt(e.target.value))}
                  disabled={!recurrence.count}
                  className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                />
                <span className="text-sm text-gray-700">occurrences</span>
              </label>

              {/* End on date */}
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="endCondition"
                  checked={!!recurrence.until}
                  onChange={() => handleEndConditionChange('until', new Date())}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">End on</span>
                <input
                  type="date"
                  value={recurrence.until ? recurrence.until.toISOString().split('T')[0] : ''}
                  onChange={(e) => handleEndConditionChange('until', new Date(e.target.value))}
                  disabled={!recurrence.until}
                  className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </label>
            </div>
          )}
        </div>
      )}

      {/* Preview */}
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Schedule:</span> {getFrequencyDescription()}
          {recurrence.count && ` (${recurrence.count} times)`}
          {recurrence.until && ` (until ${recurrence.until.toLocaleDateString()})`}
        </p>
        
        {recurrence.frequency !== 'once' && (
          <div className="mt-2">
            <p className="text-xs text-gray-500">
              <span className="font-medium">RRULE:</span> {generateRRuleString() || 'Invalid rule'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 