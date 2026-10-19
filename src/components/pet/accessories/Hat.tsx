import type { PoseAnchors } from "./anchors";

export default function Hat({ anchors }: { anchors: PoseAnchors }) {
  const { headTop } = anchors;
  const r = anchors.headRotate;
  const inner = (
    <>
      {/* brim */}
      <ellipse cx={headTop.x} cy={headTop.y + 14} rx="40" ry="8" fill="#5B86E5" />
      {/* dome */}
      <path
        d={`M${headTop.x - 26} ${headTop.y + 14} Q${headTop.x - 28} ${headTop.y - 12} ${headTop.x} ${headTop.y - 16} Q${headTop.x + 28} ${headTop.y - 12} ${headTop.x + 26} ${headTop.y + 14} Z`}
        fill="#5B86E5"
      />
      {/* band */}
      <rect x={headTop.x - 26} y={headTop.y + 4} width="52" height="8" rx="2" fill="#3A5FCD" />
    </>
  );
  if (r) return <g transform={`rotate(${r} 100 100)`}>{inner}</g>;
  return inner;
}
