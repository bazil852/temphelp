import { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  main: string;
  helper?: string;
  progress?: number;  // 0-100   → show bar if provided
  pulse?: boolean;    // show cyan pulsing dot on the right
}

export default function StatCard({
  icon,
  label,
  main,
  helper,
  progress,
  pulse = false,
}: StatCardProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      {/* left ---------------------------------------------------- */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-md bg-white/10 backdrop-blur-sm">
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-gray-400">{label}</span>
          <span className="text-2xl font-bold text-white leading-tight">
            {main}
          </span>
          {helper && (
            <span className="text-xs text-gray-400 -mt-1">{helper}</span>
          )}
          {typeof progress === 'number' && (
            <div className="mt-1 h-1.5 w-24 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#4DE0F9] rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* right --------------------------------------------------- */}
      {pulse && (
        <div className="w-2 h-2 rounded-full bg-[#4DE0F9] animate-pulse" />
      )}
    </div>
  );
} 