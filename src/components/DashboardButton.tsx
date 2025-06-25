import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardButtonProps {
  icon: LucideIcon;
  title: string;
  description: string;
  to?: string;
  onClick?: () => void;
  isActive?: boolean;
  isDisabled?: boolean;
  className?: string;
}

export default function DashboardButton({
  icon: Icon,
  title,
  description,
  to,
  onClick,
  isActive = false,
  isDisabled = false,
  className = '',
}: DashboardButtonProps) {
  const buttonClasses = `
    relative group
    bg-white/5 backdrop-blur-md
    border border-white/10
    rounded-xl
    shadow-[0_0_20px_rgba(255,255,255,0.05)]
    hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]
    hover:scale-[1.02]
    hover:ring-2 hover:ring-white/20
    active:scale-95 active:bg-white/5
    transition-all duration-200
    overflow-hidden
    min-h-[160px]
    ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${className}
  `;

  const content = (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-start gap-4 mb-4">
        <div className="relative flex-shrink-0">
          <div className="p-3 bg-[#c9fffc]/10 rounded-xl group-hover:bg-[#c9fffc]/20 transition-colors">
            <Icon className="h-6 w-6 text-[#c9fffc] group-hover:scale-110 transition-transform duration-200" />
          </div>
          {isActive && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#c9fffc] rounded-full animate-pulse" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white tracking-wide leading-tight break-words">
            {title}
          </h3>
        </div>
      </div>
      <div className="flex-1">
        <p className="text-gray-400 text-sm tracking-wide leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className={buttonClasses}>
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={buttonClasses}
    >
      {content}
    </button>
  );
} 