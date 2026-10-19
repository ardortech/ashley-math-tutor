import type { PoseAnchors } from "./anchors";

export default function Glasses({ anchors }: { anchors: PoseAnchors }) {
  const { eyes } = anchors;
  const r = anchors.headRotate;
  const inner = (
    <>
      {/* left lens */}
      <circle cx={eyes.x - 22} cy={eyes.y} r="14" stroke="#4A3728" strokeWidth="3" fill="none" />
      {/* right lens */}
      <circle cx={eyes.x + 22} cy={eyes.y} r="14" stroke="#4A3728" strokeWidth="3" fill="none" />
      {/* bridge */}
      <path
        d={`M${eyes.x - 8} ${eyes.y - 2} Q${eyes.x} ${eyes.y - 6} ${eyes.x + 8} ${eyes.y - 2}`}
        stroke="#4A3728"
        strokeWidth="2.5"
        fill="none"
      />
      {/* left arm */}
      <line
        x1={eyes.x - 36}
        y1={eyes.y - 2}
        x2={eyes.x - 46}
        y2={eyes.y - 6}
        stroke="#4A3728"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* right arm */}
      <line
        x1={eyes.x + 36}
        y1={eyes.y - 2}
        x2={eyes.x + 46}
        y2={eyes.y - 6}
        stroke="#4A3728"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </>
  );
  if (r) return <g transform={`rotate(${r} 100 100)`}>{inner}</g>;
  return inner;
}
