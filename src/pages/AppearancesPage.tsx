import React,{useState} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Users, Loader2, Wand2 } from 'lucide-react';
import { useInfluencerStore } from '../store/influencerStore';
import { InfluencerCard } from '../components/InfluencerCard';
import AddLookModal from '../components/AddLookModal';
import { useAuthStore } from '../store/authStore';

export default function AppearancesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isAddingMotion, setIsAddingMotion] = useState(false);
  const [motionSuccess, setMotionSuccess] = useState(false);
  const { currentUser } = useAuthStore();
  const { influencers, fetchInfluencers } = useInfluencerStore();
  const [showAddLookModal, setShowAddLookModal] = React.useState(false);
  const influencer = influencers.find((inf) => inf.id === id);
  const relatedInfluencers = influencers.filter(inf =>
    inf.id !== id && inf.look_id === influencer?.id
  );

  const handleAddMotion = async () => {
    if (!influencer || !currentUser?.heygenApiKey) return;
    
    setIsAddingMotion(true);
    try {
      // First get the group_id
      const response = await fetch(
        `https://api.heygen.com/v2/photo_avatar/${influencer.templateId}`,
        {
          headers: {
            accept: "application/json",
            "x-api-key": currentUser.heygenApiKey,
          },
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Failed to fetch group ID');
      
      const groupId = data.data.group_id;
      
      // Add motion using group_id
      const motionResponse = await fetch(
        "https://api.heygen.com/v2/photo_avatar/add_motion",
        {
          method: "POST",
          headers: {
            accept: "application/json",
            "content-type": "application/json",
            "x-api-key": currentUser.heygenApiKey,
          },
          body: JSON.stringify({ id: groupId }),
        }
      );

      if (!motionResponse.ok) {
        const errorData = await motionResponse.json();
        throw new Error(errorData.error?.message || 'Failed to add motion');
      }

      setMotionSuccess(true);
      setTimeout(() => setMotionSuccess(false), 5000);
    } catch (error) {
      console.error('Error adding motion:', error);
      alert('Failed to add motion. Please try again.');
    } finally {
      setIsAddingMotion(false);
    }
  };
  const handleCreateLook = async (prompt: string) => {
    // TODO: Implement look creation logic
    console.log('Creating look with prompt:', prompt);
  };

  if (!influencer) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="p-6">
      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </button>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#c9fffc]">
          {influencer.name}'s Appearances
        </h1>
        <button
          onClick={handleAddMotion}
          disabled={isAddingMotion}
          className="flex items-center gap-2 px-4 py-2 bg-[#c9fffc] text-black rounded-lg hover:bg-[#a0fcf9] disabled:opacity-50 transition-colors"
        >
          {isAddingMotion ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Adding Motion...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />
              Add Motion
            </>
          )}
        </button>
      </div>

      {motionSuccess && (
        <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg">
          Motion will be applied in a few minutes
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <button
          onClick={() => setShowAddLookModal(true)}
          className="bg-[#1a1a1a] rounded-xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 border-dashed border-gray-700 hover:border-[#c9fffc] group"
        >
          <div className="p-4">
            <div className="aspect-square rounded-xl border-2 border-gray-700 group-hover:border-[#c9fffc] transition-colors flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <Plus size={40} className="text-gray-400 group-hover:text-[#c9fffc] transition-colors" />
                <span className="text-gray-400 group-hover:text-[#c9fffc] transition-colors font-medium">
                  Add New Look
                </span>
              </div>
            </div>
          </div>
        </button>
        <div className="col-span-1">
          <InfluencerCard
            influencer={influencer}
            onEdit={() => {}}
            isLookPage
          />
        </div>
        
        {relatedInfluencers.length > 0 && (
          <div className="col-span-full mt-8">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-[#c9fffc]" />
              <h2 className="text-lg font-semibold text-[#c9fffc]">
                Influencers Using This Look
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedInfluencers.map((relatedInfluencer) => (
                <InfluencerCard
                  key={relatedInfluencer.id}
                  influencer={relatedInfluencer}
                  onEdit={() => {}}
                  isLookPage
                />
              ))}
            </div>
          </div>
        )}
      </div>
      
      {showAddLookModal && (
        <AddLookModal
          onClose={() => setShowAddLookModal(false)}
          onSubmit={handleCreateLook}
          influencer={influencer}
        />
      )}
    </div>
  );
}