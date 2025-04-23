import React from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="bg-[#ffffff0d] backdrop-blur-xl border border-white/10 rounded-xl p-6"
    >
      <h2 className="text-xl font-bold text-white mb-2">
        Get Calibration Script
      </h2>
      <p className="text-sm text-white/60 mb-6">
        First, we'll generate a calibration script for you to read.
        This helps create the most accurate voice clone.
      </p>
      {script ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/5 p-4 rounded-xl mb-6 border border-white/10"
        >
          <h3 className="text-sm font-medium text-white/80 mb-2">Your Script:</h3>
          <p className="text-white/90">{script}</p>
        </motion.div>
      ) : (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onGenerateScript}
          disabled={isLoading}
          className="w-full bg-[#4DE0F9]/90 hover:bg-[#4DE0F9] text-black font-semibold rounded-full px-6 py-2 disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(77,224,249,0.3)] hover:shadow-[0_0_30px_rgba(77,224,249,0.4)]"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating Script...
            </>
          ) : (
            'Generate Script'
          )}
        </motion.button>
      )}
    </motion.div>
  );
};