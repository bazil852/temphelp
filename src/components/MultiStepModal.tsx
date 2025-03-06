import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Smartphone, User, Loader2, ChevronDown,Plus } from "lucide-react";
import { AlertCircle } from 'lucide-react';
import { useAuthStore } from "../store/authStore";
import { supabase } from "../lib/supabase";
import { usePlanLimits } from '../hooks/usePlanLimits';

interface MultiStepModalProps {
  onClose: () => void;
}

interface AvatarFormData {
  age: string;
  gender: "Male" | "Female";
  description: string;
  background: string;
  viewType: "Full Body" | "Waist Up" | "Head Shot";
  viewFormat: "9:16" | "16:9";
  voiceDescription: string;
}

interface CallFormData {
  title: string;
  description: string;
}

const AGE_OPTIONS = [
  "18-25", "26-35", "36-45", "46-55", "56-65", "65+"
];

const VIEW_TYPES = ["Full Body", "Waist Up", "Head Shot"] as const;

const SAMPLE_VOICE_DESCRIPTION = "The voice is of a 25 yo male. It has a deep pitch of voice and a very conversational tone. Talks at medium pace with confidence and enthusiasm like a true sales person.";

export default function MultiStepModal({ onClose }: MultiStepModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedOption, setSelectedOption] = useState<"optionA" | "optionB" | "">("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageURL, setImageURL] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { currentUser } = useAuthStore();
  const [requestId, setRequestId] = useState("");
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);
  const {
    avatars: avatarLimit,
    avatarsUsed,
    aiCloning: aiCloningLimit,
    aiCloningUsed,
    loading: limitsLoading
  } = usePlanLimits();

  useEffect(() => {
    fetchWebhookUrl();
  }, []);

  const fetchWebhookUrl = async () => {
    try {
      const { data, error } = await supabase
        .from('webhook_influencer')
        .select('url')
        .single();

      if (error) throw error;
      if (data) {
        setWebhookUrl(data.url);
      }
    } catch (err) {
      console.error('Error fetching webhook URL:', err);
    }
  };
  const canCreateAvatar = !limitsLoading && (avatarLimit === -1 || avatarsUsed < avatarLimit);
  const canScheduleCall = !limitsLoading && (aiCloningLimit === -1 || aiCloningUsed < aiCloningLimit);

  const generatePrompt = (data: AvatarFormData) => {
    return `${data.gender}, ${data.age} years old, ${data.description}${data.background ? `, ${data.background}` : ''
      }, ${data.viewType.toLowerCase()} view`;
  };

  const [formData, setFormData] = useState<AvatarFormData>({
    age: AGE_OPTIONS[0],
    gender: "Male",
    description: "",
    background: "",
    viewType: "Full Body",
    viewFormat: "9:16",
    voiceDescription: ""
  });

  const [callFormData, setCallFormData] = useState<CallFormData>({
    title: "",
    description: ""
  });

  const handleGoBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setSelectedOption("");
    }
  };

  const handleOptionSelect = (option: "optionA" | "optionB") => {
    setSelectedOption(option);
    setStep(2);
  };

  useEffect(() => {
    if (!requestId) return;

    let isPolling = true;
    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `https://api.bfl.ml/v1/get_result?id=${requestId}`,
          {
            headers: {
              "X-Key": import.meta.env.VITE_FLEX!,
            },
          }
        );
        const data = await response.json();
        console.log("Image Data", data)

        if (!isPolling) return;

        if (data.status === "Content Moderated") {
          clearInterval(interval);
          setError("Your prompt contains inappropriate content. Please try again with different parameters.");
          setIsSubmitting(false);
        } else if (data.status === "Ready") {
          clearInterval(interval);
          setImageURL(data.result.sample);
          setIsSubmitting(false);
        } else if (data.status === "Failed") {
          clearInterval(interval);
          setError("Failed to generate image. Please try again.");
          setIsSubmitting(false);
        }
      } catch (err) {
        console.error(err);
        setError("An error occurred while checking image status. Please try again.");
        setIsSubmitting(false);
        clearInterval(interval);
      }
    }, 5000);

    return () => {
      isPolling = false;
      clearInterval(interval);
    };
  }, [requestId]);

  const handleSubmitOptionA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      setIsSubmitting(true);
      const response = await fetch("https://api.bfl.ml/v1/flux-pro-1.1-ultra", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Key": import.meta.env.VITE_FLEX!,
        },
        body: JSON.stringify({
          prompt: generatePrompt(formData),
          seed: 42,
          aspect_ratio: formData.viewFormat,
          safety_tolerance: 2,
          output_format: "jpeg",
          raw: false,
          image_prompt_strength: 0.1,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setRequestId(data.id);
      } else {
        setIsSubmitting(false);
        setError(data.message || "Failed to generate avatar.");
      }
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      setError("An error occurred while generating the avatar.");
    }
  };


  const handleSubmitRequest = async () => {
    if (!currentUser || !imageURL) return;

    setIsSubmitting(true);

    try {
      const { data: userData, error: userError } = await supabase
      .from("users")
      .select("current_plan, subscription_id").eq("email", currentUser.email)
      .single();

      if (userError || !userData) {
        console.error("Error fetching user data:", userError);
        setError("Failed to fetch user data. Please try again.");
        return;
      }

      // Fetch user_usage and plan data
      const { data: userUsage, error: userUsageError } = await supabase
        .from("user_usage")
        .select("*")
        .eq("user_id", currentUser.id)
        .single();

      if (userUsageError) {
        console.error("Error fetching user_usage:", userUsageError);
        throw new Error("Failed to fetch user usage data.");
      }

      const { data: plan, error: planError } = await supabase
        .from("plans")
        .select("*")
        .eq("id", userData.current_plan)
        .single();

      if (planError) {
        console.error("Error fetching plan:", planError);
        throw new Error("Failed to fetch plan data.");
      }

      // Check if avatars_created is already at or exceeds the plan limit
      if (userUsage.avatars_created >= plan.avatars) {
        setError("Avatar creation limit reached for your current plan.");
        throw new Error("Avatar creation limit reached.");
      }

      // Check for exact match before incrementing
      if (userUsage.avatars_created === plan.avatars) {
        setError("You have reached the exact limit for avatars creation.");
        throw new Error("Cannot increment avatars_created: limit reached.");
      }

      // Update user_usage.avatars_created
      const { error: updateUsageError } = await supabase
        .from("user_usage")
        .update({ avatars_created: userUsage.avatars_created + 1 })
        .eq("user_id", currentUser.id);

      if (updateUsageError) {
        console.error("Error updating user_usage:", updateUsageError);
        throw new Error("Failed to update user usage.");
      }

      if (webhookUrl) {
        try {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              photo_url: imageURL,
              voice_description: formData.voiceDescription
            })
          });
        } catch (webhookError) {
          console.error('Failed to send webhook:', webhookError);
          // Continue with saving to database even if webhook fails
        }
      }

      const { error } = await supabase
        .from('influencer_requests')
        .insert([{
          user_id: currentUser.id,
          age: formData.age,
          gender: formData.gender,
          description: formData.description,
          background: formData.background,
          view_type: formData.viewType,
          view_format: formData.viewFormat,
          voice_description: formData.voiceDescription || '',
          generated_image_url: imageURL,
          status: 'completed'
        }]);

      if (error) throw error;
      onClose();
    } catch (err) {
      console.error('Error saving request:', err);
      setError('Failed to save request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callFormData.title || !callFormData.description) {
      setError("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      // Open Calendly with the form data
      const calendlyBaseUrl = "https://calendly.com/bazilsb7";
      const encodedTitle = encodeURIComponent(callFormData.title);
      const encodedDescription = encodeURIComponent(callFormData.description);
      const calendlyUrl = `${calendlyBaseUrl}?customTitle=${encodedTitle}&customDescription=${encodedDescription}`;
      window.open(calendlyUrl, "_blank");
      onClose();
    } catch (err) {
      setError("Failed to schedule call");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className={`bg-white rounded-lg ${step === 2 && selectedOption === "optionA" ? "max-w-5xl" : "max-w-md"} w-full p-6 relative max-h-[90vh] flex flex-col`}>
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {step === 1 ? "Choose Option" : (selectedOption === "optionA" ? "Create Your AI Avatar" : "Schedule a Call to create your AI Clone")}
            {step === 1 && !limitsLoading && avatarLimit !== -1 && (
              <div className="ml-2 text-sm font-normal text-gray-500">
                <div>Avatars: {avatarsUsed}/{avatarLimit === -1 ? '∞' : avatarLimit}</div>
                <div>AI Cloning: {aiCloningUsed}/{aiCloningLimit === -1 ? '∞' : aiCloningLimit}</div>
              </div>
            )}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === 1 && (
          <div className="grid grid-cols-2 gap-4">
             <button
              onClick={() => navigate('/create-ai-avatar')}
              className="aspect-square flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
            >
              <Plus className="h-8 w-8 mb-2 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">Create AI Avatar</span>
              <span className="text-xs text-gray-500 mt-1">Generate custom AI avatar</span>
            </button>
            {/* <button
              onClick={() => canCreateAvatar && handleOptionSelect("optionA")}
              className={`aspect-square flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors relative ${canCreateAvatar ? 'border-gray-300 hover:border-gray-400 cursor-pointer' : 'border-gray-200 opacity-50 cursor-not-allowed'
                }`}
            >
              <Smartphone className="h-8 w-8 mb-2 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">Create Custom Avatar</span>
              <span className="text-xs text-gray-500 mt-1">
                {canCreateAvatar
                  ? "Design your own AI avatar"
                  : avatarLimit === -1
                    ? "Loading..."
                    : "Avatar limit reached"}
              </span>
            </button> */}
            <button
              onClick={() => canScheduleCall && handleOptionSelect("optionB")}
              className={`aspect-square flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors relative ${canScheduleCall ? 'border-gray-300 hover:border-gray-400 cursor-pointer' : 'border-gray-200 opacity-50 cursor-not-allowed'
                }`}
            >
              <User className="h-8 w-8 mb-2 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">Book A Cloning Consultation</span>
              <span className="text-xs text-gray-500 mt-1">
                {canScheduleCall
                  ? "Talk to our team"
                  : aiCloningLimit === -1
                    ? "Loading..."
                    : "AI Cloning limit reached"}
              </span>
            </button>
          </div>
        )}

        {step === 2 && selectedOption === "optionA" && (
          <div className="flex gap-8 flex-1 overflow-hidden">
            <div className="flex-1 min-w-[320px] flex flex-col">
              {error && <p className="text-red-500 mb-4">{error}</p>}
              <form onSubmit={handleSubmitOptionA} className="flex flex-col h-full">
                <div className="flex-1 space-y-4 overflow-y-auto pr-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Age Range</label>
                    <select
                      value={formData.age}
                      onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      {AGE_OPTIONS.map((age) => (
                        <option key={age} value={age}>{age}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as "Male" | "Female" }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      rows={3}
                      placeholder="Describe the avatar's appearance..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Background</label>
                    <textarea
                      value={formData.background}
                      onChange={(e) => setFormData(prev => ({ ...prev, background: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      rows={2}
                      placeholder="Describe the background setting..."
                    />
                  </div>

                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex items-center text-gray-600 hover:text-gray-900"
                    >
                      <ChevronDown
                        className={`h-5 w-5 transform transition-transform ${showAdvanced ? 'rotate-180' : ''
                          }`}
                      />
                      <span className="ml-2">Advanced Settings</span>
                    </button>

                    {showAdvanced && (
                      <div className="mt-4 space-y-4">
                        <div>
                          <label htmlFor="voiceDescription" className="block text-sm font-medium text-gray-700">
                            Voice Description
                            <span className="text-gray-400 text-xs ml-2">(Optional)</span>
                          </label>
                          <div className="mt-1 space-y-2">
                            <textarea
                              id="voiceDescription"
                              value={formData.voiceDescription}
                              onChange={(e) => setFormData(prev => ({ ...prev, voiceDescription: e.target.value }))}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-[80px] resize-none"
                              placeholder={SAMPLE_VOICE_DESCRIPTION}
                            />
                            <p className="text-xs text-gray-500">
                              Example: {SAMPLE_VOICE_DESCRIPTION}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">View Type</label>
                    <select
                      value={formData.viewType}
                      onChange={(e) => setFormData(prev => ({ ...prev, viewType: e.target.value as typeof VIEW_TYPES[number] }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      {VIEW_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">View Format</label>
                    <select
                      value={formData.viewFormat}
                      onChange={(e) => setFormData(prev => ({ ...prev, viewFormat: e.target.value as "9:16" | "16:9" }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="9:16">Portrait (9:16)</option>
                      <option value="16:9">Landscape (16:9)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t mt-auto">
                  <button
                    type="button"
                    onClick={handleGoBack}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    {imageURL ? (
                      <div className="flex gap-2">
                        <button
                          onClick={handleSubmitOptionA}
                          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "Generating..." : "Regenerate"}
                        </button>
                        <button
                          type="button"
                          onClick={handleSubmitRequest}
                          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "Submitting..." : "Submit Request"}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleSubmitOptionA}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Generating..." : "Generate Avatar"}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>

            <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg overflow-auto">
              {isSubmitting ? (
                <div className="flex flex-col items-center">
                  <div className="flex flex-col items-center justify-center p-8 text-center" style={{ zIndex: 10 }}>
                    <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
                    <p className="text-lg font-medium text-gray-700 mb-2">Generating Avatar</p>
                    <p className="text-sm text-gray-500">This may take a few moments...</p>
                  </div>
                </div>
              ) : imageURL ? (
                <img
                  src={imageURL} alt="Generated Avatar" className="w-full h-full object-contain rounded-lg" />
              ) : error ? (
                <div className="flex flex-col items-center justify-center p-8 text-center" style={{ zIndex: 10 }}>
                  <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                  <p className="text-lg font-medium text-red-700 mb-2">Generation Failed</p>
                  <p className="text-sm text-red-500 max-w-md">{error}</p>
                </div>
              ) : (
                <div className="text-center">
                  <Smartphone className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">Generated image will appear here</p>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 2 && selectedOption === "optionB" && (
          <div>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <form onSubmit={handleSubmitCall} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={callFormData.title}
                  onChange={(e) => setCallFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Brief title for the call"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={callFormData.description}
                  onChange={(e) => setCallFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  rows={4}
                  placeholder="Describe what you'd like to discuss..."
                  required
                />
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={handleGoBack}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Back
                </button>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Scheduling..." : "Schedule Call"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}