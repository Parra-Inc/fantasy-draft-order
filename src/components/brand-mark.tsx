export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="86 86 340 340"
      xmlns="http://www.w3.org/2000/svg"
      className={`h-9 w-9 ${className}`}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="brand-gradient" cx=".35" cy=".3" r=".8">
          <stop offset="0" stopColor="#3eff99" />
          <stop offset=".55" stopColor="#00e676" />
          <stop offset="1" stopColor="#007a3e" />
        </radialGradient>
      </defs>
      <circle cx="256" cy="256" fill="url(#brand-gradient)" r="170" />
      <circle cx="256" cy="256" fill="#f5f5f0" r="90" />
      <text
        fill="#0a1628"
        fontFamily="'DM Mono', ui-monospace, monospace"
        fontSize="120"
        fontWeight="700"
        textAnchor="middle"
        x="256"
        y="296"
      >
        1
      </text>
      <ellipse cx="200" cy="180" fill="#fff" opacity=".3" rx="36" ry="20" />
      <g
        fill="none"
        opacity=".5"
        stroke="#00e676"
        strokeLinecap="round"
        strokeWidth="5"
      >
        <path d="m86 256a170 170 0 0 1 36-86" />
        <path d="m426 256a170 170 0 0 1 -36-86" />
      </g>
    </svg>
  );
}
