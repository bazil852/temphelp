import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { Key, Lock, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";

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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Subscription Overview Card */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Subscription Plan
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Current Plan</p>
            <p className="text-xl font-semibold text-gray-600">
              {isFetching ? "Loading..." : currentPlan}
            </p>
          </div>
          <button
            onClick={handleUpgradePlan}
            className={`inline-flex items-center justify-center w-32 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${currentPlan === "Pro"
              ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
              : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
              } focus:outline-none focus:ring-2 focus:ring-offset-2`}
          >
            {isFetching ? "Loading..." : buttonText}
          </button>
        </div>

        <div className="flex items-center justify-between mt-5">
          <div>
            <p className="text-xl font-semibold text-gray-600">Manage your Billing here</p>
          </div>

          <button
            onClick={handleBilling}
            className="inline-flex items-center justify-center w-32 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2"
          >
            {isFetching ? "Loading..." : "Billing"}
          </button>
        </div>
      </div>

      {/* Password Change Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6 flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Change Password
        </h2>

        {passwordError && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {passwordError}
          </div>
        )}

        {passwordSuccess && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
            {passwordSuccess}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
              minLength={6}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Bonus Minutes</h2>

        <p className="text-lg font-medium text-gray-600 mb-4">
        Total Bonus Minutes Available: {totalBonusMinutes !== null ? totalBonusMinutes : "Loading..."}
      </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bonusMinsProducts.map((product) => (
            <div key={product.price_Id} className="bg-gray-50 p-4 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-700">{product.title}</h3>
              <p className="text-lg font-medium text-gray-600">Price: ${product.price}</p>
              <p className="text-sm text-gray-500">Bonus Minutes: {product.bonus_minutes}</p>

              <div className="mt-4">
                <a
                  href={`${product.link}?prefilled_email=${currentUser?.email}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2"
                >
                  Get Bonus Minutes
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}