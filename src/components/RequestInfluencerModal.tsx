import React, { useState } from "react";
import { X } from "lucide-react";

interface RequestInfluencerModalProps {
  onClose: () => void;
}

export default function RequestInfluencerModal({
  onClose,
}: RequestInfluencerModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const calendlyBaseUrl = "https://calendly.com/bazilsb7"; // Replace with your Calendly link
      const encodedTitle = encodeURIComponent(title);
      const encodedDescription = encodeURIComponent(description);
      const calendlyUrl = `${calendlyBaseUrl}?customTitle=${encodedTitle}&customDescription=${encodedDescription}`;

      // Open Calendly link in a new tab
      window.open(calendlyUrl, "_blank");
      onClose();
    } catch (err) {
      console.error("Error saving influencer:", err);
      setError("Failed to save influencer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Request new Influencer
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Description
              </label>
            </div>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                         focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              rows={4}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "Scheduling..." : "Schedule Call"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
