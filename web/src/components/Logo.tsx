export function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <g transform="rotate(-40 16 16)">
        <rect x="3" y="9" width="26" height="14" rx="7" fill="currentColor" />
        <path d="M16 9h6a7 7 0 0 1 0 14h-6z" fill="#fff" fillOpacity=".85" />
      </g>
      <circle cx="9.5" cy="6.5" r="2" fill="currentColor" />
      <circle cx="14.5" cy="4.5" r="1.6" fill="currentColor" />
    </svg>
  )
}
