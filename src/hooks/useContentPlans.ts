import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { ContentPlan, ContentPlanRealtimePayload, ContentPlanStatusSummary } from "../types/contentPlan";

export interface UseContentPlansOptions {
  userId: string;
  from?: string;
  to?: string;
  status?: string;
  autoRefresh?: boolean;
}

export interface UseContentPlansReturn {
  data: ContentPlan[] | null;
  loading: boolean;
  error: string | null;
  statusSummary: ContentPlanStatusSummary[] | null;
  refetch: () => Promise<void>;
}

export function useContentPlans(options: UseContentPlansOptions): UseContentPlansReturn {
  const { userId, from, to, status, autoRefresh = true } = options;
  
  const [data, setData] = useState<ContentPlan[] | null>(null);
  const [statusSummary, setStatusSummary] = useState<ContentPlanStatusSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContentPlans = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query
      let query = supabase
        .from("content_plans")
        .select("*")
        .eq("user_id", userId)
        .order("starts_at", { ascending: true });

      // Add date range filters
      if (from) {
        query = query.gte("starts_at", from);
      }
      if (to) {
        query = query.lte("starts_at", to);
      }
      if (status) {
        query = query.eq("status", status);
      }

      const { data: plans, error: plansError } = await query;

      if (plansError) {
        throw plansError;
      }

      setData(plans || []);

      // Also fetch status summary
      const { data: summary, error: summaryError } = await supabase.rpc("get_content_plans_by_status");
      
      if (summaryError) {
        console.warn("Failed to fetch status summary:", summaryError);
      } else {
        setStatusSummary(summary || []);
      }

    } catch (err) {
      console.error("Error fetching content plans:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch content plans");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchContentPlans();
  }, [userId, from, to, status]);

  // Real-time subscription
  useEffect(() => {
    if (!autoRefresh) return;

    const channel = supabase
      .channel("content_plans_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "content_plans",
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log("Content plan real-time update:", payload);
          
          // Optimistic update for better UX
          if (payload.eventType === "INSERT" && payload.new) {
            setData(prev => prev ? [...prev, payload.new as ContentPlan] : [payload.new as ContentPlan]);
          } else if (payload.eventType === "UPDATE" && payload.new) {
            setData(prev => prev ? prev.map(plan => 
              plan.id === payload.new!.id ? payload.new as ContentPlan : plan
            ) : null);
          } else if (payload.eventType === "DELETE" && payload.old) {
            setData(prev => prev ? prev.filter(plan => plan.id !== payload.old!.id) : null);
          }

          // Refetch status summary after any change
          fetchContentPlans();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, autoRefresh]);

  const refetch = async () => {
    await fetchContentPlans();
  };

  return {
    data,
    loading,
    error,
    statusSummary,
    refetch
  };
}

// Hook for monitoring scheduler health
export function useSchedulerStatus() {
  const [statusSummary, setStatusSummary] = useState<ContentPlanStatusSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: statusError } = await supabase.rpc("get_content_plans_by_status");
      
      if (statusError) {
        throw statusError;
      }

      setStatusSummary(data || []);
    } catch (err) {
      console.error("Error fetching scheduler status:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch scheduler status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    statusSummary,
    loading,
    error,
    refetch: fetchStatus
  };
} 