import React from 'react';
import { MessageSquare, X, Send, Loader2, Bug, HelpCircle, Wand2, FileQuestion, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import OpenAI from 'openai';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface HighlightInfo {
  selector: string;
  message: string;
}

interface NavigationInfo {
  path: string;
  highlight?: HighlightInfo | null;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ConversationStarter {
  icon: React.ReactNode;
  text: string;
  prompt: string;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: "Hey, I'm Casper, the friendly ghost... No i am an AI Assistant here to help you navigate the app. How can I assist you today?"
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTicketButton, setShowTicketButton] = useState(false);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [isBugReport, setIsBugReport] = useState(false);
  const [isGeneralQuestion, setIsGeneralQuestion] = useState(false);
  const [showBackButton, setShowBackButton] = useState(false);
  const [hasBugIntent, setHasBugIntent] = useState(false);
  const [showNavigationButton, setShowNavigationButton] = useState<{
    destination: string;
    highlight: HighlightInfo | null;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeHighlight, setActiveHighlight] = useState<HighlightInfo | null>(null);
  const { currentUser: user } = useAuthStore();

  // Navigation mappings with highlight information
  const navigationGuides: Record<string, NavigationInfo> = {
    'automations_create': {
      path: '/dashboard',
      highlight: {
        selector: '[data-tour="automations"]',
        message: 'Click here to open automations. The Create New button will appear to set up your automation.'
      }
    },
    'dashboard': {
      path: '/dashboard',
      highlight: {
        selector: '[data-tour="headset"]',
        message: 'Click here to create an AI influencer - choose between instant generation or professional voice cloning'
      }
    },
    'videos': {
      path: '/dashboard',
      highlight: {
        selector: '[data-tour="videos-button"]',
        message: 'Click the Videos button to view and manage all videos for this influencer'
      }
    },
    'looks': {
      path: '/dashboard',
      highlight: {
        selector: '[data-tour="looks-button"]',
        message: 'Click the Looks button to manage different appearances for your influencer'
      }
    },
    'record': {
      path: '/dashboard',
      highlight: {
        selector: '[data-tour="record-button"]',
        message: 'Click the Record button to create a new video with this influencer'
      }
    },
    'settings': {
      path: '/settings',
      highlight: {
        selector: '[data-tour="settings"]',
        message: 'Here you can manage your API keys and account settings'
      }
    },
    'planner': {
      path: '/planner',
      highlight: {
        selector: '[data-tour="calendar"]',
        message: 'Use the content planner to create multiple videos at once'
      }
    },
    'automations': {
      path: '/dashboard',
      highlight: {
        selector: '[data-tour="automations"]',
        message: 'Access your automation settings to integrate with external services'
      }
    },
    'content': {
      path: '/dashboard',
      highlight: {
        selector: '[data-tour="content-button"]',
        message: 'Click here to manage and create videos for your influencer'
      }
    }
  };

  // Handle highlight cleanup
  useEffect(() => {
    if (activeHighlight) {
      const element = document.querySelector(activeHighlight.selector);
      if (element) {
        // Scroll element into view when highlight is added
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });

        element.classList.add(
          'ring-4',
          'ring-[#c9fffc]',
          'ring-opacity-100',
          'animate-pulse',
          'z-[60]'
        );
      }
      
      return () => {
        if (element) {
          element.classList.remove(
            'ring-4',
            'ring-[#c9fffc]',
            'ring-opacity-100',
            'animate-pulse',
            'z-[60]'
          );
        }
      };
    }
  }, [activeHighlight]);
  const conversationStarters: ConversationStarter[] = [
    {
      icon: <Bug className="h-5 w-5" />,
      text: "Report a Bug",
      prompt: "I'd like to report a bug I encountered in the app."
    },
    {
      icon: <Wand2 className="h-5 w-5" />,
      text: "AI Avatar Help",
      prompt: "How do I create an AI avatar or clone my voice?"
    },
    {
      icon: <HelpCircle className="h-5 w-5" />,
      text: "App Navigation",
      prompt: "Can you help me navigate through the app's features?"
    },
    {
      icon: <FileQuestion className="h-5 w-5" />,
      text: "Feature Request",
      prompt: "I have some general questions about the platform."
    }
  ];

  // ... (keep existing systemPrompt)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Show ticket button after 3 messages from user
    const userMessageCount = messages.filter(m => m.role === 'user').length;
    if ((userMessageCount >= 1 && hasBugIntent) || isBugReport || isGeneralQuestion) {
      setShowTicketButton(true);
    }
  }, [messages, isBugReport, hasBugIntent, isGeneralQuestion]);

  const systemPrompt = `You are Casper, an AI assistant for the AI Influencer platform. You can help users navigate the app and explain features.

  When users ask about specific features, you should:
  1. Provide a clear explanation
  2. Guide them to the relevant page
  3. Explain how to use the feature

  Navigation commands you can use (use exactly these phrases):
  - NAVIGATE_TO: dashboard
  - NAVIGATE_TO: settings
  - NAVIGATE_TO: planner
  - NAVIGATE_TO: automations
  - NAVIGATE_TO: automations_create
  - NAVIGATE_TO: content
  - NAVIGATE_TO: videos
  - NAVIGATE_TO: looks
  - NAVIGATE_TO: record

  Key features to explain:
  1. Creating AI Avatars:
     - Explain there are two options:
       a) Generate custom AI avatar using our advanced AI system
       b) Schedule a call for professional AI voice cloning
     - Direct them to click the "+" button on dashboard
     - Mention voice customization options

  2. Content Creation:
     - Explain they can create individual videos or use bulk creation
     - Direct them to the content page for single videos
     - Mention the planner for bulk content creation
     - Each influencer card has three main actions:
       a) Videos: View and manage all videos
       b) Looks: Manage different appearances
       c) Record: Create a new video

  3. Automations:
     - Explain webhook functionality for integration
     - Direct them to the automations panel in the layout
     - Two types of automations:
       1. Incoming Webhooks:
          - Create videos programmatically via API
          - Perfect for integrating with your existing tools
          - Automatically generate videos based on your data
       2. Outgoing Automations:
          - Get notified when videos are completed
          - Send video data to your systems
          - Trigger workflows when videos are ready
     - Both types can be created from the Create New button in automations

  Example responses:

  If user asks about creating an influencer:
  "You have two options for creating an AI influencer:
  1. Generate a custom AI avatar using our advanced AI system - this lets you customize appearance and voice
  2. Schedule a call with our team for professional AI voice cloning

  NAVIGATE_TO: dashboard
  
  On the dashboard, click the + button to start. You can choose between generating an avatar instantly or scheduling a call for voice cloning."

  If user asks about content creation:
  "You can create content in two ways:
  1. Individual videos through the content page
  2. Bulk creation using our content planner

  NAVIGATE_TO: content
  
  Click the Content button on any influencer card to start creating videos. For bulk creation, use the calendar icon in the top right."

  If user asks about automations:
  "Our automation system lets you integrate with external services using webhooks.
  
  NAVIGATE_TO: automations
  
  You can set up:
  1. Incoming webhooks to create videos via API
  2. Outgoing webhooks to get notifications when videos are ready"

  Keep responses friendly and helpful. Always offer to explain more if needed.`;

  const handleNavigation = (response: string) => {
    const navigationMatch = response.match(/NAVIGATE_TO: ([\w-]+)/);
    if (navigationMatch) {
      const destination = navigationMatch[1];
      const cleanResponse = response.replace(/NAVIGATE_TO: [\w-]+/, '').trim();
      
      setMessages(prev => [...prev, { role: 'assistant', content: cleanResponse }]);
      
      // Show navigation button
      setShowNavigationButton({
        destination,
        highlight: navigationGuides[destination]?.highlight || null
      });

      return;
    }
    
    // If no navigation, just add the message
    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
  };

  const handleNavigationClick = () => {
    if (!showNavigationButton) return;

    const { destination, highlight } = showNavigationButton;
    const path = navigationGuides[destination]?.path || `/${destination}`;

    setIsOpen(false);
    setShowNavigationButton(null);

    navigate(path);

    // Helper function to scroll element into view
    const scrollToElement = (selector: string) => {
      const element = document.querySelector(selector);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    if (destination === 'automations_create') {
      setTimeout(() => {
        const automationsButton = document.querySelector('[data-tour="automations"]');
        if (automationsButton instanceof HTMLElement) {
          scrollToElement('[data-tour="automations"]');
          automationsButton.click();
        }
        if (highlight) {
          setActiveHighlight(highlight);
          setIsOpen(true);
        }
      }, 500);
      return;
    }

    setTimeout(() => {
      if (highlight) {
        scrollToElement(highlight.selector);
        setActiveHighlight(highlight);
        setIsOpen(true);
      }
    }, 500);
  };

  const checkBugIntent = (message: string) => {
    const bugKeywords = [
      'bug', 'issue', 'problem', 'error', 'broken', 'not working',
      'doesn\'t work', 'failed', 'crash', 'glitch', 'malfunction'
    ];
    
    const lowercaseMessage = message.toLowerCase();
    return bugKeywords.some(keyword => lowercaseMessage.includes(keyword));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user?.openaiApiKey) return;

    // For bug reports or general questions, format the message nicely
    if ((isBugReport || isGeneralQuestion) && messages.length > 2) {
      setMessages(prev => [...prev, { role: 'user', content: input.trim() }]);
      setInput('');
      return;
    }
    
    // Initial message for bug report or general question
    if (isBugReport || isGeneralQuestion) {
      setMessages(prev => [...prev, 
        { role: 'user', content: input.trim() },
        { role: 'assistant', content: isBugReport 
          ? "Thank you for reporting this bug. Could you please provide any additional details or steps to reproduce the issue?"
          : "Thank you for your question. Could you please provide more details about what you'd like to know?" }
      ]);
      setInput('');
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    // Check for bug intent in user message
    if (checkBugIntent(userMessage)) {
      setHasBugIntent(true);
    }
    
    setIsLoading(true);

    try {
      const openai = new OpenAI({
        apiKey: user.openaiApiKey,
        dangerouslyAllowBrowser: true
      });

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map(m => ({ role: m.role, content: m.content })),
          { role: "user", content: userMessage }
        ],
        temperature: 0.7,
      });

      const assistantMessage = response.choices[0]?.message?.content || 'I apologize, but I cannot provide a response at this time.';
      handleNavigation(assistantMessage);
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'I apologize, but I encountered an error. Please try again later.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStarterClick = (prompt: string) => {
    if (prompt === "I'd like to report a bug I encountered in the app.") {
      setIsBugReport(true);
      setIsGeneralQuestion(false);
      setShowBackButton(true);
      setInput("");
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Please describe the bug you encountered and any steps to reproduce it:"
      }]);
      return;
    } else if (prompt === "I have some general questions about the platform.") {
      setIsGeneralQuestion(true);
      setIsBugReport(false);
      setShowBackButton(true);
      setInput("");
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Please explain what you'd like to know about the platform:"
      }]);
      return;
    }
    setInput(prompt);
  };

  const handleBackToChat = () => {
    setIsBugReport(false);
    setIsGeneralQuestion(false);
    setShowBackButton(false);
    setShowTicketButton(false);
    setMessages([{
      role: 'assistant',
      content: "Hey, I'm Casper, the friendly ghost... No i am an AI Assistant here to help you navigate the app. How can I assist you today?"
    }]);
  };
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchWebhookUrl();
  }, []);

  const fetchWebhookUrl = async () => {
    try {
      const { data, error } = await supabase
        .from('support_webhook')
        .select('url')
        .single();

      if (error) throw error;
      if (data) {
        setWebhookUrl(data.url);
      }
    } catch (err) {
      console.error('Error fetching webhook URL:', err);
    }
  };

  const handleCreateTicket = async () => {
    if (!user) return;
    
    setIsCreatingTicket(true);
    try {
      // Create support ticket
      const { error } = await supabase
        .from('support_tickets')
        .insert([
          {
            user_id: user.id,
            conversation: messages,
            status: 'open'
          }
        ]);

      if (error) throw error;

      // Send webhook notification through backend if URL is configured
      if (webhookUrl) {
        try {
          await fetch(`${import.meta.env.VITE_BACKEND_URL}/submitsupportticket`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              user_email: user.email,
              conversation: messages,
              webhook_url: webhookUrl,
              created_at: new Date().toISOString()
            })
          });
        } catch (webhookError) {
          console.error('Failed to send webhook:', webhookError);
          // Continue with success message even if webhook fails
        }
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Support ticket created successfully! Our team will review your conversation and get back to you soon.'
      }]);
      setShowTicketButton(false);
    } catch (err) {
      console.error('Error creating ticket:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, there was an error creating your support ticket. Please try again later.'
      }]);
    } finally {
      setIsCreatingTicket(false);
    }
  };

  if (!user) return null;

  return (
    <>
      {!isOpen && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          data-tour="chatbot"
          className="fixed bottom-4 right-4 bg-[#4DE0F9]/20 text-white rounded-full p-3 shadow-[0_0_20px_rgba(77,224,249,0.3)] hover:shadow-[0_0_30px_rgba(77,224,249,0.4)] transition-all duration-200 border border-white/20 backdrop-blur-sm"
        >
          <MessageSquare className="h-6 w-6" />
        </motion.button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed bottom-4 right-4 w-96 bg-white/5 backdrop-blur-xl rounded-2xl shadow-[0_0_30px_rgba(77,224,249,0.2)] z-50 border border-white/20 hover:border-[#4DE0F9]/40 transition-all duration-200 ${activeHighlight ? 'hidden' : ''}`}
          >
            <div className="flex justify-between items-center p-4 bg-[#4DE0F9]/20 rounded-t-2xl border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="h-2 w-2 rounded-full bg-[#4DE0F9] animate-pulse" />
                  <div className="absolute inset-0 h-2 w-2 rounded-full bg-[#4DE0F9] animate-ping" />
                </div>
                <h3 className="font-medium text-white">Casper - AI Support</h3>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </motion.button>
            </div>

            <div className="h-96 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="relative"
                    >
                      <img
                        src="https://i.ibb.co/BgtVKG9/LIMITED-TIME-FREE-ACCESS-5.png"
                        alt="AI Assistant"
                        className="h-8 w-8 rounded-full mr-2 object-cover ring-2 ring-[#4DE0F9]/20"
                      />
                      <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[#4DE0F9] animate-pulse" />
                    </motion.div>
                  )}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={`max-w-[80%] rounded-2xl p-3 whitespace-pre-wrap ${
                      message.role === 'user'
                        ? 'bg-[#4DE0F9]/20 text-white'
                        : 'bg-white/10 text-white border border-white/10'
                    }`}
                  >
                    {message.content}
                  </motion.div>
                </motion.div>
              ))}

              {showNavigationButton && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center my-4"
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNavigationClick}
                    className="flex items-center gap-2 px-4 py-2 bg-[#4DE0F9]/20 text-white rounded-full hover:bg-[#4DE0F9]/30 transition-all duration-200 border border-white/10"
                  >
                    <ChevronRight className="h-4 w-4" />
                    Show me how
                  </motion.button>
                </motion.div>
              )}

              {messages.length === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-2 gap-2 mt-4"
                >
                  {conversationStarters.map((starter, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleStarterClick(starter.prompt)}
                      className="flex items-center gap-2 p-3 text-sm text-white bg-white/10 rounded-xl hover:bg-white/20 transition-all duration-200 border border-white/10"
                    >
                      {starter.icon}
                      <span>{starter.text}</span>
                    </motion.button>
                  ))}
                </motion.div>
              )}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <img
                    src="https://i.ibb.co/BgtVKG9/LIMITED-TIME-FREE-ACCESS-5.png"
                    alt="AI Assistant"
                    className="h-8 w-8 rounded-full mr-2 object-cover ring-2 ring-[#4DE0F9]/20"
                  />
                  <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                    <Loader2 className="h-5 w-5 animate-spin text-[#4DE0F9]" />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {showTicketButton && (
              <div className="px-4 py-2 border-t border-white/10">
                <div className="flex flex-col gap-2">
                  {showBackButton && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleBackToChat}
                      className="w-full py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-200 border border-white/10"
                    >
                      Back to Chat
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreateTicket}
                    disabled={isCreatingTicket}
                    className="w-full py-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-all duration-200 border border-red-500/20 flex items-center justify-center gap-2 mt-2"
                  >
                    {isCreatingTicket ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Creating Ticket...
                      </>
                    ) : (
                      <>
                        <Bug className="h-5 w-5" />
                        {isBugReport ? 'Submit Bug Report' : 'Submit Feature Request'}
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="border-t border-white/10 p-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    isBugReport ? "Describe your bug here..." :
                    isGeneralQuestion ? "Explain your feature here..." :
                    "Ask me anything about the app..."
                  }
                  className="flex-1 bg-white/10 text-white rounded-full px-4 py-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#4DE0F9]/40 placeholder:text-white/40 transition-all duration-200"
                />
                {!isBugReport && !isGeneralQuestion && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="bg-[#4DE0F9]/20 text-white rounded-full p-2 hover:bg-[#4DE0F9]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 border border-white/10"
                  >
                    <Send className="h-5 w-5" />
                  </motion.button>
                )}
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {activeHighlight && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[59]"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-[0_0_30px_rgba(77,224,249,0.2)] z-[61] max-w-md w-full text-center border border-white/20"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="flex flex-col items-center gap-6">
              <p className="text-white text-lg">{activeHighlight.message}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setActiveHighlight(null);
                  setIsOpen(true);
                }}
                className="px-6 py-3 bg-[#4DE0F9]/20 text-white rounded-full hover:bg-[#4DE0F9]/30 transition-all duration-200 border border-white/10"
              >
                Got it!
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}