export default function TiaoTiaoCheer({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 240"
      role="img"
      aria-label="跳跳開心地跳起來"
      className={className}
    >
      <ellipse cx="100" cy="232" rx="50" ry="7" fill="#1B2638" opacity="0.08" />
      {/* tail with wag marks */}
      <path d="M146 196 C176 184 184 156 170 140" stroke="#2B2B31" strokeWidth="12" fill="none" strokeLinecap="round" />
      <path d="M178 150 Q186 156 184 166" stroke="#F08A24" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* hind legs */}
      <ellipse cx="62" cy="200" rx="24" ry="20" fill="#26262B" />
      <ellipse cx="138" cy="200" rx="24" ry="20" fill="#26262B" />
      {/* paws */}
      <ellipse cx="62" cy="220" rx="15" ry="8" fill="#E6E2DC" />
      <ellipse cx="138" cy="220" rx="15" ry="8" fill="#E6E2DC" />
      {/* body */}
      <ellipse cx="100" cy="176" rx="50" ry="46" fill="#2B2B31" />
      {/* chest */}
      <path d="M92 150 C82 170 86 196 100 206 C114 196 118 170 108 150 Z" fill="#F4F1EC" />
      {/* raised front legs */}
      <path d="M74 168 L42 134" stroke="#2B2B31" strokeWidth="20" strokeLinecap="round" />
      <path d="M126 168 L158 134" stroke="#2B2B31" strokeWidth="20" strokeLinecap="round" />
      <circle cx="40" cy="130" r="12" fill="#E6E2DC" />
      <circle cx="160" cy="130" r="12" fill="#E6E2DC" />
      {/* head */}
      <g transform="translate(0,-12)">
        <path d="M62 78 C48 58 38 40 42 28 C52 22 72 34 86 60 Z" fill="#1E1E23" />
        <path d="M138 78 C152 58 162 40 158 28 C148 22 128 34 114 60 Z" fill="#1E1E23" />
        <ellipse cx="100" cy="100" rx="58" ry="52" fill="#2B2B31" />
        <ellipse cx="100" cy="132" rx="36" ry="27" fill="#BDB7AE" />
        <ellipse cx="100" cy="128" rx="24" ry="18" fill="#D6D1CA" />
        <ellipse cx="78" cy="78" rx="9" ry="5" fill="#EADCC2" />
        <ellipse cx="122" cy="78" rx="9" ry="5" fill="#EADCC2" />
        <g className="pet-eyes">
          <path d="M68 98 Q77 89 86 98" stroke="#0F0F12" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M114 98 Q123 89 132 98" stroke="#0F0F12" strokeWidth="5" fill="none" strokeLinecap="round" />
        </g>
        <ellipse cx="100" cy="117" rx="12" ry="9" fill="#111114" />
        {/* open mouth */}
        <path d="M82 132 Q100 152 118 132 Z" fill="#111114" />
        <path d="M92 140 Q100 162 108 140 Z" fill="#F28BA8" />
      </g>
      {/* collar */}
      <path d="M62 140 Q100 164 138 140" stroke="#F07A9A" strokeWidth="9" fill="none" strokeLinecap="round" />
      <circle cx="100" cy="160" r="7" fill="#FFC34D" />
    </svg>
  );
}
