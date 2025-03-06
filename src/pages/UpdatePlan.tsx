import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type PlanName = "Free" | "Basic" | "Pro";

interface Plan {
  name: PlanName;
  price: number;
  features: string[];
  duration: string;
  link?: string;
  priceId?: string;
}

interface NewPlan {
  plan_name: string;
  price: number;
  link: string;
  price_Id: string;
  avatars: number;
  ai_cloning: number;
  automations: boolean;
  ai_editing: boolean;
  video_minutes: number;
  video_creation: number;
  video_creation_rate: number;
  video_editing_rate: number | null;
}

export default function UpdatePlan() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<NewPlan[]>([
    {
      plan_name: 'Basic',
      price: 99,
      link: "https://buy.stripe.com/test_4gwg1X69w9RT45adQS",
      price_Id: "price_1Qh6z1FK63VyJS7hrCOEGOf6",
      avatars: 3,
      ai_cloning: 0,
      automations: false,
      ai_editing: false,
      video_minutes: 50,
      video_creation: 50,
      video_creation_rate: 0.09,
      video_editing_rate: null
    },
    {
      plan_name: "Growth",
      price: 250,
      link: "https://buy.stripe.com/test_eVa9Dz55s1ln1X25kn",
      price_Id: "price_1Qh6z1FK63VyJS7hfXauoSOO",
      avatars: -1,
      ai_cloning: 3,
      automations: true,
      ai_editing: true,
      video_minutes: 100,
      video_creation: 100,
      video_creation_rate: 0.08,
      video_editing_rate: null
    },
    {
      plan_name: "Accelerator",
      price: 999,
      link: "https://buy.stripe.com/test_eVa8zv1Tg3tv0SY3cg",
      price_Id: "price_1Qh6z1FK63VyJS7hw6YsF6y8",
      avatars: -1,
      ai_cloning: -1,
      automations: true,
      ai_editing: true,
      video_minutes: 800,
      video_creation: 100,
      video_creation_rate: 0.00,
      video_editing_rate: null
    }
  ]);

  // const plans: Plan[] = [
  //   {
  //     name: "Free",
  //     price: 0,
  //     features: [
  //       "Access to basic features",
  //       "Limited API calls",
  //       "Community support",
  //     ],
  //     duration: "/month",
  //   },
  //   {
  //     name: "Basic",
  //     price: 30,
  //     features: [
  //       "All Free plan features",
  //       "Increased API calls",
  //       "Email support",
  //     ],
  //     duration: "/month",
  //     link: "https://buy.stripe.com/test_14kcPLfK62pr9pu3cc",
  //     priceId: "price_1QShokFK63VyJS7h2XWMMXkM",
  //   },
  //   {
  //     name: "Pro",
  //     price: 60,
  //     features: [
  //       "All Basic plan features",
  //       "Unlimited API calls",
  //       "Priority support",
  //       "Access to premium features",
  //     ],
  //     duration: "/month",
  //     link: "https://buy.stripe.com/test_dR6aHD55s2pr59efYZ",
  //     priceId: "price_1QbgQjFK63VyJS7h8TWavrrG",
  //   },
  // ];

  const newPlans: NewPlan[] = [
    {
      plan_name: 'Basic',
      price: 99,
      link: "https://buy.stripe.com/test_4gwg1X69w9RT45adQS",
      price_Id: "price_1Qh6z1FK63VyJS7hrCOEGOf6",
      avatars: 3,
      ai_cloning: 0,
      automations: false,
      ai_editing: false,
      video_minutes: 50,
      video_creation: 50,
      video_creation_rate: 0.09,
      video_editing_rate: null
    },
    {
      plan_name: "Growth",
      price: 250,
      link: "https://buy.stripe.com/test_eVa9Dz55s1ln1X25kn",
      price_Id: "price_1Qh6z1FK63VyJS7hfXauoSOO",
      avatars: -1,
      ai_cloning: 3,
      automations: true,
      ai_editing: true,
      video_minutes: 100,
      video_creation: 100,
      video_creation_rate: 0.08,
      video_editing_rate: null
    },
    {
      plan_name: "Accelerator",
      price: 999,
      link: "https://buy.stripe.com/test_eVa8zv1Tg3tv0SY3cg",
      price_Id: "price_1Qh6z1FK63VyJS7hw6YsF6y8",
      avatars: -1,
      ai_cloning: -1,
      automations: true,
      ai_editing: true,
      video_minutes: 800,
      video_creation: 100,
      video_creation_rate: 0.00,
      video_editing_rate: null
    }
  ]

  useEffect(() => {
    const fetchUserPlan = async () => {
      setLoading(true);
      try {
        if (currentUser?.email) {
          const { data, error } = await supabase
            .from("users")
            .select("current_plan, subscription_id").eq("email", currentUser.email)
            .single();

          if (data?.current_plan) {
            const { data: planData } = await supabase
              .from("plans")
              .select("plan_name")
              .eq("id", data.current_plan)
              .single();
            console.log(planData)
            if (planData) {
              setCurrentPlan(planData.plan_name);
            }
          }

          if (error) {
            console.error("Error fetching user plan:", error);
          } else if (data) {
            setSubscriptionId(data.subscription_id);
          } else {
            console.warn("User plan not found. Defaulting to Free.");
            setCurrentPlan("Free");
          }
        }
      } catch (err) {
        console.error("Unexpected error fetching user plan:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPlan();
  }, [currentUser?.email]);

  if (loading) {
    return <p>Loading...</p>;
  }

  const handleDowngradeToFree = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel your subscription? You will lose access to premium features."
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        "http://localhost:5002/api/stripe/cancel-subscription",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: currentUser?.email, subId: subscriptionId }), // Pass the user's email
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel subscription");
      }

      alert("Your subscription has been canceled.");
      setCurrentPlan("Free"); // Update the UI to reflect the free plan
      setSubscriptionId(null); // Clear the subscription ID
    } catch (error) {
      console.error("Error canceling subscription:", error);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">
        Choose Your Plan
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan === plan.plan_name;
          return (
            <div
              key={plan.plan_name}
              className={`flex flex-col rounded-lg shadow-lg overflow-hidden ${isCurrentPlan
                ? "border-4 border-blue-500 bg-blue-50"
                : "border border-gray-200"
                }`}
            >
              <div className="px-6 py-8 bg-gray-50 sm:p-10 sm:pb-6">
                <h2 className="text-2xl leading-6 font-semibold text-gray-900">
                  {plan.plan_name}
                </h2>
                <p className="mt-4 text-4xl font-extrabold text-gray-900">
                  ${plan.price}/month
                </p>
                <ul className="mt-6 space-y-2 text-gray-900">
                  <li>Avatars: {plan.avatars === -1 ? "Unlimited" : plan.avatars}</li>
                  <li>AI Cloning: {plan.ai_cloning === -1 ? "Unlimited" : plan.ai_cloning}</li>
                  <li>Automations: {plan.automations ? "Enabled" : "Disabled"}</li>
                  <li>AI Editing: {plan.ai_editing ? "Enabled" : "Disabled"}</li>
                  <li>Video Creation: {plan.video_creation == -1 ? "Unlimited" : plan.video_creation}</li>
                  <li>Video Minutes: {plan.video_minutes == -1 ? "Unlimited" : plan.video_minutes}</li>
                  <li>Video Creation Rate: ${plan.video_creation_rate}</li>
                </ul>
              </div>
              <div className="px-6 py-6 bg-white sm:p-10 sm:pt-6">
                {!isCurrentPlan ? (
                  <a
                    href={`${plan.link}?prefilled_email=${currentUser?.email}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Choose {plan.plan_name}
                  </a>
                ) : (
                  <button
                    disabled
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gray-400 cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-8">
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 hover:underline"
        >
          &larr; Back to Settings
        </button>
      </div>
    </div>
  );
}
