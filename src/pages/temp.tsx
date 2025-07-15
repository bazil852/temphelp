import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Headset } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { InfluencerCard } from '../components/InfluencerCard';
import CreateInfluencerModal from '../components/CreateInfluencerModal';
import { useInfluencerStore } from '../store/influencerStore';
import { Influencer } from '../types';
import RequestInfluencerModal from '../components/RequestInfluencerModal';
import MultiStepModal from '../components/MultiStepModal';
import { usePlanLimits } from '../hooks/usePlanLimits';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';


function DashboardPage() {
  const navigate = useNavigate();
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false); // NEW state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInfluencer, setEditingInfluencer] = useState<Influencer | null>(null);
  const { influencers, fetchInfluencers } = useInfluencerStore();
  const { currentUser } = useAuthStore();
  const [planDetails, setPlanDetails] = useState<any>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const { 
    avatars: avatarLimit, 
    avatarsUsed, 
    aiCloning: aiCloningLimit,
    aiCloningUsed,
    videoMinutes: videoMinutesLimit,
    videoMinutesUsed,
    automationsEnabled,
    loading: limitsLoading 
  } = usePlanLimits();

  useEffect(() => {
    fetchInfluencers().catch(console.error);
    fetchPlanDetails();
  }, [fetchInfluencers]);

  const fetchPlanDetails = async () => {
    if (!currentUser?.email) return;
    
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('current_plan, subscription_end')
        .eq('email', currentUser.email)
        .single();

      if (userData?.current_plan) {
        const { data: planData } = await supabase
          .from('plans')
          .select('*')
          .eq('id', userData.current_plan)
          .single();

        setPlanDetails(planData);
        setSubscriptionEnd(userData.subscription_end);
      }
    } catch (error) {
      console.error('Error fetching plan details:', error);
    }
  };
  const canCreateAvatar = !limitsLoading && (avatarLimit === -1 || avatarsUsed < avatarLimit);

  const handleEditInfluencer = (influencer: Influencer) => {
    setEditingInfluencer(influencer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingInfluencer(null);
  };

  const handleOpenRequestModal = () => {
    setIsRequestModalOpen(true);
  };

  const handleCloseRequestModal = () => {
    setIsRequestModalOpen(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Usage Stats */}
      <div className="mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Plan Status Card */}
          <div className="lg:col-span-4 bg-gray-800 rounded-lg p-6 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-200">Account Status</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Current Plan:</span>
                <span className="px-3 py-1 bg-[#c9fffc] text-black rounded-full text-sm font-medium">
                  {planDetails?.plan_name || 'Loading...'}
                </span>
              </div>
            </div>
            {subscriptionEnd && (
              <p className="text-sm text-gray-400">
                Subscription ends: {new Date(subscriptionEnd).toLocaleDateString()}
              </p>
            )}
          </div>
            </div>
          {/* Usage Metrics */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h3 className="text-gray-400 text-sm mb-2">Influencers</h3>
            <div className="flex justify-between items-baseline mb-4">
              <span className="text-2xl font-bold text-gray-200">{avatarsUsed}</span>
              <span className="text-gray-400">/ {avatarLimit === -1 ? '∞' : avatarLimit}</span>
            </div>
            <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-[#c9fffc] transition-all duration-500"
                style={{ 
                  width: `${avatarLimit === -1 ? 100 : Math.min((avatarsUsed / avatarLimit) * 100, 100)}%`,
                  opacity: avatarLimit === -1 ? 0.5 : 1
                }}
              />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h3 className="text-gray-400 text-sm mb-2">AI Cloning</h3>
            <div className="flex justify-between items-baseline mb-4">
              <span className="text-2xl font-bold text-gray-200">{aiCloningUsed}</span>
              <span className="text-gray-400">/ {aiCloningLimit === -1 ? '∞' : aiCloningLimit}</span>
            </div>
            <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-[#c9fffc] transition-all duration-500"
                style={{ 
                  width: `${aiCloningLimit === -1 ? 100 : Math.min((aiCloningUsed / aiCloningLimit) * 100, 100)}%`,
                  opacity: aiCloningLimit === -1 ? 0.5 : 1
                }}
              />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h3 className="text-gray-400 text-sm mb-2">Video Minutes</h3>
            <div className="flex justify-between items-baseline mb-4">
              <span className="text-2xl font-bold text-gray-200">{videoMinutesUsed}</span>
              <span className="text-gray-400">/ {videoMinutesLimit === -1 ? '∞' : videoMinutesLimit}</span>
            </div>
            <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-[#c9fffc] transition-all duration-500"
                style={{ 
                  width: `${videoMinutesLimit === -1 ? 100 : Math.min((videoMinutesUsed / videoMinutesLimit) * 100, 100)}%`,
                  opacity: videoMinutesLimit === -1 ? 0.5 : 1
                }}
              />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h3 className="text-gray-400 text-sm mb-2">Automations</h3>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-200">
                {automationsEnabled ? 'Enabled' : 'Disabled'}
              </span>
              <div className={`w-4 h-4 rounded-full ${automationsEnabled ? 'bg-[#c9fffc]' : 'bg-gray-600'}`} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Influencers</h1>
        <div className="flex gap-2">
          {canCreateAvatar ? (
            <>
              <button
                onClick={handleOpenRequestModal}
                data-tour="headset"
                className="flex items-center justify-center bg-[#c9fffc] text-black p-2 rounded-lg hover:bg-[#a0fcf9] transition-colors"
                title="Schedule Call"
              >
                <Headset size={20} />
              </button>
              <button
                onClick={() => navigate('/content-planner')}
                data-tour="calendar"
                className="flex items-center justify-center bg-[#c9fffc] text-black p-2 rounded-lg hover:bg-[#a0fcf9] transition-colors"
                title="Content Planner"
              >
                <Calendar size={20} />
              </button>
              <button
                data-tour="create-influencer"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center justify-center bg-[#c9fffc] text-black p-2 rounded-lg hover:bg-[#a0fcf9] transition-colors"
                title="Create Influencer"
              >
                <Plus size={20} />
              </button>
            </>
          ) : (
            <div className="text-sm text-gray-500">
              Influencer limit reached ({avatarsUsed}/{avatarLimit}). Please upgrade your plan to create more influencers.
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {influencers.map((influencer) => (
          <InfluencerCard
            key={influencer.id}
            influencer={influencer}
            onEdit={handleEditInfluencer}
          />
        ))}
      </div>

      {isModalOpen && (
        <CreateInfluencerModal
          influencer={editingInfluencer}
          onClose={handleCloseModal}
        />
      )}
      {isRequestModalOpen && (
        <MultiStepModal onClose={handleCloseRequestModal}/>
        // <RequestInfluencerModal onClose={handleCloseRequestModal} />
      )}
    </div>
  );
}

export default DashboardPage;