import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <div className={`relative group ${className}`}>
      <svg
        viewBox="0 0 160 40"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#c084fc', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#9333ea', stopOpacity: 1 }} />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <text
          x="45"
          y="29"
          fontFamily="Montserrat, sans-serif"
          fontSize="24"
          fontWeight="bold"
          fill="url(#glowGradient)"
          className="transition-all duration-500 ease-in-out group-hover:opacity-80"
        >
          DlxTech
        </text>

        <g
          stroke="url(#glowGradient)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Main processor square with draw animation */}
          <path
            d="M14 14 H 26 V 26 H 14 Z"
            className="animate-draw"
            style={{
              strokeDasharray: 48,
              strokeDashoffset: 48,
              animationFillMode: 'forwards',
            }}
          />

          {/* Radiating lines group with delayed draw animation */}
          <g
            className="animate-draw"
            style={{
              strokeDasharray: 80,
              strokeDashoffset: 80,
              animationDelay: '0.3s',
              animationFillMode: 'forwards',
            }}
          >
            <path d="M20 14 V 4" />
            <path d="M20 26 V 36" />
            <path d="M14 20 H 4" />
            <path d="M26 20 H 36" />
            <path d="M14 14 L 8 8" />
            <path d="M26 14 L 32 8" />
            <path d="M14 26 L 8 32" />
            <path d="M26 26 L 32 32" />
          </g>
        </g>
        
        {/* Glow effect for hover */}
        <g filter="url(#glow)" className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <g stroke="white" strokeWidth="2" fill="none">
            <path d="M14 14 H 26 V 26 H 14 Z" />
            <path d="M20 14 V 4" />
            <path d="M20 26 V 36" />
            <path d="M14 20 H 4" />
            <path d="M26 20 H 36" />
            <path d="M14 14 L 8 8" />
            <path d="M26 14 L 32 8" />
            <path d="M14 26 L 8 32" />
            <path d="M26 26 L 32 32" />
          </g>
        </g>
      </svg>
    </div>
  );
};

export default Logo;
