import { useState, useEffect } from 'react';
import { Play, Check, Copy, AlertCircle } from 'lucide-react';

type EndpointData = {
  path: string;
  method: string;
  data: any;
};

interface SimpleTesterProps {
  endpoint: EndpointData | null;
}

export default function SimpleTester({ endpoint }: SimpleTesterProps) {
  // Always define all hooks at the top level
  const [apiKey, setApiKey] = useState('');
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Use effect to update request body when endpoint changes
  useEffect(() => {
    setResponse(null);
    setError(null);
    
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
  
  // Handle test endpoint click
  const handleTestEndpoint = () => {
    if (!endpoint) return;
    
    setLoading(true);
    
    // Mock API request with timeout
    setTimeout(() => {
      try {
        if (endpoint.data.responses) {
          // Find the first success response code (2xx)
          const successCode = Object.keys(endpoint.data.responses).find(code => code.startsWith('2'));
          
          if (successCode && endpoint.data.responses[successCode]?.content?.['application/json']?.schema) {
            try {
              // Create a mock response based on the schema
              const mockResponse = createMockResponse(endpoint.data.responses[successCode].content['application/json'].schema);
              setResponse(JSON.stringify(mockResponse, null, 2));
            } catch (err) {
              setResponse(JSON.stringify({ 
                message: "The request was successful but the response format is unknown" 
              }, null, 2));
            }
          } else {
            setResponse(JSON.stringify({ 
              message: "The request was successful" 
            }, null, 2));
          }
        } else {
          setResponse(JSON.stringify({ 
            message: "The request was successful" 
          }, null, 2));
        }
      } catch (err) {
        console.error('Error in test endpoint:', err);
        setResponse(JSON.stringify({ 
          error: "An unexpected error occurred"
        }, null, 2));
      }
      
      setLoading(false);
    }, 1000);
  };
  
  // Helper function to create mock responses
  const createMockResponse = (schema: any) => {
    if (!schema) return {};
    
    if (schema.example) {
      return schema.example;
    }
    
    const result: any = {};
    
    if (schema.properties) {
      Object.entries(schema.properties).forEach(([key, propSchema]: [string, any]) => {
        if (propSchema.example !== undefined) {
          result[key] = propSchema.example;
        } else if (propSchema.type === 'object' && propSchema.properties) {
          result[key] = createMockResponse(propSchema);
        } else if (propSchema.type === 'array' && propSchema.items) {
          result[key] = [createMockResponse(propSchema.items)];
        } else {
          switch (propSchema.type) {
            case 'string':
              result[key] = propSchema.format === 'date-time' ? new Date().toISOString() : 'string';
              break;
            case 'integer':
            case 'number':
              result[key] = 123;
              break;
            case 'boolean':
              result[key] = true;
              break;
            default:
              result[key] = null;
          }
        }
      });
    }
    
    return result;
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
      <div className="h-screen overflow-y-auto bg-gray-900 border-l border-gray-800 w-80 p-4 flex-shrink-0">
        <div className="h-full flex items-center justify-center text-gray-500">
          <p>Select an endpoint to test</p>
        </div>
      </div>
    );
  }

  // Main render with endpoint
  return (
    <div className="h-screen overflow-y-auto bg-gray-900 border-l border-gray-800 w-80 p-4 flex-shrink-0">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-white mb-4">Test Endpoint</h3>
        
        <div className="bg-gray-800 rounded-lg overflow-hidden mb-4">
          <div className="px-4 py-3 bg-gray-800 border-b border-gray-700 flex items-center">
            <span className={`inline-block w-16 rounded text-xs font-mono text-center py-1 ${getMethodColor(endpoint.method)}`}>
              {endpoint.method.toUpperCase()}
            </span>
            <span className="ml-2 text-sm text-gray-300 font-mono">{endpoint.path}</span>
          </div>
          
          <div className="p-4">
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
        
        {response && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-md font-medium text-white">Response</h3>
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
            <pre className="bg-gray-800 border border-gray-700 rounded-md p-4 text-sm text-[#c9fffc] font-mono overflow-x-auto">
              {response}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
