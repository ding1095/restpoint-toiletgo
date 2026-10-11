import React from 'react';

export type MascotMood = 'happy' | 'driving' | 'urgent' | 'relieved' | 'waving';

interface PooPooMascotProps {
  mood?: MascotMood;
  size?: number;
  className?: string;
  showSpeech?: boolean;
  speechText?: string;
}

export const PooPooMascot: React.FC<PooPooMascotProps> = ({
  mood = 'happy',
  size = 64,
  className = '',
  showSpeech = false,
  speechText = 'ปวดท้องเมื่อไหร่ เรียกปู้ปู้นะ!',
}) => {
  return (
    <div className={`inline-flex items-center gap-2 relative select-none ${className}`}>
      {/* Cute speech bubble if requested */}
      {showSpeech && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs animate-bounce">
          {speechText}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-amber-50 border-r border-b border-amber-200 rotate-45"></div>
        </div>
      )}

      {/* Mascot SVG */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform hover:scale-110 duration-200 drop-shadow-md"
      >
        <defs>
          <linearGradient id="pooGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="45%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
          <linearGradient id="pooHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#fef3c7" stopOpacity="0" />
          </linearGradient>
          <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Shadow base */}
        <ellipse cx="60" cy="110" rx="36" ry="6" fill="#000000" fillOpacity="0.12" />

        {/* --- BODY TIERS (Adorable Swirl) --- */}
        {/* Tier 1: Bottom Swirl Base */}
        <path
          d="M22 96C22 82 40 76 60 76C80 76 98 82 98 96C98 106 82 108 60 108C38 108 22 106 22 96Z"
          fill="url(#pooGrad)"
        />

        {/* Tier 2: Middle Swirl */}
        <path
          d="M28 72C28 58 44 54 60 54C76 54 92 58 92 72C92 82 78 84 60 84C42 84 28 82 28 72Z"
          fill="url(#pooGrad)"
        />

        {/* Tier 3: Top Swirl & Curly Tip */}
        <path
          d="M38 50C38 38 48 34 60 34C72 34 82 38 82 50C82 58 74 60 60 60C46 60 38 58 38 50Z"
          fill="url(#pooGrad)"
        />
        {/* Cute Swirly Tip */}
        <path
          d="M60 36C56 30 52 20 62 16C72 12 74 24 64 34"
          stroke="url(#pooGrad)"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Shiny Highlight on Top */}
        <path
          d="M45 42C48 38 55 36 62 36"
          stroke="#fef3c7"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeOpacity="0.7"
        />

        {/* --- SPECIAL ACCESSORIES BY MOOD --- */}
        {mood === 'driving' && (
          // Cool sunglasses
          <g>
            <rect x="36" y="52" width="20" height="14" rx="4" fill="#0f172a" />
            <rect x="64" y="52" width="20" height="14" rx="4" fill="#0f172a" />
            <line x1="56" y1="58" x2="64" y2="58" stroke="#0f172a" strokeWidth="3" />
            {/* Sunglasses glare */}
            <line x1="39" y1="55" x2="45" y2="63" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="67" y1="55" x2="73" y2="63" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        )}

        {mood === 'urgent' && (
          // Sweat drop
          <path
            d="M86 36C86 33 92 26 92 26C92 26 98 33 98 36C98 39.3 95.3 42 92 42C88.7 42 86 39.3 86 36Z"
            fill="#38bdf8"
          />
        )}

        {/* --- EYES & EXPRESSIONS --- */}
        {mood !== 'driving' && mood !== 'relieved' && (
          <>
            {/* Left Eye */}
            <circle cx="48" cy="62" r="6" fill="#1e1b4b" />
            <circle cx="46" cy="60" r="2.2" fill="white" />
            <circle cx="50" cy="63" r="1" fill="white" />

            {/* Right Eye */}
            <circle cx="72" cy="62" r="6" fill="#1e1b4b" />
            <circle cx="70" cy="60" r="2.2" fill="white" />
            <circle cx="74" cy="63" r="1" fill="white" />
          </>
        )}

        {mood === 'relieved' && (
          <>
            {/* Happy closed eyes (^_^) */}
            <path d="M42 63C44 58 52 58 54 63" stroke="#1e1b4b" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M66 63C68 58 76 58 78 63" stroke="#1e1b4b" strokeWidth="3" strokeLinecap="round" fill="none" />
            {/* Sparkles */}
            <path d="M96 46L98 40L100 46L106 48L100 50L98 56L96 50L90 48L96 46Z" fill="#fbbf24" />
            <path d="M22 46L23 42L24 46L28 47L24 48L23 52L22 48L18 47L22 46Z" fill="#fbbf24" />
          </>
        )}

        {/* Rosy Blushing Cheeks */}
        <ellipse cx="38" cy="68" rx="5" ry="3" fill="#f43f5e" fillOpacity="0.4" />
        <ellipse cx="82" cy="68" rx="5" ry="3" fill="#f43f5e" fillOpacity="0.4" />

        {/* Mouth */}
        {mood === 'urgent' ? (
          // Wobbly wavy mouth ~
          <path d="M52 72Q60 76 68 72" stroke="#451a03" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        ) : mood === 'relieved' ? (
          // Peaceful smile
          <path d="M54 70C54 70 60 74 66 70" stroke="#451a03" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        ) : (
          // Big happy open mouth with cute tongue
          <g>
            <path d="M52 69C52 75 68 75 68 69Z" fill="#881337" />
            <path d="M56 73C58 71 62 71 64 73Z" fill="#fb7185" />
          </g>
        )}

        {/* Waving Hand */}
        {mood === 'waving' && (
          <path
            d="M92 78C100 72 108 64 112 70C114 74 104 84 94 82"
            fill="url(#pooGrad)"
            stroke="#b45309"
            strokeWidth="2"
            strokeLinecap="round"
          />
        )}
      </svg>
    </div>
  );
};
