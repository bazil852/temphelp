import React from 'react';
import { useParams } from 'react-router-dom';
import { Download, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Tutorial {
  id: string;
  title: string;
  content: string;
  video_paths: string[];
  image_paths: string[];
  file_paths: string[];
  video_titles: string[];
  image_titles: string[];
  file_titles: string[];
  tags: string[];
  created_at: string;
}

export default function TutorialPage() {
  const { id } = useParams();
  const [tutorial, setTutorial] = React.useState<Tutorial | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    fetchTutorial();
  }, [id]);

  const fetchTutorial = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('tutorials')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setTutorial(data);
    } catch (err) {
      console.error('Error fetching tutorial:', err);
      setError('Failed to fetch tutorial');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-[#c9fffc]" />
      </div>
    );
  }

  if (error || !tutorial) {
    return (
      <div className="text-center py-8 text-red-500">
        {error || 'Tutorial not found'}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-[#1a1a1a] rounded-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-gray-800">
          <h1 className="text-3xl font-bold text-white mb-4">{tutorial.title}</h1>
          {tutorial.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tutorial.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#c9fffc] text-black"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Text Content */}
          <div className="prose prose-invert text-white max-w-none">
            <div dangerouslySetInnerHTML={{ __html: tutorial.content }} />
          </div>

          {/* Videos */}
          {tutorial.video_paths.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Videos</h2>
              <div className="grid gap-4">
                {tutorial.video_paths.map((path, index) => (
                  <div key={path} className="space-y-2">
                    {tutorial.video_titles[index] && (
                      <h3 className="text-lg text-gray-300">{tutorial.video_titles[index]}</h3>
                    )}
                    <video
                      src={path}
                      controls
                      className="w-full rounded-lg aspect-video bg-black"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Images */}
          {tutorial.image_paths.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Images</h2>
              <div className="grid gap-4">
                {tutorial.image_paths.map((path, index) => (
                  <div key={path} className="space-y-2">
                    {tutorial.image_titles[index] && (
                      <h3 className="text-lg text-gray-300">{tutorial.image_titles[index]}</h3>
                    )}
                    <img
                      src={path}
                      alt={tutorial.image_titles[index] || `Image ${index + 1}`}
                      className="w-full rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Download Resources */}
          {tutorial.file_paths.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Resources</h2>
              <div className="grid gap-2">
                {tutorial.file_paths.map((path, index) => (
                  <a
                    key={path}
                    href={path}
                    download
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Download className="h-5 w-5" />
                    <span>{tutorial.file_titles[index] || `Resource ${index + 1}`}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}