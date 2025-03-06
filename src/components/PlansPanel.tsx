import React, { useEffect, useState } from 'react';
import { Plus, Loader2, Save, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Plan {
  id: number;
  plan_name: string;
  price: number;
  avatars: number;
  ai_cloning: number;
  automations: boolean;
  ai_editing: boolean;
  video_minutes: number;
  video_creation: number;
  video_creation_rate: number;
  video_editing_rate: number | null;
}

interface CreatePlanModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function CreatePlanModal({ onClose, onSuccess }: CreatePlanModalProps) {
  const [newPlan, setNewPlan] = useState<Partial<Plan>>({
    plan_name: '',
    price: 0,
    avatars: 0,
    ai_cloning: 0,
    automations: false,
    ai_editing: false,
    video_minutes: 0,
    video_creation: 0,
    video_creation_rate: 0,
    video_editing_rate: null
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlan.plan_name || newPlan.price === undefined) {
      setError('Plan name and price are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: insertError } = await supabase
        .from('plans')
        .insert([newPlan]);

      if (insertError) throw insertError;
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating plan:', err);
      setError('Failed to create plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Create New Plan</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-300">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900 text-red-200 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300">
                Plan Name
              </label>
              <input
                type="text"
                value={newPlan.plan_name}
                onChange={(e) => setNewPlan({ ...newPlan, plan_name: e.target.value })}
                className="mt-1 w-full rounded-md bg-gray-700 border-gray-600 text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">
                Price
              </label>
              <input
                type="number"
                value={newPlan.price}
                onChange={(e) => setNewPlan({ ...newPlan, price: parseFloat(e.target.value) })}
                className="mt-1 w-full rounded-md bg-gray-700 border-gray-600 text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">
                Avatars (-1 for unlimited)
              </label>
              <input
                type="number"
                value={newPlan.avatars}
                onChange={(e) => setNewPlan({ ...newPlan, avatars: parseInt(e.target.value) })}
                className="mt-1 w-full rounded-md bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">
                AI Cloning (-1 for unlimited)
              </label>
              <input
                type="number"
                value={newPlan.ai_cloning}
                onChange={(e) => setNewPlan({ ...newPlan, ai_cloning: parseInt(e.target.value) })}
                className="mt-1 w-full rounded-md bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">
                Video Minutes
              </label>
              <input
                type="number"
                value={newPlan.video_minutes}
                onChange={(e) => setNewPlan({ ...newPlan, video_minutes: parseInt(e.target.value) })}
                className="mt-1 w-full rounded-md bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">
                Video Creation Limit
              </label>
              <input
                type="number"
                value={newPlan.video_creation}
                onChange={(e) => setNewPlan({ ...newPlan, video_creation: parseInt(e.target.value) })}
                className="mt-1 w-full rounded-md bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">
                Video Creation Rate
              </label>
              <input
                type="number"
                step="0.01"
                value={newPlan.video_creation_rate}
                onChange={(e) => setNewPlan({ ...newPlan, video_creation_rate: parseFloat(e.target.value) })}
                className="mt-1 w-full rounded-md bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">
                Video Editing Rate
              </label>
              <input
                type="number"
                step="0.01"
                value={newPlan.video_editing_rate || ''}
                onChange={(e) => setNewPlan({ ...newPlan, video_editing_rate: e.target.value ? parseFloat(e.target.value) : null })}
                className="mt-1 w-full rounded-md bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div className="col-span-2 space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={newPlan.automations}
                  onChange={(e) => setNewPlan({ ...newPlan, automations: e.target.checked })}
                  className="rounded bg-gray-700 border-gray-600 text-blue-600"
                />
                <label className="ml-2 text-sm font-medium text-gray-300">
                  Enable Automations
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={newPlan.ai_editing}
                  onChange={(e) => setNewPlan({ ...newPlan, ai_editing: e.target.checked })}
                  className="rounded bg-gray-700 border-gray-600 text-blue-600"
                />
                <label className="ml-2 text-sm font-medium text-gray-300">
                  Enable AI Editing
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-black rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PlansPanel() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('price');

      if (error) throw error;
      setPlans(data || []);
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError('Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlan = async (id: number, updates: Partial<Plan>) => {
    try {
      const { error } = await supabase
        .from('plans')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      setEditingPlan(null);
      await fetchPlans();
    } catch (err) {
      console.error('Error updating plan:', err);
      setError('Failed to update plan');
    }
  };

  const handleDeletePlan = async (id: number) => {
    const confirmed = window.confirm('Are you sure you want to delete this plan?');
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchPlans();
    } catch (err) {
      console.error('Error deleting plan:', err);
      setError('Failed to delete plan');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Plans Management</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-black rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Create Plan
        </button>
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
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Avatars
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    AI Cloning
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Video Minutes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Features
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {editingPlan?.id === plan.id ? (
                        <input
                          type="text"
                          value={editingPlan.plan_name}
                          onChange={(e) => setEditingPlan({
                            ...editingPlan,
                            plan_name: e.target.value
                          })}
                          className="bg-gray-700 text-white rounded px-2 py-1 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        plan.plan_name
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {editingPlan?.id === plan.id ? (
                        <input
                          type="number"
                          value={editingPlan.price}
                          onChange={(e) => setEditingPlan({
                            ...editingPlan,
                            price: parseFloat(e.target.value)
                          })}
                          className="bg-gray-700 text-white rounded px-2 py-1 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-24"
                        />
                      ) : (
                        `$${plan.price}`
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {editingPlan?.id === plan.id ? (
                        <input
                          type="number"
                          value={editingPlan.avatars}
                          onChange={(e) => setEditingPlan({
                            ...editingPlan,
                            avatars: parseInt(e.target.value)
                          })}
                          className="bg-gray-700 text-white rounded px-2 py-1 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-20"
                        />
                      ) : (
                        plan.avatars === -1 ? '∞' : plan.avatars
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {editingPlan?.id === plan.id ? (
                        <input
                          type="number"
                          value={editingPlan.ai_cloning}
                          onChange={(e) => setEditingPlan({
                            ...editingPlan,
                            ai_cloning: parseInt(e.target.value)
                          })}
                          className="bg-gray-700 text-white rounded px-2 py-1 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-20"
                        />
                      ) : (
                        plan.ai_cloning === -1 ? '∞' : plan.ai_cloning
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {editingPlan?.id === plan.id ? (
                        <input
                          type="number"
                          value={editingPlan.video_minutes}
                          onChange={(e) => setEditingPlan({
                            ...editingPlan,
                            video_minutes: parseInt(e.target.value)
                          })}
                          className="bg-gray-700 text-white rounded px-2 py-1 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-20"
                        />
                      ) : (
                        plan.video_minutes
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {editingPlan?.id === plan.id ? (
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editingPlan.automations}
                              onChange={(e) => setEditingPlan({
                                ...editingPlan,
                                automations: e.target.checked
                              })}
                              className="rounded bg-gray-700 border-gray-600 text-blue-600"
                            />
                            <span className="ml-2">Automations</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editingPlan.ai_editing}
                              onChange={(e) => setEditingPlan({
                                ...editingPlan,
                                ai_editing: e.target.checked
                              })}
                              className="rounded bg-gray-700 border-gray-600 text-blue-600"
                            />
                            <span className="ml-2">AI Editing</span>
                          </label>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className={`text-sm ${plan.automations ? 'text-green-400' : 'text-gray-500'}`}>
                            {plan.automations ? '✓' : '✗'} Automations
                          </div>
                          <div className={`text-sm ${plan.ai_editing ? 'text-green-400' : 'text-gray-500'}`}>
                            {plan.ai_editing ? '✓' : '✗'} AI Editing
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <div className="flex items-center gap-3">
                        {editingPlan?.id === plan.id ? (
                          <>
                            <button
                              onClick={() => handleUpdatePlan(plan.id, editingPlan)}
                              className="text-green-400 hover:text-green-300"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingPlan(null)}
                              className="text-gray-400 hover:text-gray-300"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingPlan(plan)}
                              className="text-blue-400 hover:text-blue-300"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeletePlan(plan.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              Delete
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

      {showCreateModal && (
        <CreatePlanModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchPlans();
          }}
        />
      )}
    </div>
  );
}