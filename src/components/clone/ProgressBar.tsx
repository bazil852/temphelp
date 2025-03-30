import React from 'react';

interface ProgressBarProps {
  progress: number;
  steps: {
    key: string;
    label: string;
  }[];
  currentStep: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, steps, currentStep }) => {
  return (
    <div className="mb-8">
      <div className="h-2 bg-gray-700 rounded-full">
        <div
          className="h-full bg-[#c9fffc] rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between mt-2 text-sm text-gray-400">
        {steps.map((step) => (
          <span
            key={step.key}
            className={progress >= steps.findIndex(s => s.key === step.key) * (100 / (steps.length - 1)) ? 'text-[#c9fffc]' : ''}
          >
            {step.label}
          </span>
        ))}
      </div>
    </div>
  );
};