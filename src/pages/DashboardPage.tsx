import React, { useState, useEffect } from 'react';
import { Plus, Table2, Headset, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { InfluencerCard } from '../components/InfluencerCard';
import { CloneCard } from '../components/CloneCard';
import CreateInfluencerModal from '../components/CreateInfluencerModal';
import { useInfluencerStore } from '../store/influencerStore';
import { Influencer } from '../types';
import RequestInfluencerModal from '../components/RequestInfluencerModal';
import SafariHomeScreenPopup from '../components/SafariHomeScreenPopup';
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
  const [activeTab, setActiveTab] = useState<'available' | 'pending'>('available');
  const [filteredInfluencers, setFilteredInfluencers] = useState<{
    pending: Influencer[];
    available: Influencer[];
    clones: Array<any>;
  }>({ pending: [], available: [], clones: [] });
  
  const statusSteps = [
    { key: 'pending', label: 'Processing' },
    { key: 'pending-motion', label: 'Motion Processing' },
    { key: 'motion-training', label: 'Training' },
    { key: 'completed', label: 'Completed' }
  ];

  const getStatusIndex = (status: string | undefined) => {
    return statusSteps.findIndex(step => step.key === status);
  };
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

  useEffect(() => {
    // Filter influencers
    const pending = influencers.filter(inf => ['pending', 'motion-training', 'pending-motion'].includes(inf.status) && !inf.look_id);
    const available = influencers.filter(inf => 
      (!inf.status || inf.status == 'completed' ) && !inf.look_id
    );

    // Fetch clones
    const fetchClones = async () => {
      try {
        if (!currentUser?.id) return;
    
        const { data: clones } = await supabase
          .from('clones')
          .select('*')
          .eq('user_id', currentUser.id) // 🔥 FILTER BY USER ID
          .not('clone_id', 'is', null)
          .order('created_at', { ascending: false });
    
        setFilteredInfluencers({ pending, available, clones: clones || [] });
      } catch (error) {
        console.error('Error fetching clones:', error);
      }
    };
    

    fetchClones();
  }, [influencers]);

  const fetchPlanDetails = async () => {
    if (!currentUser?.email) return;
    
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('current_plan')
        .eq('email', currentUser.email)
        .single();

      if (userData?.current_plan) {
        const { data: planData } = await supabase
          .from('plans')
          .select('*')
          .eq('id', userData.current_plan)
          .single();

        setPlanDetails(planData);
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
      <div className="space-y-8">
        {/* Usage Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Usage Metrics */}
          <div className={`bg-[#1a1a1a] rounded-lg p-6 shadow-lg border border-gray-800 ${limitsLoading ? 'animate-pulse' : ''}`}>
            <h3 className="text-gray-400 text-sm mb-2">Influencers</h3>
            <div className="flex justify-between items-baseline mb-4">
              {limitsLoading ? (
                <div className="h-8 w-24 bg-gray-700 rounded animate-pulse"></div>
              ) : (
                <>
                  <span className="text-2xl font-bold text-gray-200">{avatarsUsed}</span>
                  <span className="text-gray-400">/ {avatarLimit === -1 ? '∞' : avatarLimit}</span>
                </>
              )}
            </div>
            <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-[#c9fffc] transition-all duration-500"
                style={{ 
                  width: limitsLoading ? '0%' : `${avatarLimit === -1 ? 100 : Math.min((avatarsUsed / avatarLimit) * 100, 100)}%`,
                  opacity: avatarLimit === -1 ? 0.5 : 1
                }}
              />
            </div>
          </div>

          <div className={`bg-[#1a1a1a] rounded-lg p-6 shadow-lg border border-gray-800 ${limitsLoading ? 'animate-pulse' : ''}`}>
            <h3 className="text-gray-400 text-sm mb-2">AI Cloning</h3>
            <div className="flex justify-between items-baseline mb-4">
              {limitsLoading ? (
                <div className="h-8 w-24 bg-gray-700 rounded animate-pulse"></div>
              ) : (
                <>
                  <span className="text-2xl font-bold text-gray-200">{aiCloningUsed}</span>
                  <span className="text-gray-400">/ {aiCloningLimit === -1 ? '∞' : aiCloningLimit}</span>
                </>
              )}
            </div>
            <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-[#c9fffc] transition-all duration-500"
                style={{ 
                  width: limitsLoading ? '0%' : `${aiCloningLimit === -1 ? 100 : Math.min((aiCloningUsed / aiCloningLimit) * 100, 100)}%`,
                  opacity: aiCloningLimit === -1 ? 0.5 : 1
                }}
              />
            </div>
          </div>

          <div className={`bg-[#1a1a1a] rounded-lg p-6 shadow-lg border border-gray-800 ${limitsLoading ? 'animate-pulse' : ''}`}>
            <h3 className="text-gray-400 text-sm mb-2">Video Minutes</h3>
            <div className="flex justify-between items-baseline mb-4">
              {limitsLoading ? (
                <div className="h-8 w-24 bg-gray-700 rounded animate-pulse"></div>
              ) : (
                <>
                  <span className="text-2xl font-bold text-gray-200">{videoMinutesUsed || 0}</span>
                  <span className="text-gray-400">/ {videoMinutesLimit === -1 ? '∞' : videoMinutesLimit}</span>
                </>
              )}
            </div>
            <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden" style={{ zIndex: 1 }}>
              <div 
                className="absolute top-0 left-0 h-full bg-[#c9fffc] transition-all duration-500"
                style={{ 
                  width: limitsLoading ? '0%' : `${videoMinutesLimit === -1 ? 100 : Math.min((videoMinutesUsed / videoMinutesLimit) * 100, 100)}%`,
                  opacity: videoMinutesLimit === -1 ? 0.5 : 1,
                  zIndex: 2
                }}
              />
            </div>
          </div>

          <div className={`bg-[#1a1a1a] rounded-lg p-6 shadow-lg border border-gray-800 ${limitsLoading ? 'animate-pulse' : ''}`}>
            <h3 className="text-gray-400 text-sm mb-2">Automations</h3>
            <div className="flex items-center justify-between">
              {limitsLoading ? (
                <div className="h-8 w-24 bg-gray-700 rounded animate-pulse"></div>
              ) : (
                <>
                  <span className="text-2xl font-bold text-gray-200">
                    {automationsEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <div className={`w-4 h-4 rounded-full ${automationsEnabled ? 'bg-[#c9fffc]' : 'bg-gray-600'}`} />
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Header and Actions */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Influencers</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('available')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'available'
                    ? 'bg-[#c9fffc] text-black'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Available ({filteredInfluencers.available.length})
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'pending'
                    ? 'bg-[#c9fffc] text-black'
                    : 'text-gray-400 hover:text-gray-300'
                } ${filteredInfluencers.pending.length > 0 ? 'animate-pulse' : ''}`}
              >
                Pending ({filteredInfluencers.pending.length})
              </button>
              <button
                onClick={() => setActiveTab('clones')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'clones'
                    ? 'bg-[#c9fffc] text-black'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Clones ({filteredInfluencers.clones.length})
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            {limitsLoading ? (
              <div className="flex gap-2">
                <div className="w-10 h-10 bg-gray-700 rounded animate-pulse"></div>
                <div className="w-10 h-10 bg-gray-700 rounded animate-pulse"></div>
                <div className="w-10 h-10 bg-gray-700 rounded animate-pulse"></div>
              </div>
            ) : (
              <button
                onClick={() => navigate('/planner')}
                data-tour="calendar"
                className="flex items-center justify-center bg-[#c9fffc] text-black p-2 rounded-lg hover:bg-[#a0fcf9] transition-colors"
                title="Content Table"
              >
                <Table2 size={20} />
              </button>
            )}
          </div>
        </div>
        
        <div>
          {/* Influencers Grid */}
          {activeTab === 'pending' ? (
            filteredInfluencers.pending.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredInfluencers.pending.map((influencer) => (
                  <div
                    key={influencer.id}
                    className="bg-[#1a1a1a] rounded-xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 relative"
                  >
                    <div className="absolute top-4 left-4 z-10">
                      <div className="flex items-center gap-2 bg-black bg-opacity-75 rounded-lg px-3 py-2">
                        <Loader2 className="h-4 w-4 animate-spin text-[#c9fffc]" />
                        <span className="text-sm text-white capitalize">
  {influencer.status?.toLowerCase().includes('pending') ? 'Processing' : influencer.status?.replace('-', ' ')}
</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="aspect-square overflow-hidden rounded-xl border-2 border-gray-700">
                        {influencer.preview_url ? (
                          <img
                            src={influencer.preview_url}
                            alt={influencer.name}
                            className="w-full h-full object-contain bg-gray-800"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                            <span className="text-gray-400 text-lg">Processing</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-4 pt-0">
                      <h3 className="text-xl font-bold text-white mb-4">{influencer.name}</h3>
                      <div className="flex items-center gap-2 mt-4">
                        {statusSteps.map((step, index) => {
                          const currentIndex = getStatusIndex(influencer.status);
                          const isActive = index <= currentIndex;
                          const isLast = index === statusSteps.length - 1;
                          
                          return (
                            <React.Fragment key={step.key}>
                              <div className="flex flex-col items-center">
                                <div
                                  className={`w-3 h-3 rounded-full ${
                                    isActive ? 'bg-[#c9fffc]' : 'bg-gray-600'
                                  }`}
                                />
                                <span className={`text-xs mt-1 ${
                                  isActive ? 'text-[#c9fffc]' : 'text-gray-500'
                                }`}>
                                  {step.label}
                                </span>
                              </div>
                              {!isLast && (
                                <div
                                  className={`flex-1 h-0.5 ${
                                    index < currentIndex ? 'bg-[#c9fffc]' : 'bg-gray-600'
                                  }`}
                                />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-12">
                No pending influencers
              </div>
            )
          ) : activeTab === 'available' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[200px]">
              {canCreateAvatar && (
                <button
                  onClick={handleOpenRequestModal}
                  className="bg-[#1a1a1a] rounded-xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 border-dashed border-gray-700 hover:border-[#c9fffc] group"
                >
                  <div className="p-4">
                    <div className="aspect-square rounded-xl border-2 border-gray-700 group-hover:border-[#c9fffc] transition-colors flex items-center justify-center">
                      <div className="flex flex-col items-center gap-4">
                        <Plus size={40} className="text-gray-400 group-hover:text-[#c9fffc] transition-colors" />
                        <span className="text-gray-400 group-hover:text-[#c9fffc] transition-colors font-medium">
                          Create New Influencer
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              )}
              {!canCreateAvatar && (
                <div className="bg-[#1a1a1a] rounded-xl shadow-xl overflow-hidden p-6 border-2 border-red-500/20">
                  <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                    <div className="text-red-500/60 font-medium">
                      Influencer Limit Reached
                    </div>
                    <div className="text-sm text-gray-500">
                      {avatarsUsed}/{avatarLimit} influencers created.
                      Please upgrade your plan to create more influencers.
                    </div>
                  </div>
                </div>
              )}
              {filteredInfluencers.available.map(influencer => (
                <InfluencerCard key={influencer.id} influencer={influencer} onEdit={handleEditInfluencer} />
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredInfluencers.clones
                  .map((clone) => (
                    <CloneCard key={clone.id} clone={clone} />
                  ))}
              </div>
            </div>
          )}
        </div>
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
      <SafariHomeScreenPopup />
    </div>
  );
}

export default DashboardPage;