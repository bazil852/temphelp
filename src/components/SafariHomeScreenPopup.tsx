import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export default function SafariHomeScreenPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const { currentUser } = useAuthStore();

  useEffect(() => {
    const checkUserAndBrowser = async () => {
      if (!currentUser) return;

      // Check if user is on Safari mobile
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      const isMobile = /iPhone|iPad|iPod/i.test(navigator.userAgent);

      if (!isSafari || !isMobile) return;

      // Check user's added_app status
      const { data, error } = await supabase
        .from('users')
        .select('added_app')
        .eq('auth_user_id', currentUser.id)
        .single();

      if (error) {
        console.error('Error checking added_app status:', error);
        return;
      }

      if (data.added_app === null || data.added_app === false) {
        setIsVisible(true);
      }
    };

    checkUserAndBrowser();
  }, [currentUser]);

  const handleClose = async () => {
    if (!currentUser) return;

    try {
      // Update user's added_app status
      await supabase
        .from('users')
        .update({ added_app: true })
        .eq('auth_user_id', currentUser.id);
    } catch (error) {
      console.error('Error updating added_app status:', error);
    }

    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-sm w-full p-6 relative">
        <button 
          onClick={handleClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <img
            src="https://i.ibb.co/BgtVKG9/LIMITED-TIME-FREE-ACCESS-5.png"
            alt="App Logo"
            className="w-16 h-16 mb-4"
          />
          
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            AI Influencer to Home Screen
          </h2>

          <div className="space-y-6 w-full">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Step 1: Click on share below</p>
              <img
                src="https://i.postimg.cc/kgJyFZ4m/Group-1-3.png"
                alt="Step 1"
                className="w-full rounded-lg shadow-md"
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Step 2: Click "Add to Home Screen"</p>
              <img
                src="https://i.postimg.cc/XvhcWYgj/Group-2.png"
                alt="Step 2"
                className="w-full rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}