import React from 'react';
import { useInView } from 'framer-motion';

interface CardShellProps {
  children: React.ReactNode;
  imgSrc?: string;
  imgAlt?: string;
  aspect?: string;
  inViewDelay?: number;
}

export const CardShell: React.FC<CardShellProps> = ({
  children,
  imgSrc,
  imgAlt,
  aspect = "2/3",
  inViewDelay = 0
}) => {
  const cardRef = React.useRef(null);
  const isInView = useInView(cardRef, {
    once: true,
    margin: "0px 0px -10% 0px"
  });

  return (
    <div className="relative group bg-white/5 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden transition-all duration-200">
      <div
        ref={cardRef}
        style={{
          opacity: isInView ? 1 : 0,
          transform: isInView ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.95)',
          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          transitionDelay: `${inViewDelay}ms`
        }}
        className={`group relative overflow-hidden rounded-xl aspect-[${aspect}] bg-[#0D1117]`}
      >
        {/* Full-bleed Background Image */}
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={imgAlt}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900 flex items-center justify-center">
            <span className="text-gray-400 text-lg">No Preview</span>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

        {/* Content */}
        <div className="absolute inset-0 p-4 flex flex-col justify-end">
          {children}
        </div>
      </div>
    </div>
  );
}; 