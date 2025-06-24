import React, { useState, useEffect } from 'react';
import { Plus, Table2, Headset, Loader2, Users, Calendar, Webhook, Bell, Power, Clock, CheckCircle2, XCircle, Brain, Video, Zap } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
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
import { motion, AnimatePresence } from 'framer-motion';
import DashboardButton from '../components/DashboardButton';
import WebhookModal from '../components/WebhookModal';
import ActiveWebhooksPanel from '../components/ActiveWebhooksPanel';
import AutomationWidget from '../components/AutomationWidget';
import ProcessingQueueWidget from '../components/ProcessingQueueWidget';
import FeaturedContentRow from '../components/FeaturedContentRow';
import StatCard from '../components/StatCard';

// Add mock data for featured content
const mockRecentVideos = [
  {
    id: '1',
    type: 'video' as const,
    title: 'Summer Collection Lookbook',
    thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
    duration: '2:30',
  },
  {
    id: '2',
    type: 'video' as const,
    title: 'Product Review: New Smartwatch',
    thumbnail: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a',
    duration: '1:45',
  },
  {
    id: '3',
    type: 'video' as const,
    title: 'Travel Vlog: Paris Fashion Week',
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
    duration: '3:15',
  },
];

const mockTopInfluencers = [
  {
    id: '1',
    type: 'influencer' as const,
    title: 'Sarah Chen',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
    status: 'Ready',
  },
  {
    id: '2',
    type: 'influencer' as const,
    title: 'Marcus Rodriguez',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
    status: 'Ready',
  },
  {
    id: '3',
    type: 'influencer' as const,
    title: 'Emma Thompson',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
    status: 'Setup Pending',
  },
];

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
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [activeTriggers, setActiveTriggers] = useState(3);
  const [recentTriggers, setRecentTriggers] = useState([
    { id: 1, name: 'Morning Upload', time: '2h ago' },
    { id: 2, name: 'Voice Sync', time: 'Yesterday' }
  ]);
  const [processingItems, setProcessingItems] = useState([
    { id: 1, name: 'Voice Cloning', progress: 75, time: '5 min left' },
    { id: 2, name: 'Rendering', progress: 30, time: '15 min left' }
  ]);
  const [recentVideos, setRecentVideos] = useState<Array<{
    id: string;
    type: 'video';
    title: string;
    thumbnail: string;
    duration: string;
  }>>([]);
  const [topInfluencers, setTopInfluencers] = useState<Array<{
    id: string;
    type: 'influencer';
    title: string;
    thumbnail: string;
    avatar: string;
    status: string;
  }>>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  const [isLoadingInfluencers, setIsLoadingInfluencers] = useState(true);
  
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
    const pending = influencers.filter(inf => inf.status && ['pending', 'motion-training', 'pending-motion'].includes(inf.status) && !inf.look_id);
    const available = influencers.filter(inf => 
      (!inf.status || inf.status === 'completed' ) && !inf.look_id
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

  // Add new useEffect for fetching recent videos
  useEffect(() => {
    const fetchRecentVideos = async () => {
      if (!currentUser?.id) return;
      
      setIsLoadingVideos(true);
      try {
        // First get all influencers for the current user
        const { data: influencers, error: influencersError } = await supabase
          .from('influencers')
          .select('id')
          .eq('user_id', currentUser.id);

        if (influencersError) throw influencersError;

        // Get all content for these influencers
        const influencerIds = influencers.map(inf => inf.id);
        const { data: contents, error: contentsError } = await supabase
          .from('contents')
          .select('id, title, video_url, created_at')
          .in('influencer_id', influencerIds)
          .eq('status', 'completed')
          .not('video_url', 'is', null)
          .order('created_at', { ascending: false })
          .limit(5);

        if (contentsError) throw contentsError;

        // Transform the data to match our ContentItem interface
        const transformedVideos = contents.map(content => ({
          id: content.id,
          type: 'video' as const,
          title: content.title,
          thumbnail: content.video_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30', // Use video_url as thumbnail
          duration: '0:30', // Default duration since we don't have it in the database
        }));

        setRecentVideos(transformedVideos);
      } catch (error) {
        console.error('Error fetching recent videos:', error);
      } finally {
        setIsLoadingVideos(false);
      }
    };

    fetchRecentVideos();
  }, [currentUser?.id]);

  // Add new useEffect for fetching top influencers
  useEffect(() => {
    const fetchTopInfluencers = async () => {
      if (!currentUser?.id) return;
      
      setIsLoadingInfluencers(true);
      try {
        // Get all influencers for the current user
        const { data: influencers, error: influencersError } = await supabase
          .from('influencers')
          .select('id, name, preview_url, status')
          .eq('user_id', currentUser.id);

        if (influencersError) throw influencersError;

        // Get video count for each influencer
        const influencersWithCounts = await Promise.all(
          influencers.map(async (influencer) => {
            const { count, error: countError } = await supabase
              .from('contents')
              .select('*', { count: 'exact', head: true })
              .eq('influencer_id', influencer.id)
              .eq('status', 'completed');

            if (countError) throw countError;

            return {
              ...influencer,
              videoCount: count || 0
            };
          })
        );

        // Sort by video count and take top 5
        const sortedInfluencers = influencersWithCounts
          .sort((a, b) => b.videoCount - a.videoCount)
          .slice(0, 5)
          .map(inf => ({
            id: inf.id,
            type: 'influencer' as const,
            title: inf.name,
            thumbnail: inf.preview_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
            avatar: inf.preview_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
            status: inf.status === 'completed' ? 'Ready' : 'Setup Pending'
          }));

        setTopInfluencers(sortedInfluencers);
      } catch (error) {
        console.error('Error fetching top influencers:', error);
      } finally {
        setIsLoadingInfluencers(false);
      }
    };

    fetchTopInfluencers();
  }, [currentUser?.id]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
          {/* Analytics HUD Strip */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 100, 
            damping: 20,
            duration: 0.5
          }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.15)] p-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* AI Cloning Analytics */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <StatCard
                icon={<Brain className="h-5 w-5 text-[#4DE0F9]" />}
                label="AI Cloning"
                main={limitsLoading ? "..." : `${aiCloningUsed} / ${aiCloningLimit === -1 ? '∞' : aiCloningLimit}`}
                progress={aiCloningLimit === -1 ? 100 : (aiCloningUsed / aiCloningLimit) * 100}
              />
            </motion.div>

            {/* Video Minutes Analytics */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <StatCard
                icon={<Video className="h-5 w-5 text-[#4DE0F9]" />}
                label="Video Minutes"
                main={limitsLoading ? "..." : `${videoMinutesUsed || 0} / ${videoMinutesLimit === -1 ? '∞' : videoMinutesLimit}`}
                progress={videoMinutesLimit === -1 ? 100 : (videoMinutesUsed / videoMinutesLimit) * 100}
              />
            </motion.div>

            {/* Automations Analytics */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <StatCard
                icon={<Zap className="h-5 w-5 text-[#4DE0F9]" />}
                label="Automations"
                main={automationsEnabled ? "Enabled" : "Disabled"}
                helper={automationsEnabled ? "Ready to use" : "Upgrade to enable"}
                pulse={automationsEnabled}
              />
            </motion.div>
          </div>
        </motion.div>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DashboardButton
            icon={Users}
            title="Influencers"
            description="Manage your AI influencers and their content"
            to="/influencers"
          />
          <DashboardButton
            icon={Calendar}
            title="Content Planner"
            description="Plan and schedule your content calendar"
            to="/planner"
          />
          <DashboardButton
            icon={Webhook}
            title="Automations"
            description="Set up automated workflows and triggers"
            onClick={() => setIsWebhookModalOpen(true)}
            isDisabled={!automationsEnabled}
                    />
                  </div>
        
        {/* Widgets Grid */}
        <div className="flex flex-wrap gap-6">
          <AutomationWidget
            activeTriggers={activeTriggers}
            recentTriggers={recentTriggers}
          />
          <ProcessingQueueWidget />
          </div>

      {isModalOpen && (
        <CreateInfluencerModal
          influencer={editingInfluencer}
          onClose={handleCloseModal}
        />
      )}
      {isRequestModalOpen && (
        <MultiStepModal onClose={handleCloseRequestModal}/>
      )}
        {isWebhookModalOpen && (
          <WebhookModal 
            onClose={() => setIsWebhookModalOpen(false)} 
            influencerId={editingInfluencer?.id} 
          />
        )}
      <SafariHomeScreenPopup />

        {/* Featured Content Section */}
        <div className="mt-12">
          <FeaturedContentRow
            title="Recent Videos"
            items={recentVideos}
            type="video"
            isLoading={isLoadingVideos}
          />
          <FeaturedContentRow
            title="Top AI Influencers"
            items={topInfluencers}
            type="influencer"
            isLoading={isLoadingInfluencers}
          />
        </div>
      </div>
  </div>
  );
}

export default DashboardPage;