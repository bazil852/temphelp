import { Users, Star } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  const menuItems = [
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: Star, label: 'Influencers', path: '/admin/influencers' },
  ];

  return (
    <div className="h-screen w-64 bg-gray-900 text-white fixed left-0 top-0">
      <div className="p-4">
        <h1 className="text-xl font-bold mb-8">Admin Dashboard</h1>
        <nav>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}