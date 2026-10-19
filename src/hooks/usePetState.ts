import { useState, useCallback } from "react";
import { getPetState, savePetState, type PetState } from "../lib/storage";
import {
  levelFromSolves,
  nextThreshold,
  unlockedAccessoryIds,
  resolveEquipped,
} from "../lib/accessories";

function migrateOnLoad(pet: PetState): PetState {
  const shouldUnlock = unlockedAccessoryIds(pet.solvedCount);
  const needsMigration = shouldUnlock.some((id) => !pet.accessories.includes(id));
  if (!needsMigration) return pet;
  const migrated = {
    ...pet,
    accessories: [...new Set([...pet.accessories, ...shouldUnlock])],
  };
  savePetState(migrated);
  return migrated;
}

export function usePetState() {
  const [pet, setPetInner] = useState<PetState>(() => migrateOnLoad(getPetState()));

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

  const toggleAccessory = useCallback(
    (id: string) => {
      setPet((p) => {
        if (!p.accessories.includes(id)) return p;
        const isEquipped = p.equippedAccessories.includes(id);
        if (isEquipped) {
          return {
            ...p,
            equippedAccessories: p.equippedAccessories.filter((a) => a !== id),
          };
        }
        const newEquipped = [...p.equippedAccessories, id];
        return { ...p, equippedAccessories: resolveEquipped(newEquipped) };
      });
    },
    [setPet],
  );

  const level = levelFromSolves(pet.solvedCount);
  const next = nextThreshold(pet.solvedCount);
  const remaining = next !== null ? next - pet.solvedCount : 0;

  return {
    pet,
    setPet,
    feedSnack,
    toggleAccessory,
    level,
    remaining,
    maxedOut: next === null,
  };
}
