/** Ilustracion estatica del hero (frasco + capsulas). Tambien es el fallback de la escena 3D. */
export function HeroVisual() {
  return (
    <div className="hero-visual" aria-hidden="true">
      <div className="hero-ring" />
      <svg viewBox="0 0 300 320" className="hero-art">
        <defs>
          <linearGradient id="hv-glass" x1="0" x2="1"><stop offset="0" stopColor="#fff" stopOpacity=".95" /><stop offset="1" stopColor="#d9d0f8" stopOpacity=".9" /></linearGradient>
          <linearGradient id="hv-cap" x1="0" x2="1"><stop offset="0" stopColor="#8e7bd8" /><stop offset="1" stopColor="#5a40b8" /></linearGradient>
        </defs>
        <ellipse cx="150" cy="292" rx="96" ry="16" fill="#6a4fcb" opacity=".16" />
        <rect x="92" y="96" width="116" height="188" rx="34" fill="url(#hv-glass)" stroke="#bcaef0" strokeWidth="2" />
        <rect x="104" y="150" width="92" height="82" rx="14" fill="#fff" />
        <rect x="116" y="164" width="44" height="8" rx="4" fill="#6a4fcb" /><rect x="116" y="180" width="64" height="6" rx="3" fill="#bcaef0" />
        <path d="M150 196v22M139 207h22" stroke="#6a4fcb" strokeWidth="6" strokeLinecap="round" />
        <rect x="104" y="50" width="92" height="56" rx="18" fill="url(#hv-cap)" />
        <g transform="rotate(-28 236 250)"><rect x="206" y="236" width="60" height="28" rx="14" fill="url(#hv-cap)" /><path d="M236 236h16a14 14 0 0 1 0 28h-16z" fill="#fff" /></g>
      </svg>
    </div>
  )
}
