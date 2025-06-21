import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  Settings,
  Webhook,
  Languages,
  LogOut,
  Scissors,
  Users,
  Menu,
  X,
  Film,
  Book,
  Workflow,
  Mic,
  Code,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { usePlanLimits } from '../hooks/usePlanLimits';
import WebhookModal from './WebhookModal';

interface NavItem {
  icon?: any;
  label?: string;
  path?: string;
  onClick?: () => void;
  isSeparator?: boolean;
}

export default function FloatingSidebar() {
  const navigate = useNavigate();
  const { currentUser: user, clearCurrentUser } = useAuthStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const { automationsEnabled, loading: limitsLoading } = usePlanLimits();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);

  const handleLogout = () => {
    clearCurrentUser();
    navigate("/login");
  };

  const handleAutomationClick = () => {
    if (limitsLoading) return;
    if (!automationsEnabled) {
      // Show error toast or notification
      return;
    }
    setIsWebhookModalOpen(true);
  };

  const navItems: NavItem[] = [
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: Users, label: 'Influencers', path: '/influencers' },
    { icon: Film, label: 'Videos', path: '/videos' },
    { icon: Workflow, label: 'Automation', path: '/automation-builder' },
    { icon: Mic, label: 'Podcast Studio', path: '/podcast-studio' },
    { icon: Webhook, label: 'Automations', path: '/webhooks', onClick: handleAutomationClick },
    { isSeparator: true },
    { icon: Languages, label: 'Video Dubbing', path: '/video-dubbing' },
    { icon: Scissors, label: 'Video Editor', path: '/video-editor' },
    { isSeparator: true },
    { icon: Book, label: 'Tutorials', path: '/tutorials' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-[100] p-2 rounded-lg bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20 transition-colors"
      >
        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 100, 
          damping: 20,
          duration: 0.5
        }}
        className={`fixed z-[90] lg:left-2 lg:top-[10%] ${
          isMobileMenuOpen ? 'left-0 top-0' : '-left-full lg:left-2'
        }`}
      >
        <motion.div
          onHoverStart={() => !isMobileMenuOpen && setIsExpanded(true)}
          onHoverEnd={() => !isMobileMenuOpen && setIsExpanded(false)}
          className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.15)] overflow-hidden lg:h-[80vh] h-screen lg:rounded-2xl rounded-none"
          animate={{
            width: isExpanded ? 240 : 80,
          }}
          transition={{ 
            duration: 0.4,
            ease: [0.16, 1, 0.3, 1]
          }}
        >
          <div className="flex flex-col h-full">
            {/* Header section - fixed at top */}
            <div className="flex-shrink-0 py-6">
              {/* Logo and API Docs Button */}
              <div className="mb-6">
                <div className="flex items-center justify-center">
                  <motion.img
                    src="https://i.postimg.cc/YqZzTTR6/app.jpg"
                    alt="Logo"
                    className="w-8 h-8 rounded-lg"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                  />
                  
                  {/* API Docs Button - Only visible when expanded */}
                  <AnimatePresence>
                    {(isExpanded || isMobileMenuOpen) && (
                      <motion.button
                        onClick={() => {
                          navigate('/api-docs');
                          if (isMobileMenuOpen) setIsMobileMenuOpen(false);
                        }}
                        className="ml-3 flex justify-center items-center p-1.5 bg-green-700 hover:bg-green-600 rounded-lg transition-colors w-8 h-8"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        title="API Documentation"
                      >
                        <Code className="h-4 w-4 text-white" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {navItems.map((item, index) => (
                <React.Fragment key={item.label || `separator-${index}`}>
                  {item.isSeparator ? (
                    <div className="my-4 border-t border-white/10" />
                  ) : (
                    <motion.div
                      className="relative"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <button
                        onClick={() => {
                          item.onClick?.();
                          if (isMobileMenuOpen) setIsMobileMenuOpen(false);
                          if (item.path && !item.onClick) navigate(item.path);
                        }}
                        className="w-full flex items-center px-6 py-4 text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <item.icon className="h-5 w-5" />
                        <AnimatePresence>
                          {(isExpanded || isMobileMenuOpen) && (
                            <motion.span
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              className="ml-4 text-sm font-medium whitespace-nowrap"
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </button>
                    </motion.div>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Logout Button - fixed at bottom */}
            {user && (
              <div className="flex-shrink-0 border-t border-white/10 pt-4 pb-6">
                <motion.div
                  className="relative"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navItems.length * 0.1 }}
                >
                  <button
                    onClick={() => {
                      handleLogout();
                      if (isMobileMenuOpen) setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center px-6 py-4 text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <AnimatePresence>
                      {(isExpanded || isMobileMenuOpen) && (
                        <motion.span
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="ml-4 text-sm font-medium whitespace-nowrap"
                        >
                          Logout
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                </motion.div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Webhook Modal */}
      {isWebhookModalOpen && (
        <WebhookModal onClose={() => setIsWebhookModalOpen(false)} />
      )}
    </>
  );
} 