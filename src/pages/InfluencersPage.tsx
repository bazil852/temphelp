import React, { useState, useEffect } from 'react';
import { Plus, Users, Loader2, Grid, LayoutGrid, List, Columns, Rows, Layout, CheckCircle2, Clock, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { InfluencerCard } from '../components/InfluencerCard';
import { CloneCard } from '../components/CloneCard';
import CreateInfluencerModal from '../components/CreateInfluencerModal';
import { useInfluencerStore } from '../store/influencerStore';
import { Influencer } from '../types';
import RequestInfluencerModal from '../components/RequestInfluencerModal';
import MultiStepModal from '../components/MultiStepModal';
import { usePlanLimits } from '../hooks/usePlanLimits';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardButton from '../components/DashboardButton';

interface Tab {
  key: 'available' | 'pending' | 'clones';
  label: string;
  icon: React.ElementType;
  count: number;
}

const gridLayouts = [
  { value: 3, icon: LayoutGrid, label: '3 Columns' },
  { value: 4, icon: Columns, label: '4 Columns' },
  { value: 5, icon: Layout, label: '5 Columns' },
];

const initialTabs: Tab[] = [
  { key: 'available', label: 'Available', icon: CheckCircle2, count: 0 },
  { key: 'pending', label: 'Pending', icon: Clock, count: 0 },
  { key: 'clones', label: 'Clones', icon: Copy, count: 0 },
];

function InfluencersPage() {
  const navigate = useNavigate();
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInfluencer, setEditingInfluencer] = useState<Influencer | null>(null);
  const { influencers, fetchInfluencers } = useInfluencerStore();
  const { currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'available' | 'pending' | 'clones'>('available');
  const [gridCols, setGridCols] = useState(4);
  const [showGridDropdown, setShowGridDropdown] = useState(false);
  const [tabs, setTabs] = useState<Tab[]>(initialTabs);
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
    loading: limitsLoading 
  } = usePlanLimits();

  useEffect(() => {
    fetchInfluencers().catch(console.error);
  }, [fetchInfluencers]);

  useEffect(() => {
    // Filter influencers
    const pending = influencers.filter(inf => ['pending', 'motion-training', 'pending-motion'].includes(inf.status || '') && !inf.look_id);
    const available = influencers.filter(inf => 
      (!inf.status || inf.status === 'completed') && !inf.look_id
    );

    // Fetch clones
    const fetchClones = async () => {
      try {
        if (!currentUser?.id) return;
    
        const { data: clones } = await supabase
          .from('clones')
          .select('*')
          .eq('user_id', currentUser.id)
          .not('clone_id', 'is', null)
          .order('created_at', { ascending: false });
    
        setFilteredInfluencers({ pending, available, clones: clones || [] });
      } catch (error) {
        console.error('Error fetching clones:', error);
      }
    };

    fetchClones();
  }, [influencers, currentUser?.id]);

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

  // Update tab counts
  useEffect(() => {
    setTabs(prevTabs => prevTabs.map(tab => ({
      ...tab,
      count: tab.key === 'available' ? filteredInfluencers.available.length :
             tab.key === 'pending' ? filteredInfluencers.pending.length :
             filteredInfluencers.clones.length
    })));
  }, [filteredInfluencers]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-2xl md:text-3xl font-bold text-white tracking-tight"
          >
            Your Influencers
          </motion.h1>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2 p-1 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === tab.key
                    ? 'text-white bg-cyan-500'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Grid Layout Selector */}
          <div className="relative group">
            <button
              onClick={() => setShowGridDropdown(!showGridDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl shadow-lg transition-all duration-200"
              title="Change Grid View"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            
            <AnimatePresence>
              {showGridDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-48 bg-[#1a1a1a] rounded-lg shadow-xl border border-white/10 overflow-hidden z-50"
                >
                  {gridLayouts.map((layout) => (
                    <button
                      key={layout.value}
                      onClick={() => {
                        setGridCols(layout.value);
                        setShowGridDropdown(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                        gridCols === layout.value
                          ? 'bg-cyan-500/20 text-cyan-500'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <layout.icon className="w-4 h-4" />
                      {layout.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Grid */}
        <div
          className={`grid gap-6 ${
            gridCols === 1
              ? 'grid-cols-1'
              : gridCols === 2
              ? 'grid-cols-1 sm:grid-cols-2'
              : gridCols === 3
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              : gridCols === 4
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5'
          }`}
        >
          {/* Create New Influencer Card */}
          <div className="relative group">
            <DashboardButton
              icon={Plus}
              title="Create New Influencer"
              description="Add a new AI influencer to your collection"
              onClick={handleOpenRequestModal}
              isDisabled={!canCreateAvatar}
            />
          </div>

          {/* Influencer Cards */}
          {activeTab === 'available' && filteredInfluencers.available.map((influencer) => (
            <div
              key={influencer.id}
              className="relative group"
            >
              <InfluencerCard
                influencer={influencer}
                onEdit={() => handleEditInfluencer(influencer)}
              />
            </div>
          ))}

          {activeTab === 'pending' && filteredInfluencers.pending.map((influencer) => (
            <div
              key={influencer.id}
              className="relative group"
            >
              <InfluencerCard
                influencer={influencer}
                onEdit={() => handleEditInfluencer(influencer)}
              />
            </div>
          ))}

          {activeTab === 'clones' && filteredInfluencers.clones.map((clone) => (
            <div
              key={clone.id}
              className="relative group"
            >
              <CloneCard clone={clone} />
            </div>
          ))}
        </div>

        {/* Modals */}
        {isModalOpen && (
          <CreateInfluencerModal
            influencer={editingInfluencer}
            onClose={handleCloseModal}
          />
        )}
        {isRequestModalOpen && (
          <MultiStepModal onClose={handleCloseRequestModal}/>
        )}
      </div>
    </div>
  );
}

export default InfluencersPage; 