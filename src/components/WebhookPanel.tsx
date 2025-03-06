import React, { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function WebhookPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchWebhookUrl();
  }, []);

  const fetchWebhookUrl = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('webhook_influencer')
        .select('url')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setWebhookUrl(data.url);
      }
    } catch (err) {
      console.error('Error fetching webhook URL:', err);
      setError('Failed to fetch webhook URL');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // Check if a record exists
      const { data: existingData } = await supabase
        .from('webhook_influencer')
        .select('id')
        .single();

      if (existingData) {
        // Update existing record
        const { error } = await supabase
          .from('webhook_influencer')
          .update({ url: webhookUrl })
          .eq('id', existingData.id);
        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('webhook_influencer')
          .insert([{ url: webhookUrl }]);
        if (error) throw error;
      }

      setSuccess('Webhook URL updated successfully');
    } catch (err) {
      console.error('Error saving webhook URL:', err);
      setError('Failed to save webhook URL');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center my-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Webhook Configuration</h1>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="webhookUrl" className="block text-sm font-medium text-gray-700">
              Webhook URL
            </label>
            <div className="mt-1">
              <input
                type="url"
                id="webhookUrl"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="https://your-webhook-url.com"
                required
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              This URL will be used to send notifications when new influencer requests are created.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="-ml-1 mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}