import React, { useState, useEffect } from 'react';
import { X, ChevronRight } from 'lucide-react';

interface Step {
  content: string;
  element?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  centerScreen?: boolean;
}

const steps: Step[] = [
  {
    content: "Hey, welcome to The AI Accelerator, click start to start the tour",
    centerScreen: true
  },
  {
    content: "Here are your settings, in here you can adjust your API Keys for HeyGen and OpenAI",
    element: "[data-tour='settings']",
    position: "bottom"
  },
  {
    content: "For instructions with the HeyGen or OpenAI setup, you can click here",
    element: "[data-tour='heygen-setup']",
    position: "bottom"
  },
  {
    content: 'You can click the "+" Button, to create a new Influencer',
    element: "[data-tour='create-influencer']",
    position: "bottom"
  },
  {
    content: "Or you can click here to create up to 150 videos at once!",
    element: "[data-tour='calendar']",
    position: "bottom"
  },
  {
    content: 'When you create your influencer you can use the "Edit" Button to change their TemplateID or the "Content" Button to manage and create their videos',
    centerScreen: true
  },
  {
    content: "And here you can set up automations, allowing you to connect your AI influencer into any workflow seamlessly",
    element: "[data-tour='automations']",
    position: "bottom"
  },
  {
    content: "And lastly you can come here 24/7 to get help, or email us at contact@thementorprogram.xyz!",
    element: "[data-tour='chatbot']",
    position: "left"
  }
];

interface GuidedTourProps {
  onClose: () => void;
}

export default function GuidedTour({ onClose }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState({});

  useEffect(() => {
    const step = steps[currentStep];
    if (step.element && !step.centerScreen) {
      const element = document.querySelector(step.element);
      if (element) {
        const rect = element.getBoundingClientRect();
        const position = step.position || 'bottom';
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const tooltipWidth = 300;
        const tooltipHeight = 150;
        
        // Clear any existing highlights
        document.querySelectorAll('.tour-highlight').forEach(el => {
          el.classList.remove('tour-highlight', 'ring-4', 'ring-[#c9fffc]', 'ring-opacity-100', 'animate-pulse', 'z-[60]');
        });
        
        // Add highlight to current element
        element.classList.add(
          'tour-highlight',
          'ring-4',
          'ring-[#c9fffc]',
          'ring-opacity-100',
          'animate-pulse',
          'z-[60]'
        );
        
        // Calculate tooltip position
        let top = 0;
        let left = 0;

        switch (position) {
          case 'top':
            top = Math.max(16, rect.top - tooltipHeight - 16);
            left = Math.min(
              Math.max(16, rect.left + (rect.width / 2) - (tooltipWidth / 2)),
              windowWidth - tooltipWidth - 16
            );
            break;
          case 'bottom':
            top = Math.min(rect.bottom + 16, windowHeight - tooltipHeight - 16);
            left = Math.min(
              Math.max(16, rect.left + (rect.width / 2) - (tooltipWidth / 2)),
              windowWidth - tooltipWidth - 16
            );
            break;
          case 'left':
            top = rect.top + (rect.height * 0.65) - (tooltipHeight / 2);
            left = rect.left - tooltipWidth - 16;
            break;
          case 'right':
            top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
            left = rect.right + 16;
            break;
        }

        // Mobile adjustments
        if (windowWidth < 640) {
          if (step.element === '[data-tour="chatbot"]') {
            top = rect.top - tooltipHeight - 16;
            left = Math.min(
              Math.max(16, rect.left + (rect.width / 2) - (tooltipWidth / 2)),
              windowWidth - tooltipWidth - 16
            );
          }
        }

        setTooltipStyle({ top, left });

        return () => {
          element.classList.remove(
            'tour-highlight',
            'ring-4',
            'ring-[#c9fffc]',
            'ring-opacity-100',
            'animate-pulse',
            'z-[60]'
          );
        };
      }
    } else {
      // Center the tooltip for full-screen steps
      setTooltipStyle({
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      });
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity duration-300 ease-in-out z-50" />
      <div 
        className="fixed z-[61] bg-white rounded-lg shadow-xl p-6 w-[300px] transition-all duration-300 ease-in-out"
        style={tooltipStyle}
      >
        <div className="flex justify-between items-start mb-4">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <p className="text-gray-600 mb-6">
          {steps[currentStep].content}
        </p>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {currentStep + 1} of {steps.length}
          </span>
          <button
            onClick={handleNext}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-black bg-[#c9fffc] hover:bg-[#a0fcf9] transition-colors"
          >
            {currentStep === steps.length - 1 ? 'End Tour' : 'Next'}
            {currentStep < steps.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
          </button>
        </div>
      </div>
    </>
  );
}