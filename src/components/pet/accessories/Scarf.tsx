import type { PoseAnchors } from "./anchors";

export default function Scarf({ anchors }: { anchors: PoseAnchors }) {
  const { neck } = anchors;
  const r = anchors.headRotate;
  const inner = (
    <>
      <path
        d={`M${neck.x - 38} ${neck.y - 2} Q${neck.x} ${neck.y + 18} ${neck.x + 38} ${neck.y - 2}`}
        stroke="#E74C3C"
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={`M${neck.x + 10} ${neck.y + 6} L${neck.x + 16} ${neck.y + 28} L${neck.x + 24} ${neck.y + 26} L${neck.x + 18} ${neck.y + 4} Z`}
        fill="#E74C3C"
      />
      <path
        d={`M${neck.x + 16} ${neck.y + 28} L${neck.x + 14} ${neck.y + 32}`}
        stroke="#C0392B"
        strokeWidth="2"
        fill="none"
      />
      <path
        d={`M${neck.x + 24} ${neck.y + 26} L${neck.x + 22} ${neck.y + 30}`}
        stroke="#C0392B"
        strokeWidth="2"
        fill="none"
      />
    </>
  );
  if (r) return <g transform={`rotate(${r} 100 100)`}>{inner}</g>;
  return inner;
}
