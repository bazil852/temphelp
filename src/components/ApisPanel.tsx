import React, { useEffect, useState } from "react";
import { Key, Loader2, Save } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";

export default function ApisPanel() {
    const navigate = useNavigate();
    const { currentUser, updateApiKeys } = useAuthStore();
    const [webhookLoading, setWebhookLoading] = useState(true);
    const [webhookSaving, setWebhookSaving] = useState(false);
    const [webhookUrl, setWebhookUrl] = useState("");
    const [webhookError, setwebhookError] = useState("");
    const [webhookSuccess, setWebhookSuccess] = useState("");
    const [supportWebhookUrl, setSupportWebhookUrl] = useState("");
    const [supportWebhookError, setSupportWebhookError] = useState("");
    const [supportWebhookSuccess, setSupportWebhookSuccess] = useState("");
    //Apis
    const [openaiKey, setOpenaiKey] = useState(currentUser?.openaiApiKey || "");
    const [heygenKey, setHeygenKey] = useState(currentUser?.heygenApiKey || "");
    const [elevenLabsApiKey, setElevenLabsApiKey] = useState(currentUser?.elevenLabsApiKey || "");
    const [isApisSaving, setIsApisSaving] = useState(false);
    const [apisError, setApisError] = useState("");
    const [apisSuccess, setApisSuccess] = useState("");

    useEffect(() => {
        fetchWebhookUrl();
        fetchSupportWebhookUrl();
    }, []);

    const fetchWebhookUrl = async () => {
        setWebhookLoading(true);
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
            setwebhookError('Failed to fetch webhook URL');
        } finally {
            setWebhookLoading(false);
        }
    };

    const fetchSupportWebhookUrl = async () => {
        setWebhookLoading(true);
        try {
            const { data, error } = await supabase
                .from('support_webhook')
                .select('url, id')
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            if (data) {
                setSupportWebhookUrl(data.url);
            }
        } catch (err) {
            console.error('Error fetching support webhook URL:', err);
            setSupportWebhookError('Failed to fetch support webhook URL');
        } finally {
            setWebhookLoading(false);
        }
    };

    const handleSubmitWebhook = async (e: React.FormEvent) => {
        e.preventDefault();
        setWebhookSaving(true);
        setwebhookError("");
        setWebhookSuccess("");

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

            setWebhookSuccess('Webhook URL updated successfully');
        } catch (err) {
            console.error('Error saving webhook URL:', err);
            setwebhookError('Failed to save webhook URL');
        } finally {
            setWebhookSaving(false);
        }
    };

    const handleSupportWebhookSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setWebhookSaving(true);
        setSupportWebhookError("");
        setSupportWebhookSuccess("");

        try {
            // Check if a record exists
            const { data: existingData } = await supabase
                .from('support_webhook')
                .select('id')
                .single();

            if (existingData) {
                // Update existing record
                const { error } = await supabase
                    .from('support_webhook')
                    .update({ url: supportWebhookUrl })
                    .eq('id', existingData.id);
                if (error) throw error;
            } else {
                // Insert new record
                const { error } = await supabase
                    .from('support_webhook')
                    .insert([{ url: supportWebhookUrl }]);
                if (error) throw error;
            }

            setSupportWebhookSuccess('Support webhook URL updated successfully');
        } catch (err) {
            console.error('Error saving support webhook URL:', err);
            setSupportWebhookError('Failed to save support webhook URL');
        } finally {
            setWebhookSaving(false);
        }
    };

    if (webhookLoading) {
        return (
            <div className="flex items-center justify-center my-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    //Apis
    const handleApisSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsApisSaving(true);
        setApisError("");
        setApisSuccess("");

        try {
            updateApiKeys(openaiKey, heygenKey, elevenLabsApiKey);
            setApisSuccess("API keys saved successfully!");
            setTimeout(() => {
                navigate("/dashboard");
            }, 1500);
        } catch (err) {
            setApisError("Failed to save API keys");
        } finally {
            setIsApisSaving(false);
        }
    };

    if (!currentUser) {
        navigate("/login");
        return null;
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Apis Configuration</h1>

            <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
                {webhookError && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                        {webhookError}
                    </div>
                )}
                {webhookSuccess && (
                    <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                        {webhookSuccess}
                    </div>
                )}

                <form onSubmit={handleSubmitWebhook} className="space-y-6">
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
                            disabled={webhookSaving}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {webhookSaving ? (
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

            <div className="bg-white shadow rounded-lg p-6 max-w-2xl mt-8">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Support Tickets Webhook</h2>

                {supportWebhookError && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                        {supportWebhookError}
                    </div>
                )}
                {supportWebhookSuccess && (
                    <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                        {supportWebhookSuccess}
                    </div>
                )}

                <form onSubmit={handleSupportWebhookSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="supportWebhookUrl" className="block text-sm font-medium text-gray-700">
                            Support Tickets Webhook URL
                        </label>
                        <div className="mt-1">
                            <input
                                type="url"
                                id="supportWebhookUrl"
                                value={supportWebhookUrl}
                                onChange={(e) => setSupportWebhookUrl(e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                placeholder="https://your-webhook-url.com"
                                required
                            />
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                            This URL will be used to send notifications when new support tickets are created.
                        </p>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={webhookSaving}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {webhookSaving ? (
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

            <div className="bg-white shadow rounded-lg p-6 max-w-2xl mt-8">
                <h2 className="text-lg font-medium text-gray-900 mb-6">API Settings</h2>

                {apisError && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                        {apisError}
                    </div>
                )}

                {apisSuccess && (
                    <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                        {apisSuccess}
                    </div>
                )}

                <form onSubmit={handleApisSubmit} className="space-y-6">
                    <div>
                        <label
                            htmlFor="openai-key"
                            className="block text-sm font-medium text-gray-700"
                        >
                            OpenAI API Key
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Key className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="password"
                                id="openai-key"
                                value={openaiKey}
                                onChange={(e) => setOpenaiKey(e.target.value)}
                                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="sk-..."
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="heygen-key"
                            className="block text-sm font-medium text-gray-700"
                        >
                            HeyGen API Key
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Key className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="password"
                                id="heygen-key"
                                value={heygenKey}
                                onChange={(e) => setHeygenKey(e.target.value)}
                                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Enter your HeyGen API key"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label
                            htmlFor="eleven-labs-api-key"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Eleven Labs API Key
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Key className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="password"
                                id="eleven-labs-api-key"
                                value={elevenLabsApiKey}
                                onChange={(e) => setElevenLabsApiKey(e.target.value)}
                                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Enter your Eleven Labs API key"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isApisSaving}
                            className="inline-flex justify-center w-32 py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-black bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {isApisSaving ? "Saving..." : "Save Settings"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}