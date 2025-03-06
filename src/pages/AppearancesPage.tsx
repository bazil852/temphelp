import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Users } from 'lucide-react';
import { useInfluencerStore } from '../store/influencerStore';
import { InfluencerCard } from '../components/InfluencerCard';
import AddLookModal from '../components/AddLookModal';

export default function AppearancesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { influencers, fetchInfluencers } = useInfluencerStore();
  const [showAddLookModal, setShowAddLookModal] = React.useState(false);
  const influencer = influencers.find((inf) => inf.id === id);
  const relatedInfluencers = influencers.filter(inf =>
    inf.id !== id && inf.look_id === influencer?.id
  );

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
      </div>

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