import { useState, useEffect } from 'react';
import ApiSidebar from '../components/ApiDocs/ApiSidebar';
import SimpleTester from '../components/ApiDocs/SimpleTester';
import { Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';

// Type for endpoint data
type EndpointData = {
  path: string;
  method: string;
  data: any;
}

export default function ApiDocsPage() {
  const [influencerEndpoints, setInfluencerEndpoints] = useState<any>(null);
  const [videoEndpoints, setVideoEndpoints] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'influencers' | 'videos'>('influencers');
  const [activeEndpoint, setActiveEndpoint] = useState<{path: string; method: string} | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    'description': true,
    'request': true,
    'response': true,
    'examples': true
  });

  useEffect(() => {
    const fetchEndpoints = async () => {
      try {
        const influencerResponse = await fetch('/influencer-endpoints.json');
        const videoResponse = await fetch('/video-endpoints.json');
        
        const influencerData = await influencerResponse.json();
        const videoData = await videoResponse.json();
        
        setInfluencerEndpoints(influencerData);
        setVideoEndpoints(videoData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching API endpoints:', error);
        setLoading(false);
      }
    };
    
    fetchEndpoints();
  }, []);
  
  useEffect(() => {
    // When active tab changes, reset the active endpoint
    setActiveEndpoint(null);
  }, [activeTab]);
  
  const handleSetActiveEndpoint = (path: string, method: string) => {
    setActiveEndpoint({ path, method });
  };
  
  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-blue-500';
      case 'POST': return 'bg-[#c9fffc]';
      case 'PUT': return 'bg-yellow-500';
      case 'DELETE': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopied(section);
    setTimeout(() => setCopied(null), 2000);
  };
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Get the current endpoint data
  const getCurrentEndpointData = (): EndpointData | null => {
    if (!activeEndpoint) return null;
    
    const endpoints = activeTab === 'influencers' ? influencerEndpoints : videoEndpoints;
    if (!endpoints || !endpoints[activeEndpoint.path]) return null;
    
    const methodData = endpoints[activeEndpoint.path][activeEndpoint.method];
    if (!methodData) return null;
    
    return {
      path: activeEndpoint.path,
      method: activeEndpoint.method,
      data: methodData
    };
  };

  const currentEndpointData = getCurrentEndpointData();
  
  return (
    <div className="h-screen overflow-hidden flex bg-gray-900 text-white w-full max-w-full">
      {/* Left sidebar with endpoints */}
      <ApiSidebar 
        endpoints={activeTab === 'influencers' ? influencerEndpoints : videoEndpoints}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setActiveEndpoint={handleSetActiveEndpoint}
        activeEndpoint={activeEndpoint}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      
      {/* Main content area */}
      <div className="flex-1 h-screen overflow-y-auto min-w-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-t-[#c9fffc] border-gray-700 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-300">Loading API documentation...</p>
            </div>
          </div>
        ) : currentEndpointData ? (
          <div className="p-6">
            {/* Endpoint title */}
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <span 
                  className={`inline-block w-20 rounded text-xs font-mono text-center py-1 ${getMethodColor(currentEndpointData.method)}`}
                >
                  {currentEndpointData.method.toUpperCase()}
                </span>
                <h1 className="text-2xl font-bold ml-3">{currentEndpointData.data.summary}</h1>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 flex items-center">
                <code className="text-[#c9fffc]300 flex-1 font-mono">{currentEndpointData.path}</code>
                <button
                  onClick={() => copyToClipboard(currentEndpointData.path, 'endpoint')}
                  className="text-gray-400 hover:bg-[#c9fffc]300 p-1"
                >
                  {copied === 'endpoint' ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>
            
            {/* Description */}
            <div className="mb-6">
              <div 
                className="flex items-center justify-between cursor-pointer mb-2" 
                onClick={() => toggleSection('description')}
              >
                <h3 className="text-lg font-semibold">Description</h3>
                {expandedSections.description ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              </div>
              
              {expandedSections.description && (
                <div className="bg-gray-800 rounded-lg p-4 text-gray-300">
                  <p>{currentEndpointData.data.description}</p>
                  
                  {/* Parameters if they exist */}
                  {currentEndpointData.data.parameters && (
                    <div className="mt-6">
                      <h4 className="text-md font-semibold mb-3">Path Parameters</h4>
                      <div className="bg-gray-900 rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-700">
                          <thead>
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Required</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-700">
                            {currentEndpointData.data.parameters.map((param: any, index: number) => (
                              <tr key={index}>
                                <td className="px-4 py-3 text-sm font-mono text-white">{param.name}</td>
                                <td className="px-4 py-3 text-sm text-gray-300">{param.schema?.type || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-300">{param.required ? 'Yes' : 'No'}</td>
                                <td className="px-4 py-3 text-sm text-gray-300">{param.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Request Body */}
            {currentEndpointData.data.requestBody && (
              <div className="mb-6">
                <div 
                  className="flex items-center justify-between cursor-pointer mb-2" 
                  onClick={() => toggleSection('request')}
                >
                  <h3 className="text-lg font-semibold">Request Body</h3>
                  {expandedSections.request ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
                
                {expandedSections.request && (
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="mb-3">
                      <span className="text-gray-400 text-sm">Content Type:</span>
                      <code className="ml-2 text-[#c9fffc] text-sm">application/json</code>
                    </div>
                    
                    {currentEndpointData.data.requestBody.required && (
                      <div className="mb-3">
                        <span className="text-yellow-400 text-sm font-medium">Required: Yes</span>
                      </div>
                    )}
                    
                    {currentEndpointData.data.requestBody.content?.['application/json']?.schema?.properties && (
                      <div className="relative">
                        <div className="bg-gray-900 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-400 mb-4">Body Parameters</h4>
                          <div className="space-y-4">
                            {Object.entries(currentEndpointData.data.requestBody.content['application/json'].schema.properties).map(([key, value]: [string, any]) => (
                              <div key={key} className="border border-gray-700 rounded-lg overflow-hidden">
                                <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
                                  <div className="flex items-center">
                                    <span className="font-mono text-[#c9fffc] font-medium">{key}</span>
                                    <span className="ml-3 text-xs bg-gray-700 px-2 py-1 rounded-md text-gray-300">
                                      {value.type || 'object'}
                                    </span>
                                    {value.required && (
                                      <span className="ml-2 text-xs bg-red-900/30 px-2 py-1 rounded-md text-red-300">
                                        required
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="p-3 border-t border-gray-700">
                                  <p className="text-gray-300 text-sm mb-2">
                                    {value.description || `The ${key} parameter`}
                                  </p>
                                  {value.example !== undefined && (
                                    <div className="mt-2">
                                      <p className="text-xs text-gray-400">Example:</p>
                                      <code className="block mt-1 text-xs text-[#c9fffc] font-mono bg-gray-800 p-2 rounded">
                                        {typeof value.example === 'object' ? 
                                          JSON.stringify(value.example, null, 2) : 
                                          String(value.example)}
                                      </code>
                                    </div>
                                  )}
                                  {value.enum && (
                                    <div className="mt-2">
                                      <p className="text-xs text-gray-400">Allowed values:</p>
                                      <div className="flex flex-wrap gap-2 mt-1">
                                        {value.enum.map((item: any, i: number) => (
                                          <span key={i} className="text-xs bg-gray-700 px-2 py-1 rounded-md text-[#c9fffc]">
                                            {String(item)}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={() => copyToClipboard(JSON.stringify(currentEndpointData.data.requestBody.content['application/json'].schema, null, 2), 'requestSchema')}
                          className="absolute top-4 right-4 text-gray-400 hover:text-[#c9fffc] p-1 bg-gray-800/70 rounded"
                        >
                          {copied === 'requestSchema' ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {/* Responses */}
            {currentEndpointData.data.responses && (
              <div className="mb-6">
                <div 
                  className="flex items-center justify-between cursor-pointer mb-2" 
                  onClick={() => toggleSection('response')}
                >
                  <h3 className="text-lg font-semibold">Responses</h3>
                  {expandedSections.response ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
                
                {expandedSections.response && (
                  <div className="space-y-4">
                    {Object.entries(currentEndpointData.data.responses).map(([code, response]: [string, any]) => (
                      <div key={code} className="bg-gray-800 rounded-lg overflow-hidden">
                        <div className={`px-4 py-3 ${code.startsWith('2') ? 'bg-[#c9fffc]/20' : code.startsWith('4') ? 'bg-red-900/30' : 'bg-gray-700'} border-b border-gray-700`}>
                          <div className="flex items-center">
                            <span className="font-mono text-white">{code}</span>
                            <span className="ml-3 text-gray-300">{response.description}</span>
                          </div>
                        </div>
                        
                        {response.content?.['application/json']?.schema && (
                          <div className="p-4 relative">
                            {response.content['application/json']?.schema?.properties ? (
                              <div className="space-y-4">
                                {Object.entries(response.content['application/json'].schema.properties).map(([key, value]: [string, any]) => (
                                  <div key={key} className="border border-gray-700 rounded-lg overflow-hidden">
                                    <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
                                      <div className="flex items-center">
                                        <span className="font-mono text-[#c9fffc] font-medium">{key}</span>
                                        <span className="ml-3 text-xs bg-gray-700 px-2 py-1 rounded-md text-gray-300">
                                          {value.type || 'object'}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="p-3 border-t border-gray-700">
                                      <p className="text-gray-300 text-sm mb-2">
                                        {value.description || `The ${key} value`}
                                      </p>
                                      {value.example !== undefined && (
                                        <div className="mt-2">
                                          <p className="text-xs text-gray-400">Example:</p>
                                          <code className="block mt-1 text-xs text-[#c9fffc] font-mono bg-gray-800 p-2 rounded">
                                            {typeof value.example === 'object' ? 
                                              JSON.stringify(value.example, null, 2) : 
                                              String(value.example)}
                                          </code>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <pre className="text-sm text-[#c9fffc] font-mono overflow-x-auto whitespace-pre-wrap">
                                {JSON.stringify(response.content['application/json'].schema, null, 2)}
                              </pre>
                            )}
                            <button
                              onClick={() => copyToClipboard(JSON.stringify(response.content['application/json'].schema, null, 2), `response-${code}`)}
                              className="absolute top-4 right-4 text-gray-400 hover:text-[#c9fffc] p-1 bg-gray-700/70 rounded"
                            >
                              {copied === `response-${code}` ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Code Examples */}
            {currentEndpointData.data['x-code-samples'] && (
              <div className="mb-6">
                <div 
                  className="flex items-center justify-between cursor-pointer mb-2" 
                  onClick={() => toggleSection('examples')}
                >
                  <h3 className="text-lg font-semibold">Code Examples</h3>
                  {expandedSections.examples ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
                
                {expandedSections.examples && (
                  <div className="space-y-4">
                    {currentEndpointData.data['x-code-samples'].map((sample: any, index: number) => (
                      <div key={index} className="bg-gray-800 rounded-lg overflow-hidden">
                        <div className="px-4 py-2 bg-gray-700 flex justify-between items-center">
                          <h4 className="text-sm font-medium">{sample.lang}</h4>
                          <button
                            onClick={() => copyToClipboard(sample.source, `example-${index}`)}
                            className="text-gray-400 hover:text-[#c9fffc] p-1 rounded"
                          >
                            {copied === `example-${index}` ? <Check size={16} /> : <Copy size={16} />}
                          </button>
                        </div>
                        <div className="p-4">
                          <pre className="text-sm text-[#c9fffc]300 font-mono overflow-x-auto whitespace-pre-wrap">
                            {sample.source}
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Base URL Information */}
            <div className="mt-10 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-300">Base URL</h3>
                  <code className="text-[#c9fffc] text-sm">https://api.aiinfluencer.com/v1</code>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-300">API Version</h3>
                  <span className="text-[#c9fffc] text-sm">v1.0</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-lg">
              <h2 className="text-xl font-bold mb-2">API Documentation</h2>
              <p className="text-gray-400 mb-4">
                Select an endpoint from the sidebar to view its documentation and test the API.
              </p>
              <div className="bg-gray-800 rounded-lg p-6 text-left">
                <h3 className="text-lg font-medium mb-3">Getting Started</h3>
                <p className="text-gray-300 mb-3">
                  All API requests require an API key for authentication. The key should be provided in the request headers as:
                </p>
                <code className="block bg-gray-900 p-3 rounded text-[#c9fffc] mb-6">
                  x-api-key: YOUR_API_KEY
                </code>
                <p className="text-gray-300 text-sm">
                  You can find your API key in the Settings panel of your account dashboard.  
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Right sidebar with API tester */}
      <SimpleTester endpoint={currentEndpointData} />
    </div>
  );
}
