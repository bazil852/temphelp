import React, { useState, useEffect } from 'react';
import { Search, Tag, ChevronRight, X, Download, Loader2, Book } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

interface Tutorial {
  id: string;
  title: string;
  content: string;
  video_path?: string;
  image_path?: string;
  file_path?: string;
  tags: string[];
  created_at: string;
}

interface TutorialModalProps {
  tutorial: Tutorial;
  onClose: () => void;
}

function TutorialModal({ tutorial, onClose }: TutorialModalProps) {
  const [activeTab, setActiveTab] = useState<'video' | 'image'>('video');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-[0_0_30px_rgba(255,255,255,0.15)]"
          onClick={e => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-white/5 backdrop-blur-xl p-6 border-b border-white/10 z-10 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">{tutorial.title}</h2>
              {tutorial.file_path && (
                <a
                  href={tutorial.file_path}
                  download
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#4DE0F9] text-black rounded-xl hover:bg-[#4DE0F9]/80 transition-all duration-200 font-medium"
                >
                  <Download size={16} />
                  Download Resources
                </a>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-300"
            >
              <X size={24} />
            </button>
          </div>
          
          {tutorial.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {tutorial.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-[#4DE0F9]/20 text-[#4DE0F9] border border-[#4DE0F9]/30"
                >
                  <Tag size={12} />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="p-6">
          <div 
            className="prose prose-invert max-w-none mb-6"
            dangerouslySetInnerHTML={{ __html: tutorial.content }}
          />

          {(tutorial.video_path || tutorial.image_path) && (
            <div>
              <div className="flex gap-4 mb-4">
                {tutorial.video_path && (
                  <button
                    onClick={() => setActiveTab('video')}
                    className={`px-4 py-2 rounded-xl transition-all duration-200 ${
                      activeTab === 'video'
                        ? 'bg-[#4DE0F9] text-black font-medium'
                        : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    Video
                  </button>
                )}
                {tutorial.image_path && (
                  <button
                    onClick={() => setActiveTab('image')}
                    className={`px-4 py-2 rounded-xl transition-all duration-200 ${
                      activeTab === 'image'
                        ? 'bg-[#4DE0F9] text-black font-medium'
                        : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    Image
                  </button>
                )}
              </div>

              <div className="w-full aspect-video">
                {activeTab === 'video' && tutorial.video_path && (
                  <video
                    src={tutorial.video_path}
                    controls
                    className="w-full h-full rounded-xl object-contain bg-black/20"
                  />
                )}
                
                {activeTab === 'image' && tutorial.image_path && (
                  <img
                    src={tutorial.image_path}
                    alt="Tutorial illustration"
                    className="w-full h-full rounded-xl object-contain bg-black/20"
                  />
                )}
              </div>
            </div>
          )}
        </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function TutorialsPage() {
  const navigate = useNavigate();
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);

  useEffect(() => {
    fetchTutorials();
  }, []);

  const fetchTutorials = async () => {
    try {
      const { data, error } = await supabase
        .from('tutorials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTutorials(data || []);

      // Extract unique tags
      const tags = new Set<string>();
      data?.forEach(tutorial => {
        tutorial.tags?.forEach((tag: string) => tags.add(tag));
      });
      setAvailableTags(Array.from(tags));
    } catch (err) {
      console.error('Error fetching tutorials:', err);
      setError('Failed to fetch tutorials');
    } finally {
      setLoading(false);
    }
  };

  const filteredTutorials = tutorials.filter(tutorial => {
    const matchesSearch = tutorial.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tutorial.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || tutorial.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex items-center gap-3 text-white">
          <Loader2 className="animate-spin h-8 w-8 text-[#4DE0F9]" />
          <span className="text-lg">Loading tutorials...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <Book className="h-8 w-8 text-[#4DE0F9]" />
          <h1 className="text-3xl font-bold text-white">Tutorials</h1>
        </div>
        <p className="text-gray-400">Learn how to use the platform with our comprehensive guides</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8 shadow-[0_0_30px_rgba(255,255,255,0.15)]"
      >
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search tutorials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 text-white rounded-xl border border-white/10 focus:border-[#4DE0F9] focus:ring-2 focus:ring-[#4DE0F9]/20 transition-all duration-200 placeholder-gray-400"
            />
          </div>

          {/* Tags Filter */}
          <div className="w-full md:w-64">
            <select
              value={selectedTag || ''}
              onChange={(e) => setSelectedTag(e.target.value || null)}
              className="w-full px-4 py-3 bg-white/5 text-white rounded-xl border border-white/10 focus:border-[#4DE0F9] focus:ring-2 focus:ring-[#4DE0F9]/20 transition-all duration-200"
            >
              <option value="">All Tags</option>
              {availableTags.map((tag: string) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-500/20 border border-red-500/30 text-red-300 px-6 py-4 rounded-xl mb-6 backdrop-blur-xl"
        >
          {error}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filteredTutorials.map((tutorial, index) => (
          <motion.div
            key={tutorial.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 * index }}
            onClick={() => setSelectedTutorial(tutorial)}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-[#4DE0F9]/50 hover:shadow-[0_0_30px_rgba(77,224,249,0.15)] transition-all duration-300 cursor-pointer group"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-white group-hover:text-[#4DE0F9] transition-colors">{tutorial.title}</h2>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-[#4DE0F9] transition-colors" />
              </div>
              
              {tutorial.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {tutorial.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-[#4DE0F9]/20 text-[#4DE0F9] border border-[#4DE0F9]/30"
                    >
                      <Tag size={10} />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              <div 
                className="text-gray-300 prose prose-invert prose-sm max-w-none line-clamp-3"
                dangerouslySetInnerHTML={{ __html: tutorial.content }}
              />
            </div>
          </motion.div>
        ))}

        {filteredTutorials.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full text-center text-gray-400 py-16"
          >
            <Book className="h-16 w-16 mx-auto mb-4 text-gray-600" />
            <p className="text-lg text-gray-300">No tutorials found matching your criteria</p>
            <p className="text-sm mt-2 text-gray-500">Try adjusting your search or filter settings</p>
          </motion.div>
        )}
      </motion.div>

      {selectedTutorial && (
        <TutorialModal
          tutorial={selectedTutorial}
          onClose={() => setSelectedTutorial(null)}
        />
      )}
    </div>
  );
}