import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { Key, Lock, Loader2, CreditCard, Gift, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase";
import ApiKeyManagement from "../components/ApiKeyManagement";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { currentUser, updateApiKeys } = useAuthStore();
  const [openaiKey, setOpenaiKey] = useState(currentUser?.openaiApiKey || "");
  const [heygenKey, setHeygenKey] = useState(currentUser?.heygenApiKey || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentPlan, setCurrentPlan] = useState("Loading...");
  const [isFetching, setIsFetching] = useState(true);
  const [totalBonusMinutes, setTotalBonusMinutes] = useState(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const billingLink = 'https://billing.stripe.com/p/login/test_28o02D9Hvfrmh0c288'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      updateApiKeys(openaiKey, heygenKey);
      setSuccess("API keys saved successfully!");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (err) {
      setError("Failed to save API keys");
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentUser) {
    navigate("/login");
    return null;
  }

  const handleUpgradePlan = () => {
    navigate("/update-plan");
  };

  const handleBilling = () => {
    if (billingLink && currentUser?.email) {
      const url = `${billingLink}?prefilled_email=${currentUser.email}`;
      window.open(url, "_blank"); // Open the billing link in a new tab
    } else {
      console.error("Billing link or user email is missing.");
    }
  };

  useEffect(() => {
    const fetchUserPlan = async () => {
      setIsFetching(true);
      try {
        const session = await supabase.auth.getSession();

        if (session?.data?.session?.user?.email) {
          const email = session.data.session.user.email.trim();
          // const { data, error } = await supabase
          //   .from("users")
          //   .select("tier")
          //   .eq("email", email)
          //   .maybeSingle();

          // Fetch user's current_plan and subscription_id
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("current_plan, subscription_id, total_bonus_minutes")
            .eq("email", email)
            .single();

          if (userError) {
            console.error("Error fetching user data:", userError);
            setCurrentPlan("Free"); // Default to 'Free' if user fetch fails
            return;
          }

          setTotalBonusMinutes(userData.total_bonus_minutes || 0)

          if (userData?.current_plan) {
            const { data: planData } = await supabase
              .from("plans")
              .select("plan_name")
              .eq("id", userData.current_plan)
              .single();
            console.log(planData)
            if (planData) {
              setCurrentPlan(planData.plan_name);
            }
          }

          if (error) {
            console.error("Error fetching user plan:", error);
          }
        }
      } catch (error) {
        console.error("Unexpected error:", error);
      } finally {
        setIsFetching(false);
      }
    };

    fetchUserPlan();
  }, []);

  const buttonText = currentPlan === "Accelerator" ? "Downgrade" : "Upgrade";

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    setIsChangingPassword(true);

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      setIsChangingPassword(false);
      return;
    }

    try {
      // First verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentUser?.email || '',
        password: currentPassword
      });

      if (signInError) {
        setPasswordError('Current password is incorrect');
        setIsChangingPassword(false);
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      setPasswordSuccess('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
      setPasswordError('Failed to update password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const bonusMinsProducts = [
    {
      title: 'Get 250 Bonus Minutes',
      price: 20,
      link: "https://buy.stripe.com/test_14kdTPfK67JLdFK7sA",
      price_Id: "price_1QiIuhFK63VyJS7hFPqeRP6n",
      bonus_minutes: 250,
    },
    {
      title: 'Get 500 Bonus Minutes',
      price: 40,
      link: "https://buy.stripe.com/test_4gwaHD1TggghfNScMV",
      price_Id: "price_1QiIv8FK63VyJS7h87XhbGvW",
      bonus_minutes: 500,
    },
  ]

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-6xl mx-auto"
      >
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Manage your account settings and preferences</p>
        </motion.div>

        {/* Settings Grid */}
        <div className="space-y-6">
          {/* Top Row - Subscription and Bonus Minutes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subscription Overview Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#0D1117]/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.05)] p-6"
            >
              <div className="flex items-center gap-2 mb-6">
                <Crown className="h-5 w-5 text-[#4DE0F9]" />
                <h2 className="text-xl font-bold text-white">Subscription Plan</h2>
              </div>
              
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-white/60">Current Plan</p>
                  <p className="text-xl font-semibold text-white">
                    {isFetching ? "Loading..." : currentPlan}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleUpgradePlan}
                  className={`px-6 py-2 rounded-full font-medium text-black transition-all duration-200 ${
                    currentPlan === "Pro"
                      ? "bg-red-500 hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/20"
                      : "bg-[#4DE0F9] hover:bg-[#4DE0F9]/90 hover:shadow-lg hover:shadow-[#4DE0F9]/20"
                  }`}
                >
                  {isFetching ? "Loading..." : buttonText}
                </motion.button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-white/60" />
                  <p className="text-white/80">Manage your Billing here</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBilling}
                  className="px-6 py-2 rounded-full font-medium text-black bg-[#4DE0F9] hover:bg-[#4DE0F9]/90 hover:shadow-lg hover:shadow-[#4DE0F9]/20 transition-all duration-200"
                >
                  {isFetching ? "Loading..." : "Billing"}
                </motion.button>
              </div>
            </motion.div>

            {/* Bonus Minutes Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#0D1117]/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.05)] p-6"
            >
              <div className="flex items-center gap-2 mb-6">
                <Gift className="h-5 w-5 text-[#4DE0F9]" />
                <h2 className="text-xl font-bold text-white">Bonus Minutes</h2>
              </div>

              <p className="text-lg font-medium text-white/80 mb-6">
                Total Bonus Minutes Available: {totalBonusMinutes !== null ? totalBonusMinutes : "Loading..."}
              </p>

              <div className="grid grid-cols-1 gap-4">
                {bonusMinsProducts.map((product, index) => (
                  <motion.div
                    key={product.price_Id}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 shadow-lg hover:shadow-[#4DE0F9]/10 transition-all duration-200"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-base font-semibold text-white">{product.title}</h3>
                      {index === 1 && (
                        <span className="px-2 py-1 text-xs font-medium text-white bg-gradient-to-r from-[#4DE0F9]/20 to-[#A855F7]/20 rounded-full">
                          🔥 Best Value
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-medium text-white/80">${product.price}</p>
                        <p className="text-sm text-white/60">{product.bonus_minutes} Minutes</p>
                      </div>
                      <motion.a
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        href={`${product.link}?prefilled_email=${currentUser?.email}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-full font-medium text-black bg-[#4DE0F9] hover:bg-[#4DE0F9]/90 hover:shadow-lg hover:shadow-[#4DE0F9]/20 transition-all duration-200"
                      >
                        Purchase
                      </motion.a>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Password Change Section - Full Width */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#0D1117]/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.05)] p-6"
                      >
              <div className="flex items-center gap-2 mb-6">
                <Lock className="h-5 w-5 text-[#4DE0F9]" />
                <h2 className="text-xl font-bold text-white">Change Password</h2>
              </div>

              {passwordError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-sm">
                  {passwordSuccess}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-white/10 text-white rounded-xl px-4 py-3 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#4DE0F9]/40 placeholder:text-gray-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-white/10 text-white rounded-xl px-4 py-3 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#4DE0F9]/40 placeholder:text-gray-400"
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-white/10 text-white rounded-xl px-4 py-3 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#4DE0F9]/40 placeholder:text-gray-400"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePasswordChange}
                  disabled={isChangingPassword}
                  className="px-6 py-3 rounded-xl font-medium text-black bg-[#4DE0F9] hover:bg-[#4DE0F9]/90 hover:shadow-lg hover:shadow-[#4DE0F9]/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isChangingPassword ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Updating...</span>
                    </div>
                  ) : (
                    'Update Password'
                  )}
                </motion.button>
              </div>
            </motion.div>

          {/* API Key Management Section - Full Width */}
          <ApiKeyManagement />
        </div>
      </motion.div>
    </div>
  );
}