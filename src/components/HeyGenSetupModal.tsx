import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

interface GuideSection {
  title: string;
  content: React.ReactNode;
  isOpen: boolean;
}

export default function HeyGenSetupModal({ onClose }: { onClose: () => void }) {
  const [sections, setSections] = useState<GuideSection[]>([
    {
      title: "Setting Up Your Template",
      content: (
        <ol className="list-decimal list-inside space-y-3">
          <li>Log in to your HeyGen account at <a href="https://app.heygen.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">app.heygen.com</a></li>
          <li>Navigate to Templates in the left sidebar</li>
          <li>Click "Create Template"</li>
          <li><strong className="text-blue-600">Important:</strong> Configure your template:
            <ul className="list-disc list-inside ml-6 mt-2 space-y-2">
              <li className="text-blue-600 font-semibold">Set the page to portrait mode (9:16 ratio)</li>
              <li className="text-blue-600 font-semibold">Choose a neon green background color</li>
            </ul>
          </li>
          <li>Select your avatar:
            <ul className="list-disc list-inside ml-6 mt-2">
              <li>Choose from available avatars or import your own</li>
              <li>Select/configure the desired voice</li>
            </ul>
          </li>
          <li><strong className="text-blue-600">Critical Step:</strong> In the script input area, type exactly: {"{{Script}}"}</li>
          <li>Save your template and copy the Template ID from the URL</li>
        </ol>
      ),
      isOpen: false
    },
    {
      title: "Getting Your API Key - HeyGen",
      content: (
        <ol className="list-decimal list-inside space-y-3">
          <li>Log in to your HeyGen account</li>
          <li>Click on your profile picture in the top-right corner</li>
          <li>Select "Settings" from the dropdown menu</li>
          <li>Navigate to the "API" tab in the settings menu</li>
          <li>Click "Generate API Key" if you haven't created one before</li>
          <li>Copy your API key and store it securely</li>
          <li>Use this key in the AI Influencer app settings</li>
        </ol>
      ),
      isOpen: false
    },
    {
      title: "Getting Your API Key - OpenAI",
      content: (
        <ol className="list-decimal list-inside space-y-3">
          <li>Visit <a href="https://platform.openai.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">platform.openai.com</a></li>
          <li>Log in to your OpenAI account</li>
          <li>Click on your profile icon in the top-right</li>
          <li>Select "View API keys"</li>
          <li>Click "Create new secret key"</li>
          <li>Give your key a name (optional)</li>
          <li>Copy your API key immediately (it won't be shown again)</li>
          <li>Use this key in the AI Influencer app settings</li>
        </ol>
      ),
      isOpen: false
    }
  ]);

  const toggleSection = (index: number) => {
    setSections(sections.map((section, i) => ({
      ...section,
      isOpen: i === index ? !section.isOpen : section.isOpen
    })));
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            HeyGen Setup Guides
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {sections.map((section, index) => (
            <div key={index} className="border rounded-lg">
              <button
                onClick={() => toggleSection(index)}
                className="w-full px-4 py-3 flex justify-between items-center hover:bg-gray-50 rounded-lg"
              >
                <span className="font-medium text-gray-900">{section.title}</span>
                {section.isOpen ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </button>
              {section.isOpen && (
                <div className="px-4 pb-4 text-gray-600">
                  {section.content}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}