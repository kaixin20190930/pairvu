type PairvuLogoProps = {
  compact?: boolean;
  tone?: "light" | "dark";
  className?: string;
};

export function PairvuLogo({ compact = false, tone = "light", className }: PairvuLogoProps) {
  const wordmarkColor = tone === "dark" ? "#ffffff" : "#0b133f";

  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox={compact ? "0 0 72 72" : "0 0 236 72"}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="pairvu-brand-gradient" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#2f80ff" />
          <stop offset="1" stopColor="#7a4dff" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#pairvu-brand-gradient)" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="19" width="28" height="29" rx="6" strokeWidth="5" />
        <path d="m9 42 8-8 7 7 4-4 5 5" strokeWidth="4" />
        <rect x="39" y="19" width="28" height="29" rx="6" strokeWidth="5" />
        <path d="m43 42 8-8 7 7 4-4 5 5" strokeWidth="4" />
        <circle cx="36" cy="34" r="11" fill={tone === "dark" ? "#0b133f" : "#ffffff"} strokeWidth="5" />
        <circle cx="36" cy="34" r="3" fill="url(#pairvu-brand-gradient)" stroke="none" />
        <circle cx="36" cy="58" r="8" fill="url(#pairvu-brand-gradient)" stroke="none" />
        <path d="m32.5 58 2.4 2.4 5-5.2" stroke="#ffffff" strokeWidth="2.8" />
      </g>
      <path d="m29 12 2.2 4.8L36 19l-4.8 2.2L29 26l-2.2-4.8L22 19l4.8-2.2z" fill="#2f80ff" />
      <path d="m42 8 1.5 3.2L47 13l-3.5 1.5L42 18l-1.5-3.5L37 13l3.5-1.8z" fill="#7a4dff" />
      {!compact ? (
        <text
          x="82"
          y="48"
          fill={wordmarkColor}
          fontFamily="Manrope, Inter, Arial, sans-serif"
          fontSize="48"
          fontWeight="700"
          letterSpacing="0"
        >
          pair<tspan fill="url(#pairvu-brand-gradient)">vu</tspan>
        </text>
      ) : null}
    </svg>
  );
}
