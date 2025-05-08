import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { useInfluencerStore } from '../../../store/influencerStore';

interface ActionNodeProps {
  data: {
    label: string;
    config: {
      action: string;
      influencerId?: string;
      scriptSource?: string;
      script?: string;
    };
  };
}

export const ActionNode = memo(({ data }: ActionNodeProps) => {
  const influencers = useInfluencerStore((state) => state.getInfluencersForCurrentUser());
  const selectedInfluencer = data.config.influencerId
    ? influencers.find((i) => i.id === data.config.influencerId)
    : null;

  return (
    <div 
      className="influencer-card p-4 w-48"
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
        e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
      }}
    >
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-[#c9fffc]" />
      <div className="flex flex-col items-center">
        <div className="text-sm font-medium text-white">{data.label}</div>
        {data.config.action === 'generate_video' && selectedInfluencer && (
          <div className="mt-2">
            <img
              src={selectedInfluencer.preview_url}
              alt={selectedInfluencer.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-[#c9fffc]"
            />
            <div className="text-xs text-gray-400 text-center mt-1">
              {selectedInfluencer.name}
            </div>
            {data.config.scriptSource && (
              <div className="mt-2 text-xs text-gray-400 text-center">
                Script: {data.config.scriptSource === 'manual' ? 'Manual' : 'From Webhook'}
              </div>
            )}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-[#c9fffc]" />
    </div>
  );
});