import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut,
  Settings,
  Book,
  Video,
  HelpCircle,
  Webhook,
  Languages,
  Loader2,
  Menu,
  X,
  MonitorDot,
  ChevronDown,
  User,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { usePlanLimits } from '../hooks/usePlanLimits';
import GuidedTour from "./GuidedTour";
import HeyGenSetupModal from "./HeyGenSetupModal";
import WebhookModal from "./WebhookModal";
import { supabase } from "../lib/supabase";
import FloatingSidebar from "./FloatingSidebar";

interface LayoutProps {
  hasPlan?: boolean;
}

export default function Layout({ hasPlan }: LayoutProps) {
  const navigate = useNavigate();
  const { currentUser: user, clearCurrentUser } = useAuthStore();
  const [showGuide, setShowGuide] = useState(false);
  const [showHeyGenSetup, setShowHeyGenSetup] = useState(false);
  const [showWebhooks, setShowWebhooks] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userPlan, setUserPlan] = useState("");
  const [showAutomationError, setShowAutomationError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [planDetails, setPlanDetails] = useState<{plan_name: string} | null>(null);
  const { automationsEnabled, loading: limitsLoading } = usePlanLimits();
  const [showLabsDropdown, setShowLabsDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const handleLogout = () => {
    clearCurrentUser();
    navigate("/login");
  };

  const handleAutomationClick = () => {
    if (limitsLoading) return; // Don't do anything while loading
    
    if (!automationsEnabled) {
      setShowAutomationError(true);
      setTimeout(() => setShowAutomationError(false), 3000);
      return;
    }
    
    setShowWebhooks(true);
  };

  const handleSettings = () => {
    navigate("/settings");
  };

  const handleAdminPanel = () => {
    navigate("/admin-panel");
  };

  useEffect(() => {
    const fetchUserPlan = async () => {
      setLoading(true);
      try {
        const session = await supabase.auth.getSession();

        if (session?.data?.session?.user?.email) {
          const email = session.data.session.user.email.trim();

          const { data, error } = await supabase
            .from("users")
            .select("current_plan") // Only fetch the current_plan column
            .eq("email", email) // Match the trimmed email
            .single();

          if (error) {
            console.error("Error fetching user data:", error);
          } else {
            // Fetch plan details using the current_plan id
            if (data?.current_plan) {
              const { data: planData, error: planError } = await supabase
                .from("plans")
                .select("plan_name")
                .eq("id", data.current_plan)
                .single();
                console.log(planData)
              
              if (planError) {
                console.error("Error fetching plan details:", planError);
              } else if (planData) {
                setPlanDetails(planData);
                setUserPlan(planData.plan_name);
              }
            }
          }
        }
      } catch (err) {
        console.error("Error in fetchUserPlan:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPlan();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Animated Particles */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`
          }}
        />
      ))}

      {/* Floating Sidebar */}
      <FloatingSidebar />

      {/* Main Content */}
      <main className="pt-16 lg:pt-0 lg:pl-[120px]">
        <Outlet />
      </main>

      {showGuide && <GuidedTour onClose={() => setShowGuide(false)} />}
      {showHeyGenSetup && (
        <HeyGenSetupModal onClose={() => setShowHeyGenSetup(false)} />
      )}
      {showAutomationError && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in">
          Automations are not available on your current plan. Please upgrade to access this feature.
        </div>
      )}
      {showWebhooks && <WebhookModal onClose={() => setShowWebhooks(false)} />}
    </div>
  );
}