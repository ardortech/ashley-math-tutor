import type { PoseAnchors } from "./anchors";

export default function Cape({ anchors }: { anchors: PoseAnchors }) {
  const { back } = anchors;
  const r = anchors.headRotate;
  const inner = (
    <>
      {/* cape body — flows from shoulders down the back */}
      <path
        d={`M${back.x - 44} ${back.y - 22}
            Q${back.x - 50} ${back.y + 30} ${back.x - 36} ${back.y + 56}
            Q${back.x} ${back.y + 68} ${back.x + 36} ${back.y + 56}
            Q${back.x + 50} ${back.y + 30} ${back.x + 44} ${back.y - 22} Z`}
        fill="#8E44AD"
        opacity="0.92"
      />
      {/* cape inner lining */}
      <path
        d={`M${back.x - 36} ${back.y - 16}
            Q${back.x - 40} ${back.y + 24} ${back.x - 28} ${back.y + 46}
            Q${back.x} ${back.y + 56} ${back.x + 28} ${back.y + 46}
            Q${back.x + 40} ${back.y + 24} ${back.x + 36} ${back.y - 16} Z`}
        fill="#9B59B6"
        opacity="0.5"
      />
      {/* clasp */}
      <circle cx={back.x} cy={back.y - 20} r="5" fill="#F1C40F" />
    </>
  );
  if (r) return <g transform={`rotate(${r} 100 100)`}>{inner}</g>;
  return inner;
}
