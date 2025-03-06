import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="flex items-center justify-center mb-6">
          <img 
            src="https://i.ibb.co/BgtVKG9/LIMITED-TIME-FREE-ACCESS-5.png"
            alt="AI Influencer Logo"
            className="h-16 w-auto mr-3"
          />
          <h1 className="text-xl font-bold text-blue-600">The AI Influencer</h1>
        </div>
        <div className="flex justify-center space-x-4 mb-6">
          <button
            onClick={() => setIsSignUp(false)}
            className={`px-4 py-2 ${
              !isSignUp ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setIsSignUp(true)}
            className={`px-4 py-2 ${
              isSignUp ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
            }`}
          >
            Sign Up
          </button>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-sm">
            {success}
          </div>
        )}
        {isResetting ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label 
                htmlFor="reset-email" 
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                type="email"
                id="reset-email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex flex-col space-y-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-black py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Send Reset Instructions'}
              </button>
              <button
                type="button"
                onClick={() => setIsResetting(false)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Back to Login
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex flex-col space-y-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-black py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Login')}
              </button>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => setIsResetting(true)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Forgot Password?
                </button>
              )}
            </div>
        </form>
        )}
      </div>
    </div>
  );
}