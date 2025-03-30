import React from 'react';
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

interface CompleteStepProps {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  isPolling: boolean;
  showWarning: boolean;
  onNavigateBack: () => void;
}

export const CompleteStep: React.FC<CompleteStepProps> = ({
  status,
  progress,
  isPolling,
  showWarning,
  onNavigateBack
}) => {
  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6 text-center">
      {status === 'failed' ? (
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
      ) : (
        <CheckCircle2 className="w-16 h-16 text-[#c9fffc] mx-auto mb-4" />
      )}
      <h2 className="text-xl font-semibold text-white mb-2">
        {status === 'failed' 
          ? 'AI Twin Creation Failed' 
          : status === 'completed'
            ? 'AI Twin Created Successfully!'
            : 'AI Twin Creation in Progress'}
      </h2>
      {status === 'failed' ? (
        <p className="text-red-400 mb-6">
          There was an error creating your AI Twin. Please try again.
        </p>
      ) : isPolling ? (
        <>
          <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
            <div 
              className="bg-[#c9fffc] h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-gray-400 mb-6">
            Processing: {progress}% complete
            {showWarning && (
              <span className="block text-yellow-400 text-sm mt-2">
                Please don't close this page while processing...
              </span>
            )}
          </p>
        </>
      ) : (
        <p className="text-gray-400 mb-6">
          {status === 'completed' 
            ? 'Your AI Twin is ready to use!'
            : 'Great job! We\'re now processing your AI Twin. This may take a few minutes.'}
        </p>
      )}
      <button
        onClick={onNavigateBack}
        disabled={isPolling}
        className="px-6 py-3 bg-[#c9fffc] text-black rounded-lg hover:bg-[#a0fcf9] transition-colors font-medium"
      >
        Return to Dashboard
      </button>
    </div>
  );
};