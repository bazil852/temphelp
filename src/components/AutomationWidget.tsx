import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle2, X } from 'lucide-react';

interface Trigger {
  id: number;
  name: string;
  time: string;
}

interface AutomationWidgetProps {
  activeTriggers: number;
  recentTriggers: Trigger[];
}

export default function AutomationWidget({ activeTriggers, recentTriggers }: AutomationWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      layout
      initial={{ borderRadius: 16 }}
      animate={{ borderRadius: isExpanded ? 24 : 16 }}
      transition={{ type: 'spring', stiffness: 250, damping: 25 }}
      className={`relative bg-white/5 backdrop-blur-xl border border-white/10 shadow-md cursor-pointer ${
        isExpanded ? 'min-w-[500px] min-h-[300px] flex-[2]' : 'w-[160px] h-[160px] flex-none'
      }`}
      onClick={() => setIsExpanded(true)}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Hover Tooltip */}
      <AnimatePresence>
        {!isExpanded && isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-3 py-1.5"
          >
            <span className="text-white text-xs font-medium">View automation history</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative h-full">
        {/* Default State */}
        <AnimatePresence>
          {!isExpanded && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center p-4"
            >
              <div className="text-center">
                <Bell className="w-8 h-8 text-white mx-auto mb-2" />
                <span className="text-white text-sm font-medium">Automation Triggers</span>
                <span className="text-cyan-500 text-xs block mt-1">{activeTriggers} Active</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expanded State */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="absolute inset-0 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Active Automation Triggers
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-cyan-500 text-sm font-medium">{activeTriggers} Active</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsExpanded(false);
                    }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <AnimatePresence>
                {recentTriggers.map((trigger) => (
                  <motion.div
                    key={trigger.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="flex items-center gap-2 text-gray-300 text-xs py-2"
                  >
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    <span>Triggered: {trigger.name}</span>
                    <span className="text-gray-500">({trigger.time})</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
} 