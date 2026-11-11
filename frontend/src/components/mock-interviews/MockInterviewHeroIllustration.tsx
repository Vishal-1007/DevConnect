/** Hero illustration — woman + man on video call (matches reference mockup) */
export function MockInterviewHeroIllustration() {
  return (
    <svg
      viewBox="0 0 520 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-hidden
    >
      <defs>
        <linearGradient id="mi-screen" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#1a1b28" />
          <stop offset="1" stopColor="#0b0c14" />
        </linearGradient>
        <linearGradient id="mi-glow" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#6366f1" stopOpacity="0.35" />
          <stop offset="1" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
        <filter id="mi-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>

      {/* ambient glow */}
      <ellipse cx="380" cy="160" rx="120" ry="100" fill="url(#mi-glow)" filter="url(#mi-blur)" />

      {/* Woman — left, with headphones */}
      <g transform="translate(20, 48)">
        {/* laptop */}
        <rect x="0" y="88" width="200" height="130" rx="10" fill="url(#mi-screen)" stroke="#4f46e5" strokeOpacity="0.35" />
        <rect x="12" y="98" width="176" height="98" rx="6" fill="#0f111a" />
        {/* face on screen placeholder */}
        <circle cx="100" cy="145" r="28" fill="#312e81" opacity="0.5" />
        {/* body */}
        <ellipse cx="100" cy="72" rx="38" ry="42" fill="#fcd9bd" />
        {/* hair */}
        <path
          d="M62 58 Q100 18 138 58 Q142 78 130 92 Q100 72 70 92 Q58 78 62 58"
          fill="#7c3aed"
        />
        {/* headphones */}
        <path d="M58 62 Q58 38 100 34 Q142 38 142 62" stroke="#6366f1" strokeWidth="5" fill="none" />
        <rect x="52" y="58" width="14" height="22" rx="6" fill="#6366f1" />
        <rect x="134" y="58" width="14" height="22" rx="6" fill="#6366f1" />
        {/* eyes */}
        <circle cx="88" cy="68" r="3" fill="#1e1f2e" />
        <circle cx="112" cy="68" r="3" fill="#1e1f2e" />
        <path d="M90 78 Q100 84 110 78" stroke="#c4a484" strokeWidth="1.5" fill="none" />
        {/* shirt */}
        <path d="M72 108 Q100 98 128 108 L128 118 L72 118 Z" fill="#6366f1" opacity="0.75" />
        {/* laptop base */}
        <rect x="-8" y="218" width="216" height="10" rx="4" fill="#2d2e3e" />
      </g>

      {/* Man — video call window, right */}
      <g transform="translate(268, 36)">
        <rect x="0" y="0" width="220" height="168" rx="14" fill="url(#mi-screen)" stroke="#6366f1" strokeOpacity="0.45" strokeWidth="1.5" />
        <rect x="10" y="10" width="200" height="128" rx="8" fill="#0f111a" />
        {/* man face */}
        <circle cx="110" cy="68" r="36" fill="#fcd9bd" />
        <path d="M74 52 Q110 28 146 52 Q150 68 140 78 Q110 58 80 78 Q70 68 74 52" fill="#1e1f2e" />
        <circle cx="96" cy="66" r="3" fill="#1e1f2e" />
        <circle cx="124" cy="66" r="3" fill="#1e1f2e" />
        <path d="M98 82 Q110 90 122 82" stroke="#c4a484" strokeWidth="1.5" fill="none" />
        {/* waving hand */}
        <path
          d="M148 72 Q172 52 168 36 Q162 28 154 36 Q148 46 148 58"
          stroke="#fcd9bd"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        {/* shirt in window */}
        <path d="M82 98 Q110 88 138 98 L138 118 L82 118 Z" fill="#4f46e5" opacity="0.8" />
        {/* toolbar */}
        <rect x="10" y="144" width="200" height="14" rx="7" fill="#161722" />
        <circle cx="36" cy="151" r="5" fill="#6366f1" opacity="0.6" />
        <circle cx="60" cy="151" r="5" fill="#6366f1" opacity="0.6" />
        <circle cx="184" cy="151" r="6" fill="#ef4444" />
      </g>

      {/* Floating toolbar between */}
      <g transform="translate(195, 24)">
        <rect x="0" y="0" width="150" height="32" rx="16" fill="#161722" stroke="#6366f1" strokeOpacity="0.4" />
        <circle cx="28" cy="16" r="10" fill="#6366f1" opacity="0.25" />
        <rect x="22" y="12" width="12" height="8" rx="2" fill="#a5b4fc" />
        <circle cx="68" cy="16" r="10" fill="#6366f1" opacity="0.25" />
        <rect x="65" y="10" width="6" height="10" rx="3" fill="#a5b4fc" />
        <circle cx="118" cy="16" r="12" fill="#ef4444" />
        <path d="M110 16 L126 16 M118 8 L118 24" stroke="white" strokeWidth="2" strokeLinecap="round" transform="rotate(135 118 16)" />
      </g>

      {/* Decorative dots */}
      <circle cx="480" cy="40" r="3" fill="#818cf8" opacity="0.6" />
      <circle cx="500" cy="70" r="2" fill="#6366f1" opacity="0.4" />
      <circle cx="240" cy="280" r="2.5" fill="#a5b4fc" opacity="0.5" />
    </svg>
  )
}
