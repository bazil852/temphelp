import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import ApiEndpoint from './ApiEndpoint';

interface EndpointGroupProps {
  groupName: string;
  endpoints: {
    path: string;
    method: string;
    data: any;
  }[];
}

export default function EndpointGroup({ groupName, endpoints }: EndpointGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="mb-8">
      <div 
        className="flex items-center justify-between cursor-pointer p-3 bg-white/10 backdrop-blur-xl rounded-lg mb-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-xl font-bold">{groupName}</h2>
        {isExpanded ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
      </div>
      
      {isExpanded && (
        <div className="space-y-6">
          {endpoints.map((endpoint, index) => (
            <ApiEndpoint 
              key={`${endpoint.path}-${endpoint.method}-${index}`}
              path={endpoint.path}
              method={endpoint.method}
              data={endpoint.data}
            />
          ))}
        </div>
      )}
    </div>
  );
}
