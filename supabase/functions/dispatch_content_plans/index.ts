import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

interface ContentPlan {
  id: string;
  user_id: string;
  influencer_id: string;
  look_id: string;
  prompt: string;
  title: string | null;
  starts_at: string;
  rrule: string | null;
  status: "scheduled" | "processing" | "completed" | "failed";
  last_run_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    console.log("Starting content plan dispatch...");

    // 1. Claim due jobs (max 20 per run)
    const { data: plans, error } = await supabase.rpc("claim_due_content_plans", { limit_n: 20 });
    
    if (error) {
      console.error("Error claiming content plans:", error);
      throw error;
    }

    const claimedPlans = plans as ContentPlan[];
    console.log(`Claimed ${claimedPlans.length} content plans for processing`);

    // Process each claimed plan
    const results = [];
    for (const plan of claimedPlans) {
      try {
        console.log(`Processing plan ${plan.id}: ${plan.title || 'Untitled'}`);

        // 2. Kick off render on your backend / HeyGen wrapper
        const backendUrl = Deno.env.get("BACKEND_URL");
        if (!backendUrl) {
          throw new Error("BACKEND_URL environment variable not set");
        }

        const resp = await fetch(`${backendUrl}/generate-video`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("BACKEND_API_KEY") || ""}`
          },
          body: JSON.stringify({ 
            planId: plan.id,
            influencerId: plan.influencer_id,
            lookId: plan.look_id,
            prompt: plan.prompt,
            title: plan.title,
            userId: plan.user_id
          })
        });

        if (!resp.ok) {
          const errorText = await resp.text();
          throw new Error(`Backend request failed: ${resp.status} - ${errorText}`);
        }

        const response = await resp.json();
        console.log(`Successfully dispatched plan ${plan.id}:`, response);

        // 3. Mark success & advance recurrence
        const { error: completeError } = await supabase.rpc("mark_plan_completed", { p_id: plan.id });
        if (completeError) {
          console.error(`Error marking plan ${plan.id} as completed:`, completeError);
          throw completeError;
        }

        results.push({
          planId: plan.id,
          status: "success",
          message: "Successfully dispatched and marked completed"
        });

      } catch (e) {
        console.error(`Error processing plan ${plan.id}:`, e);
        
        // Mark as failed with error message
        const { error: failError } = await supabase.rpc("mark_plan_failed", {
          p_id: plan.id,
          p_msg: `Dispatch failed: ${e.message || String(e)}`
        });

        if (failError) {
          console.error(`Error marking plan ${plan.id} as failed:`, failError);
        }

        results.push({
          planId: plan.id,
          status: "failed",
          message: e.message || String(e)
        });
      }
    }

    const successCount = results.filter(r => r.status === "success").length;
    const failureCount = results.filter(r => r.status === "failed").length;

    console.log(`Dispatch completed: ${successCount} successful, ${failureCount} failed`);

    return new Response(
      JSON.stringify({
        processed: claimedPlans.length,
        successful: successCount,
        failed: failureCount,
        results: results
      }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 200
      }
    );

  } catch (error) {
    console.error("Fatal error in dispatch function:", error);
    
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message || String(error)
      }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 500
      }
    );
  }
}); 