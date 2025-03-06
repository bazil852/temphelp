import React, { useState, useEffect } from 'react';
import { Search, Tag, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-800 p-6 border-b border-gray-700 z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">{tutorial.title}</h2>
              {tutorial.file_path && (
                <a
                  href={tutorial.file_path}
                  download
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#c9fffc] text-black rounded-lg hover:bg-[#a0fcf9] transition-colors"
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
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#c9fffc] text-black"
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
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      activeTab === 'video'
                        ? 'bg-[#c9fffc] text-black'
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    Video
                  </button>
                )}
                {tutorial.image_path && (
                  <button
                    onClick={() => setActiveTab('image')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      activeTab === 'image'
                        ? 'bg-[#c9fffc] text-black'
                        : 'text-gray-400 hover:text-gray-300'
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
                    className="w-full h-full rounded-lg object-contain"
                  />
                )}
                
                {activeTab === 'image' && tutorial.image_path && (
                  <img
                    src={tutorial.image_path}
                    alt="Tutorial illustration"
                    className="w-full h-full rounded-lg object-contain"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
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
        tutorial.tags?.forEach(tag => tags.add(tag));
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#c9fffc]"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-[#c9fffc] mb-8">Tutorials</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search tutorials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-[#c9fffc] focus:ring-1 focus:ring-[#c9fffc]"
          />
        </div>

        {/* Tags Filter */}
        <div className="w-full md:w-64">
          <select
            value={selectedTag || ''}
            onChange={(e) => setSelectedTag(e.target.value || null)}
            className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-[#c9fffc] focus:ring-1 focus:ring-[#c9fffc]"
          >
            <option value="">All Tags</option>
            {availableTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-500 text-white px-4 py-2 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTutorials.map((tutorial) => (
          <div
            key={tutorial.id}
            onClick={() => navigate(`/tutorials/${tutorial.id}`)}
            className="bg-[#1a1a1a] rounded-xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer group"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-white">{tutorial.title}</h2>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-[#c9fffc] transition-colors" />
              </div>
              
              {tutorial.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {tutorial.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#c9fffc] text-black"
                    >
                      <Tag size={10} />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              <div 
                className=" text-white prose prose-invert max-w-none line-clamp-3"
                dangerouslySetInnerHTML={{ __html: tutorial.content }}
              />
            </div>
          </div>
        ))}

        {filteredTutorials.length === 0 && (
          <div className="col-span-full text-center text-gray-400 py-12">
            No tutorials found matching your criteria
          </div>
        )}
      </div>
    </div>
  );
}