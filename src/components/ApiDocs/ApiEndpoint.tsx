import { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check, Play } from 'lucide-react';

interface ApiEndpointProps {
  path: string;
  method: string;
  data: any;
}

export default function ApiEndpoint({ path, method, data }: ApiEndpointProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    description: true,
    request: true,
    response: true,
    examples: true,
  });
  const [activeResponse, setActiveResponse] = useState<string>("200");
  const [testResponse, setTestResponse] = useState<string | null>(null);

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-blue-500';
      case 'POST': return 'bg-green-500';
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

  const handleTestEndpoint = () => {
    // In a real app, you would make an actual API call here
    if (data.responses && data.responses[activeResponse]) {
      const exampleResponse = data.responses[activeResponse]?.content?.['application/json']?.schema;
      if (exampleResponse) {
        try {
          // Create a reasonable mock response based on the schema
          const mockResponse = createMockResponseFromSchema(exampleResponse);
          setTestResponse(JSON.stringify(mockResponse, null, 2));
        } catch (e) {
          setTestResponse(JSON.stringify({ error: "Could not generate mock response" }, null, 2));
        }
      }
    }
  };

  // Helper function to generate mock data from a schema
  const createMockResponseFromSchema = (schema: any) => {
    if (!schema || !schema.properties) {
      return { message: "Example response unavailable" };
    }

    const result: any = {};
    Object.entries(schema.properties).forEach(([key, propSchema]: [string, any]) => {
      if (propSchema.example !== undefined) {
        result[key] = propSchema.example;
      } else if (propSchema.type === 'object' && propSchema.properties) {
        result[key] = createMockResponseFromSchema(propSchema);
      } else if (propSchema.type === 'array' && propSchema.items) {
        result[key] = [createMockResponseFromSchema(propSchema.items)];
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

    return result;
  };

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 mb-8">
      <div className="flex items-center mb-4">
        <span 
          className={`inline-block w-20 h-8 rounded text-xs font-bold flex items-center justify-center mr-3 ${getMethodColor(method)}`}
        >
          {method.toUpperCase()}
        </span>
        <h1 className="text-2xl font-bold">{data.summary}</h1>
      </div>

      <div className="bg-gray-800/50 rounded-lg p-4 mb-6 flex items-center">
        <span className="text-gray-400 mr-2">Endpoint:</span>
        <code className="text-lime-300 flex-1">{path}</code>
        <button
          onClick={() => copyToClipboard(path, 'endpoint')}
          className="text-gray-400 hover:text-white p-1"
        >
          {copied === 'endpoint' ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>

      {/* Description Section */}
      <div className="mb-6">
        <div 
          className="flex items-center justify-between cursor-pointer mb-2" 
          onClick={() => toggleSection('description')}
        >
          <h3 className="text-lg font-semibold">Description</h3>
          {expandedSections.description ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>
        
        {expandedSections.description && (
          <div className="bg-gray-800/50 rounded-lg p-4 text-gray-300">
            <p>{data.description}</p>
            {data.parameters && (
              <div className="mt-4">
                <h4 className="text-md font-semibold mb-2">Parameters</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">Type</th>
                        <th className="text-left p-2">Description</th>
                        <th className="text-left p-2">Required</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.parameters.map((param: any, index: number) => (
                        <tr key={index} className="border-b border-gray-700">
                          <td className="p-2">{param.name}</td>
                          <td className="p-2">{param.schema?.type || '-'}</td>
                          <td className="p-2">{param.description}</td>
                          <td className="p-2">{param.required ? '✓' : '×'}</td>
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
      {data.requestBody && (
        <div className="mb-6">
          <div 
            className="flex items-center justify-between cursor-pointer mb-2" 
            onClick={() => toggleSection('request')}
          >
            <h3 className="text-lg font-semibold">Request Body</h3>
            {expandedSections.request ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>
          
          {expandedSections.request && (
            <div className="relative">
              <div className="bg-gray-800/50 rounded-lg p-4 text-gray-300">
                <p className="mb-2">Content Type: <code>application/json</code></p>
                {data.requestBody.required && <p className="mb-2 text-yellow-400">Required: Yes</p>}
                
                {data.requestBody.content?.['application/json']?.schema?.properties && (
                  <div className="mt-4">
                    <h4 className="text-md font-semibold mb-2">Schema</h4>
                    <pre className="bg-gray-900/50 rounded-lg p-4 overflow-x-auto text-sm">
                      {JSON.stringify(data.requestBody.content['application/json'].schema, null, 2)}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(data.requestBody.content['application/json'].schema, null, 2), 'request')}
                      className="absolute top-8 right-8 text-gray-400 hover:text-white p-1 bg-gray-800/70 rounded"
                    >
                      {copied === 'request' ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Response */}
      {data.responses && (
        <div className="mb-6">
          <div 
            className="flex items-center justify-between cursor-pointer mb-2"
            onClick={() => toggleSection('response')}
          >
            <h3 className="text-lg font-semibold">Responses</h3>
            {expandedSections.response ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>
          
          {expandedSections.response && (
            <div className="relative">
              <div className="mb-4 flex space-x-2">
                {Object.keys(data.responses).map((statusCode) => (
                  <button
                    key={statusCode}
                    onClick={() => setActiveResponse(statusCode)}
                    className={`px-3 py-1 rounded-md ${
                      activeResponse === statusCode 
                        ? 'bg-green-800 text-white' 
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {statusCode}
                  </button>
                ))}
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-gray-300 mb-2">{data.responses[activeResponse]?.description}</p>
                
                {data.responses[activeResponse]?.content?.['application/json']?.schema && (
                  <div className="mt-4">
                    <h4 className="text-md font-semibold mb-2 text-gray-300">Schema</h4>
                    <pre className="bg-gray-900/50 rounded-lg p-4 overflow-x-auto text-sm text-gray-300">
                      {JSON.stringify(data.responses[activeResponse].content['application/json'].schema, null, 2)}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(data.responses[activeResponse].content['application/json'].schema, null, 2), 'response')}
                      className="absolute top-24 right-8 text-gray-400 hover:text-white p-1 bg-gray-800/70 rounded"
                    >
                      {copied === 'response' ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Code Examples */}
      {data['x-code-samples'] && (
        <div className="mb-6">
          <div 
            className="flex items-center justify-between cursor-pointer mb-2"
            onClick={() => toggleSection('examples')}
          >
            <h3 className="text-lg font-semibold">Code Examples</h3>
            {expandedSections.examples ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>
          
          {expandedSections.examples && (
            <div>
              {data['x-code-samples'].map((sample: any, index: number) => (
                <div key={index} className="mb-4">
                  <h4 className="text-md font-semibold mb-2 text-gray-300">{sample.lang}</h4>
                  <div className="relative">
                    <pre className="bg-gray-800/50 rounded-lg p-4 overflow-x-auto text-sm text-gray-300">
                      {sample.source}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(sample.source, `example-${index}`)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-white p-1 bg-gray-800/70 rounded"
                    >
                      {copied === `example-${index}` ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Test Endpoint */}
      <div className="mt-8">
        <button
          onClick={handleTestEndpoint}
          className="bg-green-800 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
        >
          <Play size={16} className="mr-2" />
          Test Endpoint
        </button>

        {testResponse && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Test Response</h3>
            <div className="relative">
              <pre className="bg-gray-800/50 rounded-lg p-4 overflow-x-auto text-sm text-green-300">
                {testResponse}
              </pre>
              <button
                onClick={() => copyToClipboard(testResponse, 'test')}
                className="absolute top-2 right-2 text-gray-400 hover:text-white p-1 bg-gray-800/70 rounded"
              >
                {copied === 'test' ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
