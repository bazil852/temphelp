import React, { useEffect, useState } from 'react';
import { Plus, Loader2, Search, X, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Influencer {
  id: string;
  name: string;
  template_id: string;
  user_id: string;
  preview_url?: string;
  status?: string;
  voice_id?: string;
  created_at: string;
  auth_users_view: {
    email: string;
  };
}

export default function InfluencersPanel() {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingInfluencer, setEditingInfluencer] = useState<Influencer | null>(null);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchInfluencers();
  }, []);

  const fetchInfluencers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('influencers')
        .select(`
          *,
          auth_users_view (
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInfluencers(data || []);
    } catch (err) {
      console.error('Error fetching influencers:', err);
      setError('Failed to fetch influencers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInfluencer = async (name: string, templateId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('influencers')
        .insert([{
          name,
          template_id: templateId,
          user_id: userId
        }]);

      if (error) throw error;
      await fetchInfluencers();
      setShowCreateModal(false);
    } catch (err) {
      console.error('Error creating influencer:', err);
      setError('Failed to create influencer');
    }
  };

  const handleUpdateInfluencer = async (id: string, updates: { name?: string; template_id?: string }) => {
    try {
      const { error } = await supabase
        .from('influencers')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await fetchInfluencers();
      setEditingInfluencer(null);
    } catch (err) {
      console.error('Error updating influencer:', err);
      setError('Failed to update influencer');
    }
  };

  const handleDeleteInfluencer = async (id: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this influencer?');
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('influencers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchInfluencers();
    } catch (err) {
      console.error('Error deleting influencer:', err);
      setError('Failed to delete influencer');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredInfluencers = influencers.filter(influencer =>
    influencer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    influencer.auth_users_view?.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Influencers Management</h2>
      </div>

      {error && (
        <div className="bg-red-500 text-white px-4 py-2 rounded-lg">
          {error}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search influencers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Template ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredInfluencers.map((influencer) => (
                  <tr key={influencer.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {editingInfluencer?.id === influencer.id ? (
                        <input
                          type="text"
                          value={editingInfluencer.name}
                          onChange={(e) => setEditingInfluencer({
                            ...editingInfluencer,
                            name: e.target.value
                          })}
                          className="bg-gray-700 text-white rounded px-2 py-1 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        influencer.name
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {influencer.auth_users_view?.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {editingInfluencer?.id === influencer.id ? (
                        <input
                          type="text"
                          value={editingInfluencer.template_id}
                          onChange={(e) => setEditingInfluencer({
                            ...editingInfluencer,
                            template_id: e.target.value
                          })}
                          className="bg-gray-700 text-white rounded px-2 py-1 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        influencer.template_id
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        influencer.status === 'completed' ? 'bg-green-900 text-green-200' :
                        influencer.status === 'pending' ? 'bg-yellow-900 text-yellow-200' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {influencer.status || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(influencer.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <div className="flex items-center gap-3">
                        {editingInfluencer?.id === influencer.id ? (
                          <>
                            <button
                              onClick={() => handleUpdateInfluencer(influencer.id, {
                                name: editingInfluencer.name,
                                template_id: editingInfluencer.template_id
                              })}
                              className="text-green-400 hover:text-green-300"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingInfluencer(null)}
                              className="text-gray-400 hover:text-gray-300"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingInfluencer(influencer)}
                              className="text-blue-400 hover:text-blue-300"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteInfluencer(influencer.id)}
                              disabled={isDeleting}
                              className="text-red-400 hover:text-red-300 disabled:opacity-50"
                            >
                              {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}