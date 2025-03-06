import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

interface PlanLimits {
  avatars: number;
  avatarsUsed: number;
  aiCloning: number;
  aiCloningUsed: number;
  automationsEnabled: boolean;
  videoMinutes: number;
  videoMinutesUsed: number;
  loading: boolean;
  error: string | null;
}

export function usePlanLimits() {
  const [limits, setLimits] = useState<PlanLimits>({
    avatars: 0,
    avatarsUsed: 0,
    aiCloning: 0,
    aiCloningUsed: 0,
    automationsEnabled: false,
    videoMinutes: 0,
    videoMinutesUsed: 0,
    loading: true,
    error: null
  });
  const { currentUser } = useAuthStore();

  useEffect(() => {
    const fetchLimits = async () => {
      if (!currentUser?.email) return;

      try {
        // First get the user's current plan
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select(`
            current_plan,
            tier,
            total_bonus_minutes
          `)
          .eq('email', currentUser.email)
          .single();

          console.log("User + Plan", userData)

        if (userError) throw userError;

        if (userData?.current_plan) {
          // Get plan details
          const { data: planData, error: planError } = await supabase
            .from('plans')
            .select('avatars, ai_cloning, automations, video_minutes')
            .eq('id', userData.current_plan)
            .single();
          console.log("Plans Data: ",planData);
          if (planError) throw planError;

          // Get user usage
          const { data: usageData, error: usageError } = await supabase
            .from('user_usage')
            .select('avatars_created, ai_clone_created, automation, videos_created, video_minutes_used')
            .eq('user_id', currentUser.id)
            .single();
            console.log("User Usage Data: ",usageData);

          if (usageError) throw usageError;

          if (planData && usageData) {
            // Parse the avatar limit - handle both string and JSON formats
            let avatarLimit = 0;
            try {
              // Handle direct number value first
              if (planData.avatars === "-1") {
                avatarLimit = -1;
              } else {
                // Try parsing as JSON if it's not -1
                try {
                  const parsed = JSON.parse(planData.avatars);
                  avatarLimit = parsed.limit || parseInt(parsed) || 0;
                } catch {
                  // If JSON parsing fails, try direct string parsing
                  avatarLimit = parseInt(planData.avatars) || 0;
                }
              }
            } catch {
              // If JSON parsing fails, try direct string parsing
              avatarLimit = parseInt(planData.avatars) || 0;
            }

            // Parse Ai Cloning Limit
            let aiCloningLimit = 0;
            try {
              // Handle direct number value first
              if (planData.ai_cloning === "-1") {
                aiCloningLimit = -1;
              } else {
                // Try parsing as JSON if it's not -1
                try {
                  const parsed = JSON.parse(planData.ai_cloning);
                  aiCloningLimit = parsed.limit || parseInt(parsed) || 0;
                } catch {
                  // If JSON parsing fails, try direct string parsing
                  aiCloningLimit = parseInt(planData.ai_cloning) || 0;
                }
              }
            } catch {
              // If JSON parsing fails, try direct string parsing
              aiCloningLimit = parseInt(planData.ai_cloning) || 0;
            }

            // Parse Automations Limit
            let automationsEnabled = false;
            try {
              // First try parsing as JSON
              const parsed = JSON.parse(planData.automations);
              automationsEnabled = parsed || false
            } catch {
              // If JSON parsing fails, try direct string parsing
              automationsEnabled = false;
            }

            // Parse the video minutes limit
            let videoMinutesLimit = 0;
            try {
              videoMinutesLimit = planData.video_minutes + userData.total_bonus_minutes || 0;
            } catch {
              videoMinutesLimit = 0;
            }
              console.log("Video Minutes: ",videoMinutesLimit,"/",usageData.video_minutes_used);
            
            setLimits({
              avatars: avatarLimit,
              avatarsUsed: usageData.avatars_created,
              aiCloning: aiCloningLimit,
              aiCloningUsed: usageData.ai_clone_created,
              automationsEnabled: automationsEnabled,
              videoMinutes: videoMinutesLimit,
              videoMinutesUsed: parseInt(usageData.video_minutes_used) || 0,
              loading: false,
              error: null
            });
          }
        }
      } catch (err) {
        console.error('Error fetching plan limits:', err);
        setLimits(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to fetch plan limits'
        }));
      }
    };

    fetchLimits();
  }, [currentUser?.email, currentUser?.id]);

  return limits;
}