import { useState } from 'react';
import { ChevronDown, ChevronRight, Search, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ApiSidebarProps {
  endpoints: any;
  activeTab: 'influencers' | 'videos';
  setActiveTab: (tab: 'influencers' | 'videos') => void;
  setActiveEndpoint: (path: string, method: string) => void;
  activeEndpoint: { path: string; method: string } | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function ApiSidebar({
  endpoints,
  activeTab,
  setActiveTab,
  setActiveEndpoint,
  activeEndpoint,
  searchQuery,
  setSearchQuery
}: ApiSidebarProps) {
  const navigate = useNavigate();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Group endpoints by path
  const groupedEndpoints: Record<string, { path: string; methods: { method: string; summary: string }[] }> = {};
  
  if (endpoints) {
    Object.entries(endpoints).forEach(([path, methods]: [string, any]) => {
      if (!groupedEndpoints[path]) {
        groupedEndpoints[path] = { path, methods: [] };
      }
      
      Object.entries(methods).forEach(([method, data]: [string, any]) => {
        // Skip if endpoint doesn't match search
        if (searchQuery) {
          const searchLower = searchQuery.toLowerCase();
          const matchesSearch = 
            path.toLowerCase().includes(searchLower) ||
            method.toLowerCase().includes(searchLower) ||
            data.summary?.toLowerCase().includes(searchLower) ||
            data.description?.toLowerCase().includes(searchLower);
            
          if (!matchesSearch) return;
        }
        
        groupedEndpoints[path].methods.push({
          method,
          summary: data.summary || 'No description'
        });
      });
      
      // Remove empty paths (after filtering)
      if (groupedEndpoints[path].methods.length === 0) {
        delete groupedEndpoints[path];
      }
    });
  }

  const toggleGroup = (path: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-blue-500';
      case 'POST': return 'bg-green-500';
      case 'PUT': return 'bg-yellow-500';
      case 'DELETE': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const isEndpointActive = (path: string, method: string) => {
    return activeEndpoint?.path === path && activeEndpoint.method === method;
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-gray-900 border-r border-gray-800 w-72">
      {/* Back to platform button */}
      <div className="p-4 border-b border-gray-800">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-gray-300 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} className="mr-2" />
          <span>Back to Platform</span>
        </button>
      </div>
      
      {/* API Tabs */}
      <div className="flex border-b border-gray-800">
        <button 
          className={`flex-1 py-3 px-4 text-sm font-medium ${activeTab === 'influencers' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setActiveTab('influencers')}
        >
          Influencer API
        </button>
        <button 
          className={`flex-1 py-3 px-4 text-sm font-medium ${activeTab === 'videos' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setActiveTab('videos')}
        >
          Video API
        </button>
      </div>
      
      {/* Search */}
      <div className="p-4 border-b border-gray-800">
        <div className="relative">
          <input
            type="text"
            placeholder="Search endpoints..."
            className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 pl-9 text-sm text-white focus:outline-none focus:ring-1 focus:ring-green-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
        </div>
      </div>
      
      {/* Endpoints list */}
      <div className="flex-grow overflow-y-auto">
        {Object.values(groupedEndpoints).length > 0 ? (
          <div className="divide-y divide-gray-800">
            {Object.values(groupedEndpoints).map((group) => (
              <div key={group.path} className="py-1">
                <div 
                  className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-gray-800"
                  onClick={() => toggleGroup(group.path)}
                >
                  <div className="text-sm font-medium text-gray-300 truncate">
                    {group.path}
                  </div>
                  {expandedGroups[group.path] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
                
                {expandedGroups[group.path] && (
                  <div className="ml-4 border-l border-gray-800 pl-4">
                    {group.methods.map((methodData) => (
                      <button
                        key={`${group.path}-${methodData.method}`}
                        className={`flex items-center w-full text-left px-3 py-2 text-xs ${
                          isEndpointActive(group.path, methodData.method)
                            ? 'bg-gray-800 text-white'
                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`}
                        onClick={() => setActiveEndpoint(group.path, methodData.method)}
                      >
                        <span 
                          className={`inline-block w-14 rounded-sm px-2 py-1 text-xs font-mono text-center mr-2 ${getMethodColor(methodData.method)}`}
                        >
                          {methodData.method.toUpperCase()}
                        </span>
                        <span className="truncate">{methodData.summary}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-sm">
              {searchQuery ? 'No endpoints match your search' : 'No endpoints available'}
            </p>
          </div>
        )}
      </div>

      {/* API Info */}
      <div className="p-4 border-t border-gray-800 bg-gray-800/50">
        <div className="flex items-center text-xs text-gray-400">
          <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
          <span>API v1.0</span>
        </div>
      </div>
    </div>
  );
}
