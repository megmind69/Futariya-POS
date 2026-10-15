import React from 'react';
import { ProductCategory } from '../types/pos';

interface ProductVisualProps {
  category: ProductCategory;
  variantName?: string;
  size?: string;
  className?: string;
}

export const ProductVisual: React.FC<ProductVisualProps> = ({
  category,
  variantName = '',
  className = 'w-full h-28'
}) => {
  const isStrawberry = variantName.toLowerCase().includes('strawberry');
  const isBlueberry = variantName.toLowerCase().includes('blueberry');
  const isChocolate = variantName.toLowerCase().includes('choco');
  const isKurma = variantName.toLowerCase().includes('kurma');
  const isMango = variantName.toLowerCase().includes('mango');
  const isPeach = variantName.toLowerCase().includes('peach');
  const isLychee = variantName.toLowerCase().includes('lychee');

  // Background gradient based on category & flavor
  let bgGradient = 'from-sky-50 to-blue-100';
  let accentColor = '#0284c7';

  if (isStrawberry) {
    bgGradient = 'from-rose-50 to-pink-100';
    accentColor = '#f43f5e';
  } else if (isBlueberry) {
    bgGradient = 'from-indigo-50 to-purple-100';
    accentColor = '#6366f1';
  } else if (isChocolate) {
    bgGradient = 'from-amber-50 to-stone-200';
    accentColor = '#78350f';
  } else if (isKurma) {
    bgGradient = 'from-amber-50 to-orange-100';
    accentColor = '#b45309';
  } else if (isMango) {
    bgGradient = 'from-amber-50 to-yellow-100';
    accentColor = '#f59e0b';
  } else if (isPeach) {
    bgGradient = 'from-orange-50 to-amber-100';
    accentColor = '#fb923c';
  } else if (isLychee) {
    bgGradient = 'from-red-50 to-rose-100';
    accentColor = '#fb7185';
  } else if (category === 'fruit_salad') {
    bgGradient = 'from-emerald-50 to-teal-100';
    accentColor = '#10b981';
  } else if (category === 'sago_mango') {
    bgGradient = 'from-amber-50 to-yellow-100';
    accentColor = '#d97706';
  }

  return (
    <div
      className={`${className} bg-gradient-to-br ${bgGradient} rounded-xl flex items-center justify-center p-3 relative overflow-hidden transition-all select-none`}
    >
      {/* Background soft fruit ring / bubble */}
      <div
        className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full opacity-20 pointer-events-none"
        style={{ backgroundColor: accentColor }}
      />

      {category === 'greek_yogurt' && (
        <svg viewBox="0 0 80 80" className="w-16 h-16 drop-shadow-sm" fill="none">
          {/* Glass Jar Body */}
          <rect x="22" y="30" width="36" height="38" rx="6" fill="#ffffff" fillOpacity="0.95" stroke="#94a3b8" strokeWidth="2" />
          {/* Yogurt Cream Fill */}
          <path d="M24 40C28 38 34 42 40 40C46 38 52 41 56 40V62C56 65 54 67 51 67H29C26 67 24 65 24 62V40Z" fill="#f8fafc" />
          {/* Swirl Jam Layer */}
          <path d="M26 44C30 42 36 46 42 44C48 42 52 45 54 44" stroke={accentColor} strokeWidth="3" strokeLinecap="round" />
          {/* Jar Lid */}
          <rect x="20" y="24" width="40" height="7" rx="3" fill="#38bdf8" />
          <rect x="24" y="21" width="32" height="4" rx="2" fill="#0284c7" />
          {/* Fruit Garnish */}
          <circle cx="50" cy="34" r="4" fill={accentColor} />
          <circle cx="56" cy="37" r="3" fill={accentColor} />
        </svg>
      )}

      {category === 'parfait' && (
        <svg viewBox="0 0 80 80" className="w-16 h-16 drop-shadow-sm" fill="none">
          {/* Parfait Glass Cup */}
          <path d="M22 20L28 66C28.5 70 31.5 72 35 72H45C48.5 72 51.5 70 52 66L58 20H22Z" fill="#ffffff" fillOpacity="0.9" stroke="#94a3b8" strokeWidth="2" />
          {/* Layer 1: Granola Bottom */}
          <path d="M29 62L28 66C28.5 70 31.5 72 35 72H45C48.5 72 51.5 70 52 66L51 62H29Z" fill="#d97706" />
          {/* Layer 2: Yogurt */}
          <rect x="27" y="52" width="26" height="10" fill="#f1f5f9" />
          {/* Layer 3: Fruit Puree */}
          <rect x="25" y="42" width="30" height="10" fill={accentColor} />
          {/* Layer 4: Creamy Yogurt */}
          <rect x="24" y="32" width="32" height="10" fill="#f8fafc" />
          {/* Layer 5: Crunchy Granola & Fruit on top */}
          <circle cx="36" cy="19" r="5" fill={accentColor} />
          <circle cx="44" cy="18" r="4.5" fill="#e11d48" />
          <path d="M30 20C32 17 38 17 40 20C42 16 48 16 50 20" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )}

      {category === 'jelly' && (
        <svg viewBox="0 0 80 80" className="w-16 h-16 drop-shadow-sm" fill="none">
          {/* Square Jar */}
          <rect x="22" y="24" width="36" height="46" rx="8" fill="#ffffff" fillOpacity="0.85" stroke="#94a3b8" strokeWidth="2" />
          {/* Yogurt base */}
          <rect x="24" y="34" width="32" height="34" rx="6" fill="#f0f9ff" />
          {/* Jelly Cubes */}
          <rect x="28" y="38" width="8" height="8" rx="2" fill={accentColor} fillOpacity="0.8" />
          <rect x="42" y="40" width="9" height="9" rx="2" fill={accentColor} fillOpacity="0.9" />
          <rect x="33" y="52" width="8" height="8" rx="2" fill={accentColor} fillOpacity="0.85" />
          {/* Jar Gold/Silver Cap */}
          <rect x="20" y="19" width="40" height="6" rx="2" fill="#0284c7" />
        </svg>
      )}

      {category === 'yogurt_drink' && (
        <svg viewBox="0 0 80 80" className="w-16 h-16 drop-shadow-sm" fill="none">
          {/* Straw */}
          <path d="M44 8L42 22" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" />
          {/* Bottle Cap */}
          <rect x="32" y="20" width="16" height="6" rx="2" fill="#0284c7" />
          {/* Bottle Neck */}
          <path d="M34 26H46L50 34H30L34 26Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
          {/* Bottle Body */}
          <rect x="28" y="34" width="24" height="38" rx="6" fill="#ffffff" fillOpacity="0.95" stroke="#94a3b8" strokeWidth="2" />
          {/* Liquid content */}
          <rect x="30" y="42" width="20" height="28" rx="4" fill={accentColor} fillOpacity="0.3" />
          {/* Brand Wave */}
          <path d="M30 52C34 50 38 54 42 52C46 50 48 53 50 52" stroke={accentColor} strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}

      {category === 'fruit_salad' && (
        <svg viewBox="0 0 80 80" className="w-16 h-16 drop-shadow-sm" fill="none">
          {/* Fresh Salad Bowl */}
          <path d="M16 36C16 54 26 64 40 64C54 64 64 54 64 36H16Z" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" />
          {/* Yogurt Cream Dressing */}
          <ellipse cx="40" cy="38" rx="22" ry="6" fill="#f8fafc" />
          {/* Strawberry Slice */}
          <circle cx="34" cy="32" r="5" fill="#f43f5e" />
          {/* Kiwi slice */}
          <circle cx="46" cy="30" r="5" fill="#10b981" />
          <circle cx="46" cy="30" r="2" fill="#065f46" />
          {/* Mango Cube */}
          <rect x="37" y="26" width="7" height="7" rx="1.5" fill="#f59e0b" />
          {/* Grapes */}
          <circle cx="26" cy="34" r="4" fill="#8b5cf6" />
          <circle cx="53" cy="34" r="4" fill="#a855f7" />
        </svg>
      )}

      {category === 'sago_mango' && (
        <svg viewBox="0 0 80 80" className="w-16 h-16 drop-shadow-sm" fill="none">
          {/* Sago Dessert Cup */}
          <path d="M24 24L28 66C28.5 70 31.5 72 35 72H45C48.5 72 51.5 70 52 66L56 24H24Z" fill="#ffffff" fillOpacity="0.9" stroke="#94a3b8" strokeWidth="2" />
          {/* Creamy Mango Puree */}
          <rect x="27" y="32" width="26" height="36" fill="#fef08a" />
          {/* Juicy Mango Cubes on Top */}
          <rect x="32" y="20" width="7" height="7" rx="1.5" fill="#f59e0b" />
          <rect x="41" y="21" width="7" height="7" rx="1.5" fill="#f59e0b" />
          <rect x="36" y="16" width="8" height="8" rx="1.5" fill="#d97706" />
          {/* Sago Pearl Bubbles */}
          <circle cx="32" cy="46" r="2.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
          <circle cx="44" cy="48" r="2.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
          <circle cx="38" cy="56" r="2.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
          <circle cx="42" cy="62" r="2.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
          <circle cx="33" cy="63" r="2.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
        </svg>
      )}

      {category === 'other' && (
        <svg viewBox="0 0 80 80" className="w-16 h-16 drop-shadow-sm" fill="none">
          <circle cx="40" cy="40" r="24" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" />
          <path d="M40 28V52M28 40H52" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
};
