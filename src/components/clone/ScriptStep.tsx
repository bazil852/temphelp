import React from 'react';
import { Loader2 } from 'lucide-react';

interface ScriptStepProps {
  onGenerateScript: () => void;
  isLoading: boolean;
  script: string;
}

export const ScriptStep: React.FC<ScriptStepProps> = ({
  onGenerateScript,
  isLoading,
  script
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-[#1a1a1a] rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Get Calibration Script
        </h2>
        <p className="text-gray-400 mb-6">
          First, we'll generate a calibration script for you to read.
          This helps create the most accurate voice clone.
        </p>
        {script ? (
          <div className="bg-gray-800 p-4 rounded-lg mb-6">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Your Script:</h3>
            <p className="text-white">{script}</p>
          </div>
        ) : (
          <button
            onClick={onGenerateScript}
            disabled={isLoading}
            className="w-full px-6 py-3 bg-[#c9fffc] text-black rounded-lg hover:bg-[#a0fcf9] disabled:opacity-50 transition-colors font-medium flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Script...
              </>
            ) : (
              'Generate Script'
            )}
          </button>
        )}
      </div>
    </div>
  );
};