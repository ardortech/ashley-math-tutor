import {
  getPetState,
  savePetState,
  addSolveEntry,
  isScoredProblem,
  markProblemScored,
  type Subject,
} from "./storage";
import {
  levelFromSolves,
  unlockedAccessoryIds,
  newlyUnlockedAccessories,
  type AccessoryDef,
} from "./accessories";

export interface ScoreResult {
  scored: boolean;
  snacksEarned: number;
  prevLevel: number;
  newLevel: number;
  newSolvedCount: number;
  newAccessories: AccessoryDef[];
  equippedAccessories: string[];
}

export function recordSolve(opts: {
  subject: Subject;
  problemId: string;
  topic: string;
  usedHints: boolean;
  snackAmount: number;
}): ScoreResult {
  const { subject, problemId, topic, usedHints, snackAmount } = opts;

  if (isScoredProblem(problemId)) {
    const pet = getPetState();
    return {
      scored: false,
      snacksEarned: 0,
      prevLevel: levelFromSolves(pet.solvedCount),
      newLevel: levelFromSolves(pet.solvedCount),
      newSolvedCount: pet.solvedCount,
      newAccessories: [],
      equippedAccessories: pet.equippedAccessories,
    };
  }

  markProblemScored(problemId);
  addSolveEntry(topic, usedHints, subject);

  const pet = getPetState();
  const prevCount = pet.solvedCount;
  const newCount = prevCount + 1;
  const prevLevel = levelFromSolves(prevCount);
  const newLevel = levelFromSolves(newCount);

  const newAcc = newlyUnlockedAccessories(prevCount, newCount);
  const allUnlocked = unlockedAccessoryIds(newCount);

  savePetState({
    ...pet,
    solvedCount: newCount,
    snacks: pet.snacks + snackAmount,
    accessories: [...new Set([...pet.accessories, ...allUnlocked])],
  });

  return {
    scored: true,
    snacksEarned: snackAmount,
    prevLevel,
    newLevel,
    newSolvedCount: newCount,
    newAccessories: newAcc,
    equippedAccessories: pet.equippedAccessories,
  };
}
