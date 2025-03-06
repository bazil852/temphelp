import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface WebhookDocsProps {
  onClose: () => void;
}

type Language = 'curl' | 'python' | 'javascript' | 'php';

const codeExamples = {
  webhook: {
    curl: `curl -X POST "https://your-app.com/api/webhooks/<webhook-id>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "My Video Title",
    "script": "This is the video script that will be used to generate the video."
  }'`,
    python: `import requests
import json

url = "https://your-app.com/api/webhooks/<webhook-id>"
payload = {
    "title": "My Video Title",
    "script": "This is the video script that will be used to generate the video."
}

response = requests.post(url, json=payload)
print(response.json())`,
    javascript: `fetch('https://your-app.com/api/webhooks/<webhook-id>', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'My Video Title',
    script: 'This is the video script that will be used to generate the video.'
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`,
    php: `<?php
$url = 'https://your-app.com/api/webhooks/<webhook-id>';
$data = array(
    'title' => 'My Video Title',
    'script' => 'This is the video script that will be used to generate the video.'
);

$options = array(
    'http' => array(
        'header'  => "Content-type: application/json\\r\\n",
        'method'  => 'POST',
        'content' => json_encode($data)
    )
);

$context = stream_context_create($options);
$result = file_get_contents($url, false, $context);
echo $result;
?>`
  },
  automation: {
    curl: `# Example webhook payload you'll receive:
{
  "event": "video.completed",
  "content": {
    "title": "Video Title",
    "script": "Video Script",
    "influencerName": "Influencer Name",
    "video_url": "https://video-url.mp4",
    "status": "completed"
  }
}`,
    python: `from flask import Flask, request
app = Flask(__name__)

@app.route('/webhook', methods=['POST'])
def handle_webhook():
    data = request.json
    
    if data['event'] == 'video.completed':
        video_url = data['content']['video_url']
        title = data['content']['title']
        # Handle the completed video
        
    return {'status': 'success'}, 200`,
    javascript: `// Express.js example
app.post('/webhook', (req, res) => {
  const { event, content } = req.body;
  
  if (event === 'video.completed') {
    const { video_url, title, influencerName } = content;
    // Handle the completed video
  }
  
  res.json({ status: 'success' });
});`,
    php: `<?php
// Receive webhook
$payload = file_get_contents('php://input');
$data = json_decode($payload, true);

if ($data['event'] === 'video.completed') {
    $video_url = $data['content']['video_url'];
    $title = $data['content']['title'];
    // Handle the completed video
}

http_response_code(200);
echo json_encode(['status' => 'success']);
?>`
  }
};

export default function WebhookDocs({ onClose }: WebhookDocsProps) {
  const [language, setLanguage] = useState<Language>('curl');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = async (code: string, section: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1a1a1a] rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-semibold text-white">
            Webhooks & Automations Documentation
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-white mb-2">
            Code Language
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="mt-1 block w-full rounded-md border-gray-600 bg-[#2a2a2a] text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="curl">cURL</option>
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="php">PHP</option>
          </select>
        </div>

        <div className="space-y-8">
          {/* Incoming Webhooks Section */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">
              Incoming Webhooks
            </h3>
            <div className="prose prose-sm max-w-none mb-4 text-gray-300">
              <p>
                Incoming webhooks allow you to create videos programmatically. Send a POST request
                with the following parameters:
              </p>
              <ul className="list-disc list-inside mb-4">
                <li><code className="text-blue-400">title</code> (required): The title of the video</li>
                <li><code className="text-blue-400">script</code> (required): The script content for the video</li>
              </ul>
            </div>
            <div className="relative">
              <div className="absolute right-2 top-2">
                <button
                  onClick={() => copyToClipboard(codeExamples.webhook[language], 'webhook')}
                  className="p-2 text-gray-400 hover:text-gray-300 rounded-md"
                >
                  {copiedSection === 'webhook' ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </button>
              </div>
              <SyntaxHighlighter
                language={language}
                style={oneDark}
                className="rounded-lg"
              >
                {codeExamples.webhook[language]}
              </SyntaxHighlighter>
            </div>
          </div>

          {/* Outgoing Automations Section */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">
              Outgoing Automations
            </h3>
            <div className="prose prose-sm max-w-none mb-4 text-gray-300">
              <p>
                When a video is completed, we'll send a POST request to your endpoint with the
                following payload structure:
              </p>
              <ul className="list-disc list-inside mb-4">
                <li><code className="text-blue-400">event</code>: The type of event (video.completed)</li>
                <li><code className="text-blue-400">content.title</code>: The video title</li>
                <li><code className="text-blue-400">content.script</code>: The video script</li>
                <li><code className="text-blue-400">content.influencerName</code>: Name of the influencer</li>
                <li><code className="text-blue-400">content.video_url</code>: URL to the generated video</li>
                <li><code className="text-blue-400">content.status</code>: Status of the video (completed)</li>
              </ul>
            </div>
            <div className="relative">
              <div className="absolute right-2 top-2">
                <button
                  onClick={() => copyToClipboard(codeExamples.automation[language], 'automation')}
                  className="p-2 text-gray-400 hover:text-gray-300 rounded-md"
                >
                  {copiedSection === 'automation' ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </button>
              </div>
              <SyntaxHighlighter
                language={language}
                style={oneDark}
                className="rounded-lg"
              >
                {codeExamples.automation[language]}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}