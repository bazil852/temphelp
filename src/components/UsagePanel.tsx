import React, { useEffect, useState } from 'react';
import { Loader2, Save, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UserUsage {
  user_id: string;
  avatars_created: number;
  video_minutes_used: number;
  ai_clone_created: number;
  automation: boolean;
  ai_editing: boolean;
  videos_created: number;
  auth_users_view: {
    email: string;
  };
}

export default function UsagePanel() {
  const [usageData, setUsageData] = useState<UserUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Partial<UserUsage>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsageData();
  }, []);

  const fetchUsageData = async () => {
    setLoading(true);
    try {
      // First get all users with their emails
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('auth_user_id, email');

      if (usersError) throw usersError;

      // Then get usage data
      const { data, error } = await supabase
        .from('user_usage')
        .select('*');

      if (error) throw error;

      // Combine the data
      const combinedData = (data || []).map(usage => {
        const user = users?.find(u => u.auth_user_id === usage.user_id);
        return {
          ...usage,
          auth_users_view: {
            email: user?.email || 'Unknown'
          }
        };
      });

      setUsageData(combinedData);
    } catch (err) {
      console.error('Error fetching usage data:', err);
      setError('Failed to fetch usage data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_usage')
        .update(editedValues)
        .eq('user_id', userId);

      if (error) throw error;

      setEditingRow(null);
      setEditedValues({});
      await fetchUsageData();
    } catch (err) {
      console.error('Error updating usage:', err);
      setError('Failed to update usage data');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">User Usage Management</h2>
      </div>

      {error && (
        <div className="bg-red-500 text-white px-4 py-2 rounded-lg">
          {error}
        </div>
      )}

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
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Avatars Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Video Minutes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Videos Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    AI Clones
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Automation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    AI Editing
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {usageData.map((usage) => (
                  <tr key={usage.user_id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {usage.auth_users_view.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {editingRow === usage.user_id ? (
                        <input
                          type="number"
                          value={editedValues.avatars_created ?? usage.avatars_created}
                          onChange={(e) => setEditedValues({
                            ...editedValues,
                            avatars_created: parseInt(e.target.value)
                          })}
                          className="bg-gray-700 text-white rounded px-2 py-1 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-20"
                        />
                      ) : (
                        usage.avatars_created
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {editingRow === usage.user_id ? (
                        <input
                          type="number"
                          value={editedValues.video_minutes_used ?? usage.video_minutes_used}
                          onChange={(e) => setEditedValues({
                            ...editedValues,
                            video_minutes_used: parseInt(e.target.value)
                          })}
                          className="bg-gray-700 text-white rounded px-2 py-1 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-20"
                        />
                      ) : (
                        usage.video_minutes_used
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {editingRow === usage.user_id ? (
                        <input
                          type="number"
                          value={editedValues.videos_created ?? usage.videos_created}
                          onChange={(e) => setEditedValues({
                            ...editedValues,
                            videos_created: parseInt(e.target.value)
                          })}
                          className="bg-gray-700 text-white rounded px-2 py-1 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-20"
                        />
                      ) : (
                        usage.videos_created
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {editingRow === usage.user_id ? (
                        <input
                          type="number"
                          value={editedValues.ai_clone_created ?? usage.ai_clone_created}
                          onChange={(e) => setEditedValues({
                            ...editedValues,
                            ai_clone_created: parseInt(e.target.value)
                          })}
                          className="bg-gray-700 text-white rounded px-2 py-1 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-20"
                        />
                      ) : (
                        usage.ai_clone_created
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {editingRow === usage.user_id ? (
                        <input
                          type="checkbox"
                          checked={editedValues.automation ?? usage.automation}
                          onChange={(e) => setEditedValues({
                            ...editedValues,
                            automation: e.target.checked
                          })}
                          className="rounded border-gray-600 text-blue-500 focus:ring-blue-500"
                        />
                      ) : (
                        usage.automation ? 'Yes' : 'No'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {editingRow === usage.user_id ? (
                        <input
                          type="checkbox"
                          checked={editedValues.ai_editing ?? usage.ai_editing}
                          onChange={(e) => setEditedValues({
                            ...editedValues,
                            ai_editing: e.target.checked
                          })}
                          className="rounded border-gray-600 text-blue-500 focus:ring-blue-500"
                        />
                      ) : (
                        usage.ai_editing ? 'Yes' : 'No'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <div className="flex items-center gap-3">
                        {editingRow === usage.user_id ? (
                          <>
                            <button
                              onClick={() => handleSave(usage.user_id)}
                              className="text-green-400 hover:text-green-300"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingRow(null);
                                setEditedValues({});
                              }}
                              className="text-gray-400 hover:text-gray-300"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setEditingRow(usage.user_id)}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            Edit
                          </button>
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