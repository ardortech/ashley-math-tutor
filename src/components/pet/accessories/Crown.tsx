import type { PoseAnchors } from "./anchors";

export default function Crown({ anchors }: { anchors: PoseAnchors }) {
  const { headTop } = anchors;
  const r = anchors.headRotate;
  const cx = headTop.x;
  const cy = headTop.y;
  const inner = (
    <>
      {/* crown body */}
      <path
        d={`M${cx - 24} ${cy + 10}
            L${cx - 26} ${cy - 8}
            L${cx - 14} ${cy}
            L${cx} ${cy - 14}
            L${cx + 14} ${cy}
            L${cx + 26} ${cy - 8}
            L${cx + 24} ${cy + 10} Z`}
        fill="#F1C40F"
        stroke="#D4AC0D"
        strokeWidth="1.5"
      />
      {/* gems */}
      <circle cx={cx - 14} cy={cy + 2} r="3" fill="#E74C3C" />
      <circle cx={cx} cy={cy - 4} r="3" fill="#3498DB" />
      <circle cx={cx + 14} cy={cy + 2} r="3" fill="#2ECC71" />
      {/* base band */}
      <rect x={cx - 24} y={cy + 6} width="48" height="6" rx="1.5" fill="#D4AC0D" />
    </>
  );
  if (r) return <g transform={`rotate(${r} 100 100)`}>{inner}</g>;
  return inner;
}
