import React, { useState } from "react";

const Sidebar = ({ onTabChange }: { onTabChange: (tab: string) => void }) => {
  const [activeTab, setActiveTab] = useState("Users");

  const tabs = ["Users", "Influencers"];

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    onTabChange(tab); // Notify parent component of tab change
  };

  return (
    <div className="w-64 h-full bg-gray-800 text-white flex flex-col">
      <h2 className="text-2xl font-bold text-center py-4 border-b border-gray-700">
        Admin Panel
      </h2>
      <nav className="flex-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`w-full px-4 py-3 text-left hover:bg-gray-700 ${
              activeTab === tab ? "bg-gray-700 font-semibold" : ""
            }`}
            onClick={() => handleTabClick(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
