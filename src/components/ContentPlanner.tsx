import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useInfluencerStore } from '../store/influencerStore';
import { useContentStore } from '../store/contentStore';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { uploadAudioToSupabase } from '../lib/supabase';

interface ContentRow {
  id: string;
  influencerId: string;
  prompt: string;
  title: string;
  cta: string;
  script: string;
  isGenerating: boolean;
  isSelected: boolean;
}

export default function ContentPlanner({ onClose }: { onClose: () => void }) {
  const influencers = useInfluencerStore((state) => state.getInfluencersForCurrentUser());
  const { currentUser } = useAuthStore();
  const { currentUser } = useAuthStore();
  const { generateScript, generateVideo } = useContentStore();
  const [rows, setRows] = useState<ContentRow[]>([{
    id: crypto.randomUUID(),
    influencerId: influencers[0]?.id || '',
    prompt: '',
    title: '',
    cta: '',
    script: '',
    isGenerating: false,
    isSelected: false
  }]);
  const [isGenerating, setIsGenerating] = useState(false);

  const addRow = () => {
    setRows([...rows, {
      id: crypto.randomUUID(),
      influencerId: influencers[0]?.id || '',
      prompt: '',
      title: '',
      cta: '',
      script: '',
      isGenerating: false,
      isSelected: false
    }]);
  };

  const updateRow = (id: string, updates: Partial<ContentRow>) => {
    setRows(rows.map(row => row.id === id ? { ...row, ...updates } : row));
  };

  const deleteRow = (id: string) => {
    setRows(rows.filter(row => row.id !== id));
  };

  const generateScriptForRow = async (row: ContentRow) => {
    if (!row.prompt) return;

    updateRow(row.id, { isGenerating: true });
    try {
      const prompt = `Create a script for a social media video with the following context:
      ${row.prompt}
      
      Call to Action: ${row.cta}
      
      Make the script engaging, conversational, and natural. Include the call to action seamlessly.`;

      const script = await generateScript(prompt);
      updateRow(row.id, { script, isGenerating: false });
    } catch (error) {
      console.error('Failed to generate script:', error);
      updateRow(row.id, { isGenerating: false });
    }
  };

  const handleGenerateSelected = async () => {
    console.log("Here");
    const selectedRows = rows.filter(row => row.isSelected && row.script && row.title);
    if (selectedRows.length === 0) return;
    console.log("Here 1111");
    setIsGenerating(true);
    setError('');

    try {
      for (const row of selectedRows) {
        console.log("Here");
        const influencer = influencers.find(inf => inf.id === row.influencerId);
        if (!influencer) continue;

        

        // Create video with audio URL and duration
        // First generate audio and get duration
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${influencer.voice_id}?output_format=mp3_44100_128`, {
          method: 'POST',
          headers: {
            'xi-api-key': import.meta.env.VITE_ELEVEN,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: row.script,
            model_id: 'eleven_multilingual_v2'
          })
        });

        if (!response.ok) {
          throw new Error('Failed to generate audio');
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        // Get audio duration
        const audio = new Audio(audioUrl);
        const audioDuration = await new Promise<number>((resolve) => {
          audio.addEventListener('loadedmetadata', () => {
            resolve(audio.duration);
          });
        });

        // Convert to minutes and round up
        const durationInMinutes = Math.ceil(audioDuration / 60);

        // Update user's video minutes usage
        const { error: usageError } = await supabase.rpc("increment_user_video_minutes", {
          p_user_id: currentUser?.id,
          increment_value: durationInMinutes
        });

        if (usageError) {
          throw new Error('Failed to update video minutes usage');
        }

        // Upload audio to Supabase
        const publicUrl = await uploadAudioToSupabase(audioBlob);

        // Create video with audio URL and duration
        await generateVideo({
          influencerId: influencer.id,
          templateId: influencer.templateId,
          script: row.script,
          title: row.title,
          audioUrl: publicUrl,
          title: row.title,
          audioUrl: publicUrl,
          durationInMinutes
        });
      }
      onClose();
    } catch (error) {
      console.error('Failed to generate videos:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate videos');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-7xl p-6 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Content Planner</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={handleGenerateSelected}
              disabled={isGenerating || !rows.some(r => r.isSelected)}
              className="px-4 py-2 bg-blue-600 text-black rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Generate Selected
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Influencer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Script Creation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CTA
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Select
                </th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-6 py-4">
                    <select
                      value={row.influencerId}
                      onChange={(e) => updateRow(row.id, { influencerId: e.target.value })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      {influencers.map((inf) => (
                        <option key={inf.id} value={inf.id}>
                          {inf.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <textarea
                        value={row.prompt}
                        onChange={(e) => updateRow(row.id, { prompt: e.target.value })}
                        placeholder="Enter prompt or script..."
                        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                          row.isGenerating ? 'bg-blue-50' : ''
                        }`}
                        rows={2}
                      />
                      {row.script && (
                        <textarea
                          value={row.script}
                          onChange={(e) => updateRow(row.id, { script: e.target.value })}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          rows={2}
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      value={row.title}
                      onChange={(e) => updateRow(row.id, { title: e.target.value })}
                      placeholder="Enter title..."
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      value={row.cta}
                      onChange={(e) => updateRow(row.id, { cta: e.target.value })}
                      placeholder="Enter call to action..."
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => generateScriptForRow(row)}
                      disabled={!row.prompt || row.isGenerating}
                      className="px-3 py-1 bg-blue-600 text-black rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      Generate Script
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={row.isSelected}
                      onChange={(e) => updateRow(row.id, { isSelected: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => deleteRow(row.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-center">
          <button
            onClick={addRow}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Row
          </button>
        </div>
      </div>
    </div>
  );
}