import React from 'react';
import WorkflowBuilder from '../components/workflow/WorkflowBuilder';

export default function WorkflowPage() {
  return (
    <div className="h-[calc(100vh-4rem)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#c9fffc]">Visual Workflow Builder</h1>
        <p className="text-gray-400 mt-2">Create automated workflows by connecting triggers and actions</p>
      </div>
      <div className="bg-[#1a1a1a] rounded-xl shadow-xl overflow-hidden h-[calc(100%-6rem)]">
        <WorkflowBuilder />
      </div>
    </div>
  );
}