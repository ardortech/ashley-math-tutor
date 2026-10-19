export interface AccessoryDef {
  id: string;
  name: string;
  unlockSolves: number;
  /** Which poses show this accessory */
  poses: ("sit" | "cheer" | "head")[];
  /** Accessories in the same slot — equipping one unequips the other */
  slot?: string;
}

export const ACCESSORIES: AccessoryDef[] = [
  { id: "scarf", name: "小領巾", unlockSolves: 1, poses: ["sit", "cheer"] },
  { id: "hat", name: "帽子", unlockSolves: 5, poses: ["sit", "cheer", "head"], slot: "headwear" },
  { id: "glasses", name: "眼鏡", unlockSolves: 15, poses: ["sit", "cheer", "head"] },
  { id: "cape", name: "披風", unlockSolves: 30, poses: ["sit", "cheer"] },
  { id: "crown", name: "皇冠", unlockSolves: 50, poses: ["sit", "cheer", "head"], slot: "headwear" },
];

export const LEVEL_THRESHOLDS = [1, 5, 15, 30, 50];

export function levelFromSolves(solvedCount: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (solvedCount >= LEVEL_THRESHOLDS[i]!) level = i + 2;
  }
  return level;
}

export function nextThreshold(solvedCount: number): number | null {
  for (const t of LEVEL_THRESHOLDS) {
    if (solvedCount < t) return t;
  }
  return null;
}

export function unlockedAccessoryIds(solvedCount: number): string[] {
  return ACCESSORIES.filter((a) => solvedCount >= a.unlockSolves).map((a) => a.id);
}

export function newlyUnlockedAccessories(
  prevSolvedCount: number,
  newSolvedCount: number,
): AccessoryDef[] {
  return ACCESSORIES.filter(
    (a) => prevSolvedCount < a.unlockSolves && newSolvedCount >= a.unlockSolves,
  );
}

export function resolveEquipped(equipped: string[]): string[] {
  const result: string[] = [];
  const seenSlots = new Set<string>();
  for (let i = equipped.length - 1; i >= 0; i--) {
    const acc = ACCESSORIES.find((a) => a.id === equipped[i]);
    if (!acc) continue;
    if (acc.slot) {
      if (seenSlots.has(acc.slot)) continue;
      seenSlots.add(acc.slot);
    }
    result.unshift(acc.id);
  }
  return result;
}

export function accessoryVisibleForPose(
  accId: string,
  pose: "sit" | "cheer" | "head",
): boolean {
  const acc = ACCESSORIES.find((a) => a.id === accId);
  return acc ? acc.poses.includes(pose) : false;
}
