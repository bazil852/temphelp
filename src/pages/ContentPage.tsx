import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useContentStore } from "../store/contentStore";
import { useInfluencerStore } from "../store/influencerStore";
import { usePlanLimits } from '../hooks/usePlanLimits';
import { supabase } from "../lib/supabase";
import { 
  Plus, 
  Loader2, 
  AlertCircle, 
  Video, 
  ArrowLeft, 
  Upload, 
  Webhook, 
  Trash2,
  Download,
  Subtitles
} from "lucide-react";
import CreateVideoModal from "../components/CreateVideoModal";
import BulkCreateModal from "../components/BulkCreateModal";
import WebhookModal from "../components/WebhookModal";
import VideoCard from "../components/VideoCard";

interface ContentPageProps {
  isClone?: boolean;
}

export default function ContentPage({ isClone = false }: ContentPageProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showBulkCreate, setShowBulkCreate] = useState(false);
  const [showWebhooks, setShowWebhooks] = useState(false);
  const { videoMinutes, videoMinutesUsed, loading: limitsLoading } = usePlanLimits();
  const [selectedContents, setSelectedContents] = useState<string[]>([]);
  const { influencers, fetchInfluencers } = useInfluencerStore();
  const { contents, fetchContents, refreshContents, deleteContents } =
    useContentStore();
  const [clone, setClone] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const entityType = isClone ? 'clone' : 'influencer';
  
  useEffect(() => {
    if (isClone) {
      // Fetch clone data
      const fetchClone = async () => {
        const { data, error } = await supabase
          .from('clones')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Error fetching clone:', error);
          navigate('/dashboard');
          return;
        }

        setClone(data);
        setIsLoading(false);
      };

      fetchClone();
      return; // Don't proceed with the rest of the effect for clones
    }
  }, [id, isClone, navigate]);

  useEffect(() => {
    // For regular influencers, fetch influencers first
    if (!isClone) {
      fetchInfluencers().then(() => {
        setIsLoading(false);
      }).catch((error) => {
        console.error('Error fetching influencers:', error);
        setIsLoading(false);
      });
    }
  }, [isClone, fetchInfluencers]);
  
  const entity = entityType === 'clone' ? clone : influencers.find((inf) => inf.id === id);
  const canCreateVideo = !limitsLoading && (videoMinutes === -1 || videoMinutesUsed < videoMinutes);
  const minutesRemaining = videoMinutes === -1 ? '∞' : videoMinutes - videoMinutesUsed;
  const minutesUsageDisplay = videoMinutes === -1
    ? `${videoMinutesUsed} minutes used (Unlimited)`
    : `${videoMinutesUsed}/${videoMinutes} minutes used`;

  useEffect(() => {
    // For clones, wait until clone data is loaded
    if (isClone && !clone) {
      return;
    }
    
    // For regular influencers, check entity immediately
    if (!isClone && !entity) {
      return;
    }

    console.log(`Fetching contents for ${entityType}:`, id);
    fetchContents(id!)
      .then(() => console.log("Fetched contents successfully"))
      .catch((error) => console.error("Error fetching contents:", error));

    const interval = setInterval(() => {
      refreshContents(id!)
        .then(() => console.log("Refreshed contents successfully"))
        .catch((error) => console.error("Error refreshing contents:", error));
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [id, isClone, entity, clone, entityType, navigate, fetchContents, refreshContents]);

  const handleDeleteSelected = async () => {
    if (selectedContents.length === 0) return;
    try {
      await deleteContents(id!, selectedContents);
      setSelectedContents([]);
    } catch (error) {
      console.error("Failed to delete contents:", error);
    }
  };

  const toggleSelectAll = () => {
    const currentContents = contents[id!] || [];
    if (selectedContents.length === currentContents.length) {
      setSelectedContents([]);
    } else {
      setSelectedContents(currentContents.map((content) => content.id));
    }
  };

  const handleAddCaption = async (videoUrl: string) => {
    console.log(videoUrl)
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/add-caption`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoUrl }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to send video URL');
      }
  
      const data = await response.json();
      console.log('Caption Added:', data);
    } catch (error) {
      console.error('Error adding caption:', error);
    }
  };  

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#c9fffc]" />
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </button>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-200 mb-2">Influencer Not Found</h2>
          <p className="text-gray-400 mb-4">The influencer you're looking for doesn't exist or has been deleted.</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2 bg-[#c9fffc] text-black rounded-lg hover:bg-[#a0fcf9] transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentContents = contents[id!] || [];
  const videosInQueue = currentContents.filter(
    (c) => c.status === "generating"
  ).length;

  return (
    <div className="p-6">
      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </button>
      
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-[#c9fffc]">
          {entity?.name}'s Content
        </h1>
      </div>
      
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-gray-800 text-white px-4 py-2 rounded-lg">
          {minutesUsageDisplay}
        </div>
        <button
          onClick={() => setShowWebhooks(true)}
          className="flex items-center justify-center bg-[#c9fffc] text-black p-2 rounded-lg hover:bg-[#a0fcf9] transition-colors"
          title="Automations"
        >
          <Webhook size={20} />
        </button>
        <button
          onClick={toggleSelectAll}
          className="flex items-center justify-center bg-[#c9fffc] text-black p-2 rounded-lg hover:bg-[#a0fcf9] transition-colors"
          title="Select All"
        >
          <input
            type="checkbox"
            checked={selectedContents.length === currentContents.length}
            onChange={toggleSelectAll}
            className="h-4 w-4"
          />
        </button>
        <button
          onClick={handleDeleteSelected}
          disabled={selectedContents.length === 0}
          className="flex items-center justify-center bg-[#c9fffc] text-black p-2 rounded-lg hover:bg-[#a0fcf9] transition-colors disabled:opacity-50"
          title="Delete Selected"
        >
          <Trash2 size={20} />
        </button>
        <button
          onClick={() => setShowBulkCreate(true)}
          disabled={!canCreateVideo}
          className={`flex items-center justify-center bg-[#c9fffc] text-black p-2 rounded-lg hover:bg-[#a0fcf9] transition-colors ${!canCreateVideo ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Bulk Create"
        >
          <Upload size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {canCreateVideo && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-white rounded-lg shadow-lg overflow-hidden relative group border-2 border-dashed border-gray-700 hover:border-[#c9fffc]"
          >
            <div className="flex flex-col items-center justify-center h-full p-8 gap-4">
              <Plus size={40} className="text-gray-400 group-hover:text-[#c9fffc] transition-colors" />
              <span className="text-gray-400 group-hover:text-[#c9fffc] transition-colors font-medium">
                Create New Video
              </span>
            </div>
          </button>
        )}
        {!canCreateVideo && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden p-6 border-2 border-red-500/20">
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <div className="text-red-500/60 font-medium">
                Video Minutes Limit Reached
              </div>
              <div className="text-sm text-gray-500">
                {videoMinutesUsed}/{videoMinutes} minutes used.
                Please upgrade your plan to create more videos.
              </div>
            </div>
          </div>
        )}
        {currentContents.map((content) => (
          <VideoCard
            key={content.id}
            content={content}
            isSelected={selectedContents.includes(content.id)}
            onSelect={(id) => {
              if (selectedContents.includes(id)) {
                setSelectedContents(selectedContents.filter((contentId) => contentId !== id));
              } else {
                setSelectedContents([...selectedContents, id]);
              }
            }}
            onAddCaption={handleAddCaption}
          />
        ))}
      </div>

      {showCreateForm && (
        <CreateVideoModal
          influencerId={entity.id}
          templateId={entityType === 'clone' ? entity.clone_id : entity.templateId}
          influencer={entity}
          onClose={() => setShowCreateForm(false)}
          isClone={isClone}
        />
      )}

      {showBulkCreate && (
        <BulkCreateModal
          influencerId={entity.id}
          templateId={entityType === 'clone' ? entity.template_id : entity.templateId}
          onClose={() => setShowBulkCreate(false)}
        />
      )}

      {showWebhooks && (
        <WebhookModal
          influencerId={id}
          onClose={() => setShowWebhooks(false)}
        />
      )}
    </div>
  );
}