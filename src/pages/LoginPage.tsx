import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, useAnimationControls } from 'framer-motion';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser, resetPassword } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  useEffect(() => {
    if (searchParams.get('confirmed') === 'true') {
      setSuccess('Email confirmed successfully! You can now log in.');
    } else if (searchParams.get('error') === 'true') {
      setError('There was an error confirming your email. Please try again or contact support.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const result = await setUser(email, password, isSignUp);      
      
      if (result?.needsEmailConfirmation) {
        setSuccess('Please check your email to confirm your account before logging in.');
        setIsSignUp(false); // Switch to login view
      } else if (result?.needsPlan) {
        navigate('/update-plan');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.code === 'email_not_confirmed') {
        setError('Please check your email and confirm your account before logging in.');
      } else if (err.code === 'invalid_credentials') {
        setError('Invalid email or password.');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setError('Please enter your email address');
      return;
    }

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await resetPassword(resetEmail);
      setSuccess('Password reset instructions have been sent to your email');
      setIsResetting(false);
      setResetEmail('');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset instructions');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-end relative overflow-hidden bg-[#0D1117]">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-radial from-[#4DE0F9]/20 via-[#A855F7]/10 to-[#0D1117] opacity-100"></div>
      
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMzAgMzBtLTI4IDBhMjggMjggMCAxIDAgNTYgMCAyOCAyOCAwIDEgMC01NiAwIiBzdHJva2U9IiM0REUwRjkiIHN0cm9rZS13aWR0aD0iLjUiLz48L2c+PC9zdmc+')] bg-repeat opacity-20"></div>
      </div>
      
      {/* Main Heading */}
      <div className="absolute top-1/2 left-[10%] -translate-y-1/2 text-left">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-7xl md:text-8xl font-bold mb-6 tracking-tight"
        >
          <span className="text-[#4DE0F9]">AI</span>{' '}
          <span className="text-white">Influencer</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-gray-400 text-2xl md:text-3xl max-w-xl"
        >
          Create, automate, and scale your content
        </motion.p>
      </div>

      {/* Login Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 w-full max-w-md z-10 backdrop-blur-xl fixed top-1/2 right-0 -translate-y-1/2 mr-10"
      >
        <div className="flex items-center justify-center mb-6">
          <img 
            src="https://i.ibb.co/BgtVKG9/LIMITED-TIME-FREE-ACCESS-5.png"
            alt="AI Influencer Logo"
            className="h-20 w-auto mr-4 filter drop-shadow-glow"
          />
          <h1 className="text-2xl font-bold">
            <span className="text-[#4DE0F9]">AI</span>{' '}
            <span className="text-white">Influencer</span>
          </h1>
        </div>
        <div className="flex justify-center space-x-4 mb-6">
          <button
            onClick={() => setIsSignUp(false)}
            className={`px-4 py-2 tab-underline ${
              !isSignUp ? 'active text-white' : 'text-gray-400'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setIsSignUp(true)}
            className={`px-4 py-2 tab-underline ${
              isSignUp ? 'active text-white' : 'text-gray-400'
            }`}
          >
            Sign Up
          </button>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 text-red-400 rounded-md text-sm border border-red-500/20">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-500/10 text-green-400 rounded-md text-sm border border-green-500/20">
            {success}
          </div>
        )}
        {isResetting ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label 
                htmlFor="reset-email" 
                className="block text-base font-medium text-gray-300 mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="reset-email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="form-input w-full"
                required
              />
            </div>
            <div className="flex flex-col space-y-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#4DE0F9] text-black py-3 px-4 rounded-xl font-semibold hover:bg-[#4DE0F9]/90 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Send Reset Instructions'}
              </button>
              <button
                type="button"
                onClick={() => setIsResetting(false)}
                className="text-sm text-[#4DE0F9] hover:text-[#4DE0F9]/80 transition-colors"
              >
                Back to Login
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-base font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input w-full"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-base font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input w-full"
                required
              />
            </div>
            <div className="flex flex-col space-y-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#4DE0F9] text-black py-3 px-4 rounded-xl font-semibold hover:bg-[#4DE0F9]/90 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Login')}
              </button>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => setIsResetting(true)}
                  className="text-sm text-[#4DE0F9] hover:text-[#A855F7] transition-colors"
                >
                  Forgot Password?
                </button>
              )}
            </div>
        </form>
        )}
      </motion.div>
    </div>
  );
}
