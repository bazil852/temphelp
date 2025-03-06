import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface GuideStep {
  title: string;
  description: string;
}

const guideSteps: GuideStep[] = [
  {
    title: "Welcome to AI Influencer!",
    description: "Let's walk through creating your first AI-powered video content. Click 'Next' to begin."
  },
  {
    title: "Step 1: Create an Influencer",
    description: "Click the 'Create Influencer' button and give your AI personality a name. You'll need a HeyGen Template ID - you can find this in your HeyGen dashboard."
  },
  {
    title: "Step 2: Access Content Dashboard",
    description: "Click the video icon on your influencer's card to access their content dashboard where you can manage all videos."
  },
  {
    title: "Step 3: Create Your First Video",
    description: "Click 'Create New Video' and enter a title. You can write your own script or use our AI to generate one automatically!"
  },
  {
    title: "Step 4: Generate and Watch",
    description: "After submitting, we'll generate your video using HeyGen. Once complete, you can watch and share your AI-created content!"
  }
];

export default function GuideModal({ onClose }: { onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Quick Guide
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {guideSteps[currentStep].title}
          </h3>
          <p className="text-gray-600">
            {guideSteps[currentStep].description}
          </p>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </button>
          <span className="text-sm text-gray-500">
            {currentStep + 1} of {guideSteps.length}
          </span>
          <button
            onClick={handleNext}
            className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-black bg-blue-600 hover:bg-blue-700"
          >
            {currentStep === guideSteps.length - 1 ? 'Finish' : 'Next'}
            {currentStep < guideSteps.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
          </button>
        </div>
      </div>
    </div>
  );
}