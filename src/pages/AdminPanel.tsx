import React, { useState } from 'react';
import { Users, Star, MessageSquare, Activity, CreditCard, Wrench, Webhook, Book } from 'lucide-react';
import UsersPanel from '../components/UsersPanel';
import InfluencersPanel from '../components/InfluencersPanel';
import SupportTicketsPanel from '../components/SupportTicketsPanel';
import UsagePanel from '../components/UsagePanel';
import PlansPanel from '../components/PlansPanel';
import ApisPanel from '../components/ApisPanel';
import TutorialsPanel from '../components/TutorialsPanel';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'users' | 'influencers' | 'tickets' | 'usage' | 'plans' | 'apis' | 'tutorials'>('users');

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 p-6">
        <h1 className="text-2xl font-bold text-white mb-8">Admin Panel</h1>
        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-3 w-full p-3 rounded-lg transition-colors ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Users size={20} />
            <span>Users</span>
          </button>
          <button
            onClick={() => setActiveTab('influencers')}
            className={`flex items-center gap-3 w-full p-3 rounded-lg transition-colors ${
              activeTab === 'influencers'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Star size={20} />
            <span>Influencers</span>
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`flex items-center gap-3 w-full p-3 rounded-lg transition-colors ${
              activeTab === 'tickets'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <MessageSquare size={20} />
            <span>Support Tickets</span>
          </button>
          <button
            onClick={() => setActiveTab('usage')}
            className={`flex items-center gap-3 w-full p-3 rounded-lg transition-colors ${
              activeTab === 'usage'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Activity size={20} />
            <span>Usage Management</span>
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`flex items-center gap-3 w-full p-3 rounded-lg transition-colors ${
              activeTab === 'plans'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <CreditCard size={20} />
            <span>Plans</span>
          </button>
          <button
            onClick={() => setActiveTab('apis')}
            className={`flex items-center gap-3 w-full p-3 rounded-lg transition-colors ${
              activeTab === 'apis'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Webhook size={20} />
            <span>APIs & Webhooks</span>
          </button>
          <button
            onClick={() => setActiveTab('tutorials')}
            className={`flex items-center gap-3 w-full p-3 rounded-lg transition-colors ${
              activeTab === 'tutorials'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Book size={20} />
            <span>Tutorials</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto">
        {activeTab === 'users' && <UsersPanel />}
        {activeTab === 'influencers' && <InfluencersPanel />}
        {activeTab === 'tickets' && <SupportTicketsPanel />}
        {activeTab === 'usage' && <UsagePanel />}
        {activeTab === 'plans' && <PlansPanel />}
        {activeTab === 'apis' && <ApisPanel />}
        {activeTab === 'tutorials' && <TutorialsPanel />}
      </div>
    </div>
  );
}