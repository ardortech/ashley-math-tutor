import { resolveEquipped, accessoryVisibleForPose } from "../../lib/accessories";
import {
  SIT_ANCHORS,
  CHEER_ANCHORS,
  HEAD_ANCHORS,
  HEAD_CURIOUS_ANCHORS,
} from "./accessories/anchors";
import type { PoseAnchors } from "./accessories/anchors";
import Scarf from "./accessories/Scarf";
import Hat from "./accessories/Hat";
import Glasses from "./accessories/Glasses";
import Cape from "./accessories/Cape";
import Crown from "./accessories/Crown";

type Pose = "sit" | "cheer" | "head-happy" | "head-curious";

interface Props {
  pose: Pose;
  equipped: string[];
  className?: string;
  children?: React.ReactNode;
}

function poseToType(pose: Pose): "sit" | "cheer" | "head" {
  if (pose === "sit") return "sit";
  if (pose === "cheer") return "cheer";
  return "head";
}

function getAnchors(pose: Pose): PoseAnchors {
  switch (pose) {
    case "sit": return SIT_ANCHORS;
    case "cheer": return CHEER_ANCHORS;
    case "head-curious": return HEAD_CURIOUS_ANCHORS;
    default: return HEAD_ANCHORS;
  }
}

const ACC_COMPONENTS: Record<string, React.ComponentType<{ anchors: PoseAnchors }>> = {
  scarf: Scarf,
  hat: Hat,
  glasses: Glasses,
  cape: Cape,
  crown: Crown,
};

function renderAccessories(
  equipped: string[],
  pose: Pose,
  layer: "behind" | "front",
) {
  const resolved = resolveEquipped(equipped);
  const poseType = poseToType(pose);
  const anchors = getAnchors(pose);
  const behind = ["cape"];

  return resolved
    .filter((id) => accessoryVisibleForPose(id, poseType))
    .filter((id) => (layer === "behind" ? behind.includes(id) : !behind.includes(id)))
    .map((id) => {
      const Comp = ACC_COMPONENTS[id];
      if (!Comp) return null;
      return <Comp key={id} anchors={anchors} />;
    });
}

/* ── Sit pose ── */
function SitBody({ equipped }: { equipped: string[] }) {
  return (
    <>
      <ellipse cx="100" cy="228" rx="66" ry="8" fill="#1B2638" opacity="0.08" />
      {/* tail */}
      <path d="M146 200 C174 196 182 172 172 156" stroke="#2B2B31" strokeWidth="12" fill="none" strokeLinecap="round" />
      {/* hind legs */}
      <ellipse cx="62" cy="204" rx="24" ry="20" fill="#26262B" />
      <ellipse cx="138" cy="204" rx="24" ry="20" fill="#26262B" />
      {/* cape behind body */}
      {renderAccessories(equipped, "sit", "behind")}
      {/* body */}
      <ellipse cx="100" cy="178" rx="50" ry="46" fill="#2B2B31" />
      {/* chest */}
      <path d="M92 150 C82 170 86 196 100 206 C114 196 118 170 108 150 Z" fill="#F4F1EC" />
      {/* front legs */}
      <rect x="72" y="180" width="22" height="40" rx="11" fill="#2B2B31" />
      <rect x="106" y="180" width="22" height="40" rx="11" fill="#2B2B31" />
      {/* paws */}
      <ellipse cx="83" cy="220" rx="14" ry="8" fill="#E6E2DC" />
      <ellipse cx="117" cy="220" rx="14" ry="8" fill="#E6E2DC" />
      {/* head */}
      <g transform="translate(0,-12)">
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
      </g>
      {/* collar */}
      <path d="M62 140 Q100 164 138 140" stroke="#F07A9A" strokeWidth="9" fill="none" strokeLinecap="round" />
      <circle cx="100" cy="160" r="7" fill="#FFC34D" />
      {/* front accessories */}
      {renderAccessories(equipped, "sit", "front")}
    </>
  );
}

/* ── Cheer pose ── */
function CheerBody({ equipped }: { equipped: string[] }) {
  return (
    <>
      <ellipse cx="100" cy="232" rx="50" ry="7" fill="#1B2638" opacity="0.08" />
      {/* tail */}
      <path d="M146 196 C176 184 184 156 170 140" stroke="#2B2B31" strokeWidth="12" fill="none" strokeLinecap="round" />
      <path d="M178 150 Q186 156 184 166" stroke="#F08A24" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* hind legs */}
      <ellipse cx="62" cy="200" rx="24" ry="20" fill="#26262B" />
      <ellipse cx="138" cy="200" rx="24" ry="20" fill="#26262B" />
      <ellipse cx="62" cy="220" rx="15" ry="8" fill="#E6E2DC" />
      <ellipse cx="138" cy="220" rx="15" ry="8" fill="#E6E2DC" />
      {/* cape behind body */}
      {renderAccessories(equipped, "cheer", "behind")}
      {/* body */}
      <ellipse cx="100" cy="176" rx="50" ry="46" fill="#2B2B31" />
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
        <path d="M82 132 Q100 152 118 132 Z" fill="#111114" />
        <path d="M92 140 Q100 162 108 140 Z" fill="#F28BA8" />
      </g>
      {/* collar */}
      <path d="M62 140 Q100 164 138 140" stroke="#F07A9A" strokeWidth="9" fill="none" strokeLinecap="round" />
      <circle cx="100" cy="160" r="7" fill="#FFC34D" />
      {/* front accessories */}
      {renderAccessories(equipped, "cheer", "front")}
    </>
  );
}

/* ── Head happy pose ── */
function HeadHappyBody({ equipped }: { equipped: string[] }) {
  return (
    <>
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
      {renderAccessories(equipped, "head-happy", "front")}
    </>
  );
}

/* ── Head curious pose ── */
function HeadCuriousBody({ equipped }: { equipped: string[] }) {
  return (
    <>
      <g transform="rotate(-10 100 100)">
        <path d="M62 78 C48 58 38 40 42 28 C52 22 72 34 86 60 Z" fill="#1E1E23" />
        <path d="M138 78 C152 58 162 40 158 28 C148 22 128 34 114 60 Z" fill="#1E1E23" />
        <ellipse cx="100" cy="100" rx="58" ry="52" fill="#2B2B31" />
        <ellipse cx="100" cy="132" rx="36" ry="27" fill="#BDB7AE" />
        <ellipse cx="100" cy="128" rx="24" ry="18" fill="#D6D1CA" />
        <ellipse cx="78" cy="78" rx="9" ry="5" fill="#EADCC2" />
        <ellipse cx="122" cy="82" rx="9" ry="5" fill="#EADCC2" />
        <circle cx="78" cy="96" r="7" fill="#0F0F12" />
        <circle cx="122" cy="96" r="7" fill="#0F0F12" />
        <circle cx="80.5" cy="93.5" r="2.4" fill="#FFFFFF" />
        <circle cx="124.5" cy="93.5" r="2.4" fill="#FFFFFF" />
        <ellipse cx="100" cy="117" rx="12" ry="9" fill="#111114" />
        <path d="M90 138 Q100 141 110 138" stroke="#111114" strokeWidth="4" fill="none" strokeLinecap="round" />
      </g>
      {renderAccessories(equipped, "head-curious", "front")}
    </>
  );
}

export default function TiaoTiaoWithAccessories({ pose, equipped, className = "", children }: Props) {
  const viewBox = pose === "sit" || pose === "cheer" ? "0 0 200 240" : "0 0 200 200";
  const label =
    pose === "cheer" ? "跳跳開心地跳起來" :
    pose === "head-curious" ? "跳跳歪頭想一想" : "跳跳";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      role="img"
      aria-label={label}
      className={className}
    >
      {pose === "sit" && <SitBody equipped={equipped} />}
      {pose === "cheer" && <CheerBody equipped={equipped} />}
      {pose === "head-happy" && <HeadHappyBody equipped={equipped} />}
      {pose === "head-curious" && <HeadCuriousBody equipped={equipped} />}
      {children}
    </svg>
  );
}
