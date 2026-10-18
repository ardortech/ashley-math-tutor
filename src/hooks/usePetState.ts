import { useState, useCallback } from "react";
import { getPetState, savePetState, type PetState } from "../lib/storage";

const LEVEL_THRESHOLDS = [1, 5, 15, 30, 50];

function computeLevel(solvedCount: number): number {
  let level = 1;
  for (const t of LEVEL_THRESHOLDS) {
    if (solvedCount >= t) level = LEVEL_THRESHOLDS.indexOf(t) + 2;
  }
  return Math.min(level, LEVEL_THRESHOLDS.length + 1);
}

function nextThreshold(solvedCount: number): number | null {
  for (const t of LEVEL_THRESHOLDS) {
    if (solvedCount < t) return t;
  }
  return null;
}

export function usePetState() {
  const [pet, setPetInner] = useState<PetState>(getPetState);

  const setPet = useCallback((updater: (prev: PetState) => PetState) => {
    setPetInner((prev) => {
      const next = updater(prev);
      savePetState(next);
      return next;
    });
  }, []);

  const feedSnack = useCallback(() => {
    setPet((p) =>
      p.snacks > 0 ? { ...p, snacks: p.snacks - 1 } : p,
    );
  }, [setPet]);

  const level = computeLevel(pet.solvedCount);
  const next = nextThreshold(pet.solvedCount);
  const remaining = next !== null ? next - pet.solvedCount : 0;

  return { pet, setPet, feedSnack, level, remaining, maxedOut: next === null };
}
