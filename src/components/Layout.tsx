import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { usePlanLimits } from '../hooks/usePlanLimits';
import GuidedTour from "./GuidedTour";
import HeyGenSetupModal from "./HeyGenSetupModal";
import WebhookModal from "./WebhookModal";
import { supabase } from "../lib/supabase";

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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center hover:opacity-90 transition-opacity"
            >
              <img
                src="https://i.ibb.co/BgtVKG9/LIMITED-TIME-FREE-ACCESS-5.png"
                alt="AI Influencer Logo"
                className="h-10 w-auto mr-3"
              />
              <h1 className="text-lg font-bold text-blue-600 hidden sm:block">
                The AI Influencer{" "}
              </h1>
              <div className="ml-3 min-w-[80px] h-[30px] flex items-center">
                {loading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-[#c9fffc]" />
                  </div>
                ) : planDetails && (
                  <div className="px-2 py-1 bg-blue-600 text-blue-100 text-sm font-medium rounded-full shadow-sm">
                    {planDetails.plan_name.charAt(0).toUpperCase() + planDetails.plan_name.slice(1)}
                  </div>
                )}
              </div>
            </button>

            {/* Hamburger Menu for Mobile */}
            <div className="sm:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>

            {/* Menu Items */}
            {user && hasPlan ? (
              <div className="hidden sm:flex items-center space-x-4">
                <button
                  onClick={handleAutomationClick}
                  data-tour="automations"
                  className={`inline-flex items-center px-3 py-2 text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700 focus:outline-none transition ${limitsLoading ? 'opacity-50 cursor-wait' : ''}`}
                >
                  {limitsLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Webhook className="h-4 w-4 mr-2" />
                      Automations
                    </>
                  )}
                </button>
                <button
                  onClick={() => navigate('/video-dubbing')}
                  className="inline-flex items-center px-3 py-2 text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700 focus:outline-none transition"
                >
                  <Languages className="h-4 w-4 mr-2" />
                  Video Dubbing
                </button>
                { user.email === "markofilipovic2003@gmail.com" && (
                <button
                  onClick={() => navigate('/video-editor')}
                  className="inline-flex items-center px-3 py-2 text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700 focus:outline-none transition"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Video Editor
                </button>)}
                <button
                  onClick={() => navigate('/tutorials')}
                  className="inline-flex items-center px-3 py-2 text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700 focus:outline-none transition"
                >
                  <Book className="h-4 w-4 mr-2" />
                  Tutorials
                </button>
                {user.email === "markofilipovic2003@gmail.com" && (
                  <button
                    data-tour="admin-panel"
                    onClick={handleAdminPanel}
                    className="inline-flex items-center px-3 py-2 text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700 focus:outline-none transition"
                  >
                    <MonitorDot className="h-4 w-4 mr-2" />
                    Admin Panel
                  </button>
                )}
                <button
                  data-tour="settings"
                  onClick={handleSettings}
                  className="inline-flex items-center px-3 py-2 text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700 focus:outline-none transition"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-3 py-2 text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700 focus:outline-none transition"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </button>
              </div>
            ) : user && (
              <div className="hidden sm:flex items-center space-x-4">
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-3 py-2 text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700 focus:outline-none transition"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && user && hasPlan && (
            <div className="sm:hidden fixed inset-0 bg-black bg-opacity-50 z-50">
              <div className="bg-[#1a1a1a] min-h-screen w-full p-6 flex flex-col">
                <div className="flex justify-between items-center mb-12">
                  <div className="flex items-center">
                    <img
                      src="https://i.ibb.co/BgtVKG9/LIMITED-TIME-FREE-ACCESS-5.png"
                      alt="AI Influencer Logo"
                      className="h-10 w-auto"
                    />
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                {hasPlan ? (
                  <>
                    <button
                      onClick={handleAutomationClick}
                      data-tour="automations"
                      className="flex items-center w-full px-6 py-4 text-lg text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
                    >
                      <Webhook className="h-4 w-4 mr-2 inline" />
                      Automations
                    </button>
                    <button
                      onClick={() => navigate('/tutorials')}
                      className="flex items-center w-full px-6 py-4 text-lg text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
                    >
                      <Book className="h-4 w-4 mr-2 inline" />
                      Tutorials
                    </button>
                    {user.email === "markofilipovic2003@gmail.com" && (
                      <button
                        onClick={handleAdminPanel}
                        data-tour="admin-panel"
                        className="flex items-center w-full px-6 py-4 text-lg text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
                      >
                        <MonitorDot className="h-4 w-4 mr-2 inline" />
                        Admin Panel
                      </button>
                    )}
                    <button
                      onClick={handleSettings}
                      className="flex items-center w-full px-6 py-4 text-lg text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
                    >
                      <Settings className="h-4 w-4 mr-2 inline" />
                      Settings
                    </button>
                  </>
                ) : null}
                <div className="mt-auto pt-6 border-t border-gray-800">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-6 py-4 text-lg text-red-400 hover:text-red-300 hover:bg-gray-800 rounded-lg transition-all duration-200"
                  >
                    <LogOut className="h-4 w-4 mr-2 inline" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
          {isMobileMenuOpen && user && !hasPlan && (
            <div className="sm:hidden fixed inset-0 bg-black bg-opacity-50 z-50">
              <div className="bg-[#1a1a1a] min-h-screen w-full p-6 flex flex-col">
                <div className="flex justify-between items-center mb-12">
                  <div className="flex items-center">
                    <img
                      src="https://i.ibb.co/BgtVKG9/LIMITED-TIME-FREE-ACCESS-5.png"
                      alt="AI Influencer Logo"
                      className="h-10 w-auto"
                    />
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="mt-auto pt-6 border-t border-gray-800">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-6 py-4 text-lg text-red-400 hover:text-red-300 hover:bg-gray-800 rounded-lg transition-all duration-200"
                  >
                    <LogOut className="h-4 w-4 mr-2 inline" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 px-4">
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