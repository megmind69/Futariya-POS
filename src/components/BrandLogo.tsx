import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = false
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12'
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl'
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Brand Icon SVG: artisan Greek yogurt bowl with spoon and healthy probiotic swirl */}
      <div
        className={`${iconSizes[size]} bg-gradient-to-br from-sky-500 to-blue-700 rounded-xl flex items-center justify-center text-white shadow-md shadow-sky-600/20 shrink-0 p-1.5`}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Ceramic Yogurt Bowl */}
          <path
            d="M8 22C8 33 15 39 24 39C33 39 40 33 40 22H8Z"
            fill="white"
          />
          {/* Creamy Swirl Texture */}
          <path
            d="M13 22C16 17 21 16 24 19C27 22 32 17 35 22"
            stroke="#0284c7"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Yogurt Spoon */}
          <path
            d="M34 8L39 13M39 13L29 27C28 28.5 25.5 29 24 27.5C22.5 26 23 23.5 24.5 22L34.5 8"
            stroke="#fef08a"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Bowl Base */}
          <path
            d="M18 39H30V42H18V39Z"
            fill="white"
            opacity="0.9"
          />
        </svg>
      </div>

      <div className="flex flex-col">
        <span className={`${textSizes[size]} font-bold tracking-tight text-slate-900 leading-none`}>
          FUTARIYA
        </span>
        {showSubtitle && (
          <span className="text-[10px] font-semibold tracking-wider text-sky-600 uppercase mt-0.5">
            Greek Yogurt Factory
          </span>
        )}
      </div>
    </div>
  );
};
