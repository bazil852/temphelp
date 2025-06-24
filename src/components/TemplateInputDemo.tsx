import React, { useState } from 'react';
import TemplateInput from './TemplateInput';

const TemplateInputDemo: React.FC = () => {
  const [value, setValue] = useState('Hello {{ctx.trigger.user.name}}, your order {{ctx.trigger.order.id}} is ready!');
  const [multilineValue, setMultilineValue] = useState(`Subject: Order Confirmation

Dear \{\{ctx.trigger.user.name\}\},

Your order #\{\{ctx.trigger.order.id\}\} has been processed successfully.

Details:
- Total: $\{\{ctx.trigger.order.total\}\}
- Status: \{\{ctx.trigger.order.status\}\}
- Delivery: \{\{ctx.trigger.order.delivery_date\}\}

Thank you for your business!`);

  // Sample data sources for demo
  const sampleDataSources = {
    trigger: {
      user: {
        name: 'John Doe',
        email: 'john@example.com',
        id: 'user_123'
      },
      order: {
        id: 'ORD-2024-001',
        total: 149.99,
        status: 'confirmed',
        delivery_date: '2024-01-15',
        items: [
          { name: 'Product A', price: 99.99 },
          { name: 'Product B', price: 49.99 }
        ]
      }
    },
    httpResponse: {
      status: 200,
      data: {
        success: true,
        processed_at: '2024-01-10T15:30:00Z'
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Template Input Demo</h1>
        <p className="text-gray-400">
          Type or drag template variables like <code className="bg-gray-800 px-1 rounded">{'{{ctx.trigger.user.name}}'}</code> 
          to see them highlighted in light blue. Hover or type to see actual values!
        </p>
      </div>

      <div className="space-y-8">
        {/* Single Line Template Input */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">Single Line Template</h2>
          <TemplateInput
            value={value}
            onChange={setValue}
            placeholder="Enter a message with template variables..."
            className="w-full"
            dataSources={sampleDataSources}
          />
          <p className="text-xs text-gray-400 mt-2">
            Try typing: Hello {'{{ctx.trigger.user.name}}'}, your total is ${'{{ctx.trigger.order.total}}'}
          </p>
        </div>

        {/* Multi-line Template Input */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">Multi-line Template</h2>
          <TemplateInput
            value={multilineValue}
            onChange={setMultilineValue}
            placeholder="Enter a multi-line template..."
            className="w-full"
            multiline={true}
            rows={8}
            dataSources={sampleDataSources}
          />
          <p className="text-xs text-gray-400 mt-2">
            Multi-line support with template variable highlighting and value tooltips
          </p>
        </div>

        {/* Sample Data Preview */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">Available Template Variables</h2>
          <div className="bg-gray-800 rounded-lg p-4">
            <pre className="text-xs text-gray-300 overflow-auto">
              {JSON.stringify(sampleDataSources, null, 2)}
            </pre>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            These values will be shown in the tooltip when you type template variables
          </p>
        </div>

        {/* Usage Examples */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">Common Template Patterns</h2>
          <div className="space-y-2 text-sm">
            <div className="bg-gray-800 rounded px-3 py-2">
              <code className="text-blue-300">{'{{ctx.trigger.user.name}}'}</code>
              <span className="text-gray-400 ml-2">→ User's name</span>
            </div>
            <div className="bg-gray-800 rounded px-3 py-2">
              <code className="text-blue-300">{'{{ctx.trigger.order.total}}'}</code>
              <span className="text-gray-400 ml-2">→ Order total amount</span>
            </div>
            <div className="bg-gray-800 rounded px-3 py-2">
              <code className="text-blue-300">{'{{ctx.httpResponse.data.success}}'}</code>
              <span className="text-gray-400 ml-2">→ HTTP response data</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateInputDemo; 