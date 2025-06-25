import { useState, useEffect } from 'react';
import { Play, Check, Copy, AlertCircle, FileText, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { env } from '../../lib/env';

type EndpointData = {
  path: string;
  method: string;
  data: any;
};

interface SimpleTesterProps {
  endpoint: EndpointData | null;
  isModal?: boolean;
  onClose?: () => void;
}

// Component to render n8n-style structured view of JSON data
const StructuredView = ({ data }: { data: any }) => {
  const flattenObject = (obj: any, parentKey: string = '', result: Array<{key: string, value: any, type: string}> = []): Array<{key: string, value: any, type: string}> => {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = parentKey ? `${parentKey}.${key}` : key;
        const value = obj[key];
        
        if (value === null || value === undefined) {
          result.push({ key: newKey, value: 'null', type: 'null' });
        } else if (Array.isArray(value)) {
          result.push({ key: newKey, value: `Array (${value.length} items)`, type: 'array' });
          value.forEach((item, index) => {
            if (typeof item === 'object' && item !== null) {
              flattenObject(item, `${newKey}[${index}]`, result);
            } else {
              result.push({ 
                key: `${newKey}[${index}]`, 
                value: item, 
                type: typeof item 
              });
            }
          });
        } else if (typeof value === 'object') {
          result.push({ key: newKey, value: 'Object', type: 'object' });
          flattenObject(value, newKey, result);
        } else {
          result.push({ key: newKey, value: value, type: typeof value });
        }
      }
    }
    return result;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'string': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'number': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'boolean': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'array': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'object': return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'null': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'string': return '"abc"';
      case 'number': return '123';
      case 'boolean': return 'true/false';
      case 'array': return '[]';
      case 'object': return '{}';
      case 'null': return 'null';
      default: return '?';
    }
  };

  if (!data) {
    return <div className="text-gray-400 text-sm">No data to display</div>;
  }

  try {
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    const flattenedData = flattenObject(parsedData);

    return (
      <div className="space-y-2">
        {/* Header */}
        <div className="grid grid-cols-12 gap-2 pb-3 border-b border-gray-600">
          <div className="col-span-5 text-xs font-medium text-gray-400 uppercase tracking-wider">Key</div>
          <div className="col-span-2 text-xs font-medium text-gray-400 uppercase tracking-wider">Type</div>
          <div className="col-span-5 text-xs font-medium text-gray-400 uppercase tracking-wider">Value</div>
        </div>

        {/* Data Rows */}
        <AnimatePresence>
          {flattenedData.map((item, index) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02, duration: 0.2 }}
              className="grid grid-cols-12 gap-2 py-2 hover:bg-gray-800/50 rounded-lg transition-colors group"
            >
              {/* Key Column */}
              <div className="col-span-5 flex items-center">
                <div className="bg-gray-800 border border-gray-600 rounded-md px-3 py-2 w-full">
                  <span className="text-sm font-mono text-gray-200 break-all">
                    {item.key}
                  </span>
                </div>
              </div>

              {/* Type Column */}
              <div className="col-span-2 flex items-center">
                <div className={`border rounded-md px-2 py-1 w-full text-center ${getTypeColor(item.type)}`}>
                  <span className="text-xs font-medium">
                    {getTypeIcon(item.type)}
                  </span>
                </div>
              </div>

              {/* Value Column */}
              <div className="col-span-5 flex items-center">
                <div className="bg-gray-800 border border-gray-600 rounded-md px-3 py-2 w-full relative group">
                  <span className="text-sm font-mono text-white break-all">
                    {item.type === 'string' ? `"${item.value}"` : String(item.value)}
                  </span>
                  {/* Copy button */}
                  <button
                    onClick={() => navigator.clipboard.writeText(String(item.value))}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Summary */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: flattenedData.length * 0.02 + 0.2 }}
          className="pt-3 border-t border-gray-600 text-xs text-gray-400"
        >
          {flattenedData.length} properties total
        </motion.div>
      </div>
    );
  } catch (error) {
    return (
      <div className="text-red-400 text-sm">
        Unable to parse response as structured data
      </div>
    );
  }
};

export default function SimpleTester({ endpoint, isModal = false, onClose }: SimpleTesterProps) {
  // Always define all hooks at the top level
  const [apiKey, setApiKey] = useState('');
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseViewMode, setResponseViewMode] = useState<'json' | 'structured'>('json');

  // Use effect to update request body when endpoint changes
  useEffect(() => {
    setResponse(null);
    setError(null);
    setResponseStatus(null);
    
    if (endpoint && endpoint.data.requestBody) {
      try {
        const initialBody = createInitialRequestBody(endpoint);
        setRequestBody(initialBody);
      } catch (err) {
        console.error('Error creating initial request body:', err);
        setRequestBody('');
      }
    } else {
      setRequestBody('');
    }
  }, [endpoint]);

  // Helper function to create the initial request body
  const createInitialRequestBody = (currentEndpoint: EndpointData): string => {
    if (!currentEndpoint?.data.requestBody?.content?.['application/json']?.schema?.properties) {
      return '';
    }
    
    try {
      const properties = currentEndpoint.data.requestBody.content['application/json'].schema.properties;
      const initialBody: any = {};
      
      Object.entries(properties).forEach(([key, value]: [string, any]) => {
        if (value.example) {
          initialBody[key] = value.example;
        } else if (value.type === 'string') {
          initialBody[key] = '';
        } else if (value.type === 'number' || value.type === 'integer') {
          initialBody[key] = 0;
        } else if (value.type === 'boolean') {
          initialBody[key] = false;
        } else if (value.type === 'array') {
          initialBody[key] = [];
        } else if (value.type === 'object') {
          initialBody[key] = {};
        }
      });
      
      return JSON.stringify(initialBody, null, 2);
    } catch (err) {
      console.error('Error parsing schema:', err);
      return '';
    }
  };
  
  // Copy to clipboard handler
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };
  
  // Handle test endpoint click - updated to make real API calls
  const handleTestEndpoint = async () => {
    if (!endpoint) return;
    
    setLoading(true);
    setError(null);
    setResponse(null);
    setResponseStatus(null);
    
    try {
      // Get the base URL from environment variable
      const baseUrl = env.API_TESTURL || 'http://localhost:3000';
      
      // Construct the full URL, handling path parameters
      let url = `${baseUrl}${endpoint.path}`;
      
      // Replace path parameters with placeholder values for testing
      // For example: /api/v1/influencers/{id} becomes /api/v1/influencers/test-id
      url = url.replace(/{id}/g, 'test-id');
      
      // Prepare headers
      const headers: any = {
        'Content-Type': 'application/json',
      };
      
      // Add API key if provided
      if (apiKey.trim()) {
        headers['x-api-key'] = apiKey.trim();
      }
      
      // Prepare fetch options
      const fetchOptions: RequestInit = {
        method: endpoint.method.toUpperCase(),
        headers,
      };
      
      // Add body for POST, PUT, PATCH methods
      if (['POST', 'PUT', 'PATCH'].includes(endpoint.method.toUpperCase()) && requestBody.trim()) {
        try {
          // Validate JSON before sending
          JSON.parse(requestBody);
          fetchOptions.body = requestBody;
        } catch (parseError) {
          setError('Invalid JSON in request body');
          setLoading(false);
          return;
        }
      }
      
      // Make the actual API call
      const fetchResponse = await fetch(url, fetchOptions);
      const statusCode = fetchResponse.status;
      setResponseStatus(statusCode);
      
      // Try to parse response as JSON
      let responseData;
      const contentType = fetchResponse.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await fetchResponse.json();
      } else {
        responseData = await fetchResponse.text();
      }
      
      // Format the response
      const formattedResponse = typeof responseData === 'object' 
        ? JSON.stringify(responseData, null, 2)
        : responseData;
      
      setResponse(formattedResponse);
      
    } catch (err: any) {
      console.error('API call error:', err);
      setError(err.message || 'Network error occurred');
      setResponse(JSON.stringify({ 
        error: 'Failed to make API call',
        message: err.message || 'Network error occurred',
        details: 'Make sure the API server is running and accessible'
      }, null, 2));
    }
    
    setLoading(false);
  };
  
  // Method color helper
  const getMethodColor = (methodType: string) => {
    switch (methodType.toUpperCase()) {
      case 'GET': return 'bg-blue-500 hover:bg-blue-600';
      case 'POST': return 'bg-[#c9fffc] hover:bg-[#c9fffc]/80';
      case 'PUT': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'DELETE': return 'bg-red-500 hover:bg-red-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  // Status color helper
  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-400';
    if (status >= 400 && status < 500) return 'text-yellow-400';
    if (status >= 500) return 'text-red-400';
    return 'text-gray-400';
  };

  // Input change handlers
  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
  };
  
  const handleRequestBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRequestBody(e.target.value);
    
    // Try to validate the JSON
    try {
      if (e.target.value.trim()) {
        JSON.parse(e.target.value);
        setError(null);
      } else {
        setError(null);
      }
    } catch (err) {
      setError('Invalid JSON format');
    }
  };

  // Render placeholder if no endpoint selected
  if (!endpoint) {
    return (
      <div className={`h-screen overflow-y-auto bg-gray-900 ${isModal ? 'w-full' : 'border-l border-gray-800 w-96'} p-4 flex-shrink-0`}>
        <div className="h-full flex items-center justify-center text-gray-500">
          <p>Select an endpoint to test</p>
        </div>
      </div>
    );
  }

  // Main render with endpoint
  return (
    <div className={`${isModal ? 'h-full w-full bg-[#0D1117]' : 'h-screen bg-gray-900 border-l border-gray-800 w-96'} overflow-y-auto p-4 flex-shrink-0`}>
      <div className="mb-6">
        <h3 className="text-lg font-medium text-white mb-4">
          {isModal ? 'API Endpoint Tester' : 'Test Endpoint'}
        </h3>
        
        {isModal ? (
          // Modal layout with grid and animations
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full"
          >
            {/* Left side - Request configuration */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="space-y-6"
            >
              <div className="bg-gray-800/50 backdrop-blur-xl rounded-lg overflow-hidden border border-gray-700">
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="px-4 py-3 bg-gray-800 border-b border-gray-700 flex items-center"
                >
                  <span className={`inline-block w-16 rounded text-xs font-mono text-center py-1 ${getMethodColor(endpoint.method)}`}>
                    {endpoint.method.toUpperCase()}
                  </span>
                  <span className="ml-2 text-sm text-gray-300 font-mono">{endpoint.path}</span>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="p-6 space-y-6"
                >
                  {/* Base URL Display */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                  >
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Base URL
                    </label>
                    <div className="bg-gray-900 border border-gray-700 rounded-md py-3 px-4 text-sm text-gray-300 font-mono">
                      {env.API_TESTURL || 'http://localhost:3000'}
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                  >
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      API Key
                    </label>
                    <input
                      type="text"
                      className="w-full bg-gray-900 border border-gray-700 rounded-md py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#c9fffc] focus:border-transparent transition-all"
                      placeholder="Enter your API key"
                      value={apiKey}
                      onChange={handleApiKeyChange}
                    />
                  </motion.div>
                  
                  {endpoint.method.toUpperCase() !== 'GET' && endpoint.method.toUpperCase() !== 'DELETE' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.6 }}
                    >
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Request Body
                      </label>
                      <div className="relative">
                        <textarea
                          className={`w-full bg-gray-900 border ${error ? 'border-red-500' : 'border-gray-700'} rounded-md py-3 px-4 text-sm text-white font-mono min-h-[300px] focus:outline-none focus:ring-2 focus:ring-[#c9fffc] focus:border-transparent transition-all`}
                          placeholder="Enter request body as JSON"
                          value={requestBody}
                          onChange={handleRequestBodyChange}
                        />
                        {error && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute top-3 right-3 text-red-500 text-xs flex items-center"
                          >
                            <AlertCircle size={14} className="mr-1" />
                            {error}
                          </motion.div>
                        )}
                      </div>
                      <div className="flex justify-between mt-3">
                        <button
                          className="text-sm text-gray-400 hover:text-white transition-colors"
                          onClick={() => setRequestBody(createInitialRequestBody(endpoint))}
                        >
                          Reset to Example
                        </button>
                        <button
                          className="text-sm text-gray-400 hover:text-white transition-colors"
                          onClick={() => copyToClipboard(requestBody, 'request')}
                        >
                          {copied === 'request' ? (
                            <span className="flex items-center"><Check size={14} className="mr-1" /> Copied</span>
                          ) : (
                            <span className="flex items-center"><Copy size={14} className="mr-1" /> Copy</span>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}
                  
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.7 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-3 px-6 rounded-md text-white flex items-center justify-center text-base font-medium transition-all ${
                      loading 
                        ? 'bg-gray-700 cursor-not-allowed' 
                        : `${getMethodColor(endpoint.method)} hover:shadow-lg`
                    }`}
                    onClick={handleTestEndpoint}
                    disabled={loading}
                  >
                    {loading ? (
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-gray-300 border-t-white rounded-full mr-2"
                      />
                    ) : (
                      <Play size={18} className="mr-2" />
                    )}
                    Test Endpoint
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>

            {/* Right side - Response */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="space-y-6"
            >
              <AnimatePresence mode="wait">
                {response ? (
                  <motion.div 
                    key="response"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="bg-gray-800/50 backdrop-blur-xl rounded-lg border border-gray-700 h-full flex flex-col"
                  >
                    <div className="flex items-center justify-between p-4 border-b border-gray-700">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-white mr-3">Response</h3>
                        {responseStatus && (
                          <motion.span 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`text-sm font-mono px-2 py-1 rounded ${getStatusColor(responseStatus)} bg-gray-700`}
                          >
                            {responseStatus}
                          </motion.span>
                        )}
                      </div>
                      <button
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                        onClick={() => copyToClipboard(response, 'response')}
                      >
                        {copied === 'response' ? (
                          <span className="flex items-center"><Check size={14} className="mr-1" /> Copied</span>
                        ) : (
                          <span className="flex items-center"><Copy size={14} className="mr-1" /> Copy</span>
                        )}
                      </button>
                    </div>
                    
                    {/* Response View Tabs */}
                    <div className="px-4 pt-4">
                      <div className="flex bg-gray-800 rounded-lg p-1">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-all ${
                            responseViewMode === 'json'
                              ? 'bg-[#c9fffc] text-black shadow-lg'
                              : 'text-gray-300 hover:text-white hover:bg-gray-700'
                          }`}
                          onClick={() => setResponseViewMode('json')}
                        >
                          <FileText size={14} className="mr-2" />
                          JSON
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-all ${
                            responseViewMode === 'structured'
                              ? 'bg-[#c9fffc] text-black shadow-lg'
                              : 'text-gray-300 hover:text-white hover:bg-gray-700'
                          }`}
                          onClick={() => setResponseViewMode('structured')}
                        >
                          <List size={14} className="mr-2" />
                          Structured
                        </motion.button>
                      </div>
                    </div>
                    
                    {/* Response Content */}
                    <div className="flex-1 p-4 overflow-hidden">
                      <div className="bg-gray-900 border border-gray-700 rounded-md h-full overflow-hidden">
                        <AnimatePresence mode="wait">
                          {responseViewMode === 'json' ? (
                            <motion.pre 
                              key="json"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="p-4 text-sm text-[#c9fffc] font-mono overflow-auto h-full"
                            >
                              {response}
                            </motion.pre>
                          ) : (
                            <motion.div 
                              key="structured"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="p-4 h-full overflow-y-auto"
                            >
                              <StructuredView data={response} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                    className="bg-gray-800/50 backdrop-blur-xl rounded-lg border border-gray-700 h-full flex items-center justify-center"
                  >
                    <div className="text-center text-gray-400">
                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Play size={48} className="mx-auto mb-4 opacity-50" />
                      </motion.div>
                      <p className="text-lg">Click "Test Endpoint" to see the response</p>
                      <p className="text-sm mt-2">Response will appear here in JSON or structured format</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        ) : (
          // Original sidebar layout
        <div className="bg-gray-800 rounded-lg overflow-hidden mb-4">
          <div className="px-4 py-3 bg-gray-800 border-b border-gray-700 flex items-center">
            <span className={`inline-block w-16 rounded text-xs font-mono text-center py-1 ${getMethodColor(endpoint.method)}`}>
              {endpoint.method.toUpperCase()}
            </span>
            <span className="ml-2 text-sm text-gray-300 font-mono">{endpoint.path}</span>
          </div>
          
          <div className="p-4">
              {/* Base URL Display */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Base URL
                </label>
                <div className="bg-gray-900 border border-gray-700 rounded-md py-2 px-3 text-sm text-gray-300 font-mono">
                  {env.API_TESTURL || 'http://localhost:3000'}
                </div>
              </div>
              
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                API Key
              </label>
              <input
                type="text"
                className="w-full bg-gray-900 border border-gray-700 rounded-md py-2 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#c9fffc]"
                placeholder="Enter your API key"
                value={apiKey}
                onChange={handleApiKeyChange}
              />
            </div>
            
            {endpoint.method.toUpperCase() !== 'GET' && endpoint.method.toUpperCase() !== 'DELETE' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Request Body
                </label>
                <div className="relative">
                  <textarea
                    className={`w-full bg-gray-900 border ${error ? 'border-red-500' : 'border-gray-700'} rounded-md py-2 px-3 text-sm text-white font-mono min-h-[200px] focus:outline-none focus:ring-1 focus:ring-[#c9fffc]`}
                    placeholder="Enter request body as JSON"
                    value={requestBody}
                    onChange={handleRequestBodyChange}
                  />
                  {error && (
                    <div className="absolute top-2 right-2 text-red-500 text-xs flex items-center">
                      <AlertCircle size={12} className="mr-1" />
                      {error}
                    </div>
                  )}
                </div>
                <div className="flex justify-between mt-2">
                  <button
                    className="text-xs text-gray-400 hover:text-white"
                    onClick={() => setRequestBody(createInitialRequestBody(endpoint))}
                  >
                    Reset to Example
                  </button>
                  <button
                    className="text-xs text-gray-400 hover:text-white"
                    onClick={() => copyToClipboard(requestBody, 'request')}
                  >
                    {copied === 'request' ? (
                      <span className="flex items-center"><Check size={12} className="mr-1" /> Copied</span>
                    ) : (
                      <span className="flex items-center"><Copy size={12} className="mr-1" /> Copy</span>
                    )}
                  </button>
                </div>
              </div>
            )}
            
            <button
              className={`w-full py-2 px-4 rounded-md text-white flex items-center justify-center ${
                loading 
                  ? 'bg-gray-700 cursor-not-allowed' 
                  : `${getMethodColor(endpoint.method)}`
              }`}
              onClick={handleTestEndpoint}
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-white rounded-full animate-spin mr-2"></div>
              ) : (
                <Play size={16} className="mr-2" />
              )}
              Test Endpoint
            </button>
          </div>
        </div>
        )}
        
        {!isModal && response && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <h3 className="text-md font-medium text-white mr-3">Response</h3>
                {responseStatus && (
                  <span className={`text-sm font-mono ${getStatusColor(responseStatus)}`}>
                    {responseStatus}
                  </span>
                )}
              </div>
              <button
                className="text-xs text-gray-400 hover:text-white"
                onClick={() => copyToClipboard(response, 'response')}
              >
                {copied === 'response' ? (
                  <span className="flex items-center"><Check size={12} className="mr-1" /> Copied</span>
                ) : (
                  <span className="flex items-center"><Copy size={12} className="mr-1" /> Copy</span>
                )}
              </button>
            </div>
            
            {/* Response View Tabs */}
            <div className="mb-4">
              <div className="flex bg-gray-800 rounded-lg p-1">
                <button
                  className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    responseViewMode === 'json'
                      ? 'bg-[#c9fffc] text-black'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                  onClick={() => setResponseViewMode('json')}
                >
                  <FileText size={14} className="mr-2" />
                  JSON
                </button>
                <button
                  className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    responseViewMode === 'structured'
                      ? 'bg-[#c9fffc] text-black'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                  onClick={() => setResponseViewMode('structured')}
                >
                  <List size={14} className="mr-2" />
                  Structured
                </button>
              </div>
            </div>
            
            {/* Response Content */}
            <div className="bg-gray-800 border border-gray-700 rounded-md overflow-hidden">
              {responseViewMode === 'json' ? (
                <pre className="p-4 text-sm text-[#c9fffc] font-mono overflow-x-auto">
              {response}
            </pre>
              ) : (
                <div className="p-4 max-h-96 overflow-y-auto">
                  <StructuredView data={response} />
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* API Testing Notes */}
        {!isModal && (
          <div className="mt-6 bg-gray-800/50 rounded-lg p-3 border border-gray-700">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Testing Notes</h4>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Path parameters like {`{id}`} are replaced with "test-id"</li>
              <li>• Make sure your API server is running on the configured URL</li>
              <li>• Ensure CORS is properly configured for the API server</li>
              <li>• Check the Network tab in DevTools for request details</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
