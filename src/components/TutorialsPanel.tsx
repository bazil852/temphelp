import React, { useState, useEffect } from 'react';
import { Plus, Loader2, Save, X, Upload, Tag, Book, Trash2, Edit } from 'lucide-react';
import { supabase } from '../lib/supabase';
import TipTapEditor from './TipTapEditor';

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

export default function TutorialsPanel() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTutorial, setEditingTutorial] = useState<Tutorial | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [videos, setVideos] = useState<File[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [videoTitles, setVideoTitles] = useState<string[]>([]);
  const [imageTitles, setImageTitles] = useState<string[]>([]);
  const [fileTitles, setFileTitles] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleEditTutorial = (tutorial: Tutorial) => {
    setEditingTutorial(tutorial);
    setTitle(tutorial.title);
    setContent(tutorial.content);
    setTags(tutorial.tags);
    setShowCreateForm(true);
  };

  const handleDeleteTutorial = async (tutorial: Tutorial) => {
    const confirmed = window.confirm('Are you sure you want to delete this tutorial? This action cannot be undone.');
    if (!confirmed) return;

    setLoading(true);
    try {
      // Delete associated files from storage if they exist
      if (tutorial.video_path) {
        const videoKey = tutorial.video_path.split('/').pop();
        if (videoKey) {
          await supabase.storage
            .from('tutorial_videos')
            .remove([videoKey]);
        }
      }

      if (tutorial.image_path) {
        const imageKey = tutorial.image_path.split('/').pop();
        if (imageKey) {
          await supabase.storage
            .from('tutorial_images')
            .remove([imageKey]);
        }
      }

      if (tutorial.file_path) {
        const fileKey = tutorial.file_path.split('/').pop();
        if (fileKey) {
          await supabase.storage
            .from('tutorial_files')
            .remove([fileKey]);
        }
      }

      // Delete the tutorial record
      const { error: deleteError } = await supabase
        .from('tutorials')
        .delete()
        .eq('id', tutorial.id);

      if (deleteError) throw deleteError;

      // Refresh tutorials list
      await fetchTutorials();
    } catch (err) {
      console.error('Error deleting tutorial:', err);
      setError('Failed to delete tutorial');
    } finally {
      setLoading(false);
    }
  };

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
    } catch (err) {
      console.error('Error fetching tutorials:', err);
      setError('Failed to fetch tutorials');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File, bucket: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      setError('Title and content are required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const videoPaths: string[] = [];
      const imagePaths: string[] = [];
      const filePaths: string[] = [];

      // Upload videos
      for (const video of videos) {
        const path = await handleFileUpload(video, 'tutorial_videos');
        videoPaths.push(path);
      }

      // Upload images
      for (const image of images) {
        const path = await handleFileUpload(image, 'tutorial_images');
        imagePaths.push(path);
      }

      // Upload files
      for (const file of files) {
        const path = await handleFileUpload(file, 'tutorial_files');
        filePaths.push(path);
      }

      // If editing, keep existing paths
      const finalVideoPaths = editingTutorial 
        ? [...editingTutorial.video_paths, ...videoPaths]
        : videoPaths;
      const finalImagePaths = editingTutorial
        ? [...editingTutorial.image_paths, ...imagePaths]
        : imagePaths;
      const finalFilePaths = editingTutorial
        ? [...editingTutorial.file_paths, ...filePaths]
        : filePaths;

      // Keep existing titles and add new ones
      const finalVideoTitles = editingTutorial
        ? [...editingTutorial.video_titles, ...videoTitles]
        : videoTitles;
      const finalImageTitles = editingTutorial
        ? [...editingTutorial.image_titles, ...imageTitles]
        : imageTitles;
      const finalFileTitles = editingTutorial
        ? [...editingTutorial.file_titles, ...fileTitles]
        : fileTitles;

      const tutorialData = {
        title,
        content,
        video_paths: finalVideoPaths,
        image_paths: finalImagePaths,
        file_paths: finalFilePaths,
        video_titles: finalVideoTitles,
        image_titles: finalImageTitles,
        file_titles: finalFileTitles,
        tags
      };

      if (editingTutorial) {
        const { error: updateError } = await supabase
          .from('tutorials')
          .update(tutorialData)
          .eq('id', editingTutorial.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('tutorials')
          .insert([tutorialData]);

        if (insertError) throw insertError;
      }
      // Reset form
      setTitle('');
      setContent('');
      setVideos([]);
      setImages([]);
      setFiles([]);
      setVideoTitles([]);
      setImageTitles([]);
      setFileTitles([]);
      setTags([]);
      setEditingTutorial(null);
      setShowCreateForm(false);
      
      // Refresh tutorials list
      await fetchTutorials();
    } catch (err) {
      console.error('Error creating tutorial:', err);
      setError('Failed to create tutorial');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      if (!tags.includes(newTag.trim())) {
        setTags([...tags, newTag.trim()]);
      }
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Tutorials Management</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-black rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Create Tutorial
        </button>
      </div>

      {error && (
        <div className="bg-red-500 text-white px-4 py-2 rounded-lg">
          {error}
        </div>
      )}

      {showCreateForm && (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-white">
              {editingTutorial ? 'Edit Tutorial' : 'Create New Tutorial'}
            </h3>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setEditingTutorial(null);
              }}
              className="text-gray-400 hover:text-gray-300"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Content
              </label>
              <TipTapEditor
                content={content}
                onChange={setContent}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Videos
                </label>
                <div className="mt-1 flex items-center">
                  <input
                    type="file"
                    accept="video/*"
                    multiple
                    onChange={(e) => {
                      const newFiles = Array.from(e.target.files || []);
                      setVideos(prev => [...prev, ...newFiles]);
                      setVideoTitles(prev => [...prev, ...newFiles.map(f => f.name)]);
                    }}
                    className="hidden"
                    id="video-upload"
                  />
                  <label
                    htmlFor="video-upload"
                    className="cursor-pointer flex items-center justify-center w-full px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600"
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    Upload Videos ({videos.length} selected)
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Images
                </label>
                <div className="mt-1 flex items-center">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const newFiles = Array.from(e.target.files || []);
                      setImages(prev => [...prev, ...newFiles]);
                      setImageTitles(prev => [...prev, ...newFiles.map(f => f.name)]);
                    }}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex items-center justify-center w-full px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600"
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    Upload Images ({images.length} selected)
                  </label>
                </div>
                {images.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {images.map((image, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={imageTitles[index]}
                          onChange={(e) => {
                            const newTitles = [...imageTitles];
                            newTitles[index] = e.target.value;
                            setImageTitles(newTitles);
                          }}
                          className="flex-1 text-sm bg-gray-700 border-gray-600 rounded"
                          placeholder="Image title"
                        />
                        <button
                          onClick={() => {
                            setImages(prev => prev.filter((_, i) => i !== index));
                            setImageTitles(prev => prev.filter((_, i) => i !== index));
                          }}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Files
                </label>
                <div className="mt-1 flex items-center">
                  <input
                    type="file"
                    multiple
                    onChange={(e) => {
                      const newFiles = Array.from(e.target.files || []);
                      setFiles(prev => [...prev, ...newFiles]);
                      setFileTitles(prev => [...prev, ...newFiles.map(f => f.name)]);
                    }}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex items-center justify-center w-full px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600"
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    Upload Files ({files.length} selected)
                  </label>
                </div>
                {files.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={fileTitles[index]}
                          onChange={(e) => {
                            const newTitles = [...fileTitles];
                            newTitles[index] = e.target.value;
                            setFileTitles(newTitles);
                          }}
                          className="flex-1 text-sm bg-gray-700 border-gray-600 rounded"
                          placeholder="File title"
                        />
                        <button
                          onClick={() => {
                            setFiles(prev => prev.filter((_, i) => i !== index));
                            setFileTitles(prev => prev.filter((_, i) => i !== index));
                          }}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">
                Tags
              </label>
              <div className="mt-1">
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-blue-400 hover:text-blue-600"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="block w-full rounded-md bg-gray-700 border-gray-600 text-white"
                  placeholder="Type tag and press Enter"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingTutorial(null);
                }}
                className="px-4 py-2 text-gray-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-black rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {editingTutorial ? 'Saving...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {editingTutorial ? 'Save Tutorial' : 'Create Tutorial'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {tutorials.map((tutorial) => (
          <div
            key={tutorial.id}
            className="bg-gray-800 rounded-lg p-6 shadow-lg"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-white">
                {tutorial.title}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEditTutorial(tutorial)}
                  className="text-blue-500 hover:text-blue-400 transition-colors"
                  title="Edit tutorial"
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDeleteTutorial(tutorial)}
                  className="text-red-500 hover:text-red-400 transition-colors"
                  title="Delete tutorial"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="prose text-white prose-invert max-w-none mb-4" dangerouslySetInnerHTML={{ __html: tutorial.content }} />
            
            <div className="flex flex-wrap gap-2 mb-4">
              {tutorial.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tutorial.video_paths.map((path, index) => (
                <div key={path} className="space-y-2">
                  {tutorial.video_titles[index] && (
                    <h4 className="text-sm font-medium text-gray-300">{tutorial.video_titles[index]}</h4>
                  )}
                  <video src={path} controls className="w-full rounded-lg" />
                </div>
              ))}
              
              {tutorial.image_paths.map((path, index) => (
                <div key={path} className="space-y-2">
                  {tutorial.image_titles[index] && (
                    <h4 className="text-sm font-medium text-gray-300">{tutorial.image_titles[index]}</h4>
                  )}
                  <img src={path} alt={tutorial.image_titles[index] || 'Tutorial image'} className="w-full rounded-lg" />
                </div>
              ))}
              
              {tutorial.file_paths.map((path, index) => (
                <div key={path} className="space-y-2">
                  <a
                    href={path}
                    download
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                  >
                    <Upload className="h-5 w-5" />
                    {tutorial.file_titles[index] || 'Download File'}
                  </a>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}