export default function TiaoTiaoHeadHappy({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      role="img"
      aria-label="跳跳"
      className={className}
    >
      <path d="M62 78 C48 58 38 40 42 28 C52 22 72 34 86 60 Z" fill="#1E1E23" />
      <path d="M138 78 C152 58 162 40 158 28 C148 22 128 34 114 60 Z" fill="#1E1E23" />
      <ellipse cx="100" cy="100" rx="58" ry="52" fill="#2B2B31" />
      <ellipse cx="100" cy="132" rx="36" ry="27" fill="#BDB7AE" />
      <ellipse cx="100" cy="128" rx="24" ry="18" fill="#D6D1CA" />
      <ellipse cx="78" cy="80" rx="9" ry="5" fill="#EADCC2" />
      <ellipse cx="122" cy="80" rx="9" ry="5" fill="#EADCC2" />
      <g className="pet-eyes">
        <path d="M68 98 Q77 89 86 98" stroke="#0F0F12" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M114 98 Q123 89 132 98" stroke="#0F0F12" strokeWidth="5" fill="none" strokeLinecap="round" />
      </g>
      <ellipse cx="100" cy="117" rx="12" ry="9" fill="#111114" />
      <path d="M84 134 Q100 148 116 134" stroke="#111114" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M93 141 Q100 158 107 141 Z" fill="#F28BA8" />
    </svg>
  );
}
