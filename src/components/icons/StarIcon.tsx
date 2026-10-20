interface Props {
  filled: boolean;
  className?: string;
}

export default function StarIcon({ filled, className = "" }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "#F2B526" : "none"}
      stroke={filled ? "#C27A00" : "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
