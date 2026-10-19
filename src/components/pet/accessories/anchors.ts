export interface PoseAnchors {
  headTop: { x: number; y: number };
  eyes: { x: number; y: number };
  neck: { x: number; y: number };
  back: { x: number; y: number };
  headRotate?: number;
}

export const SIT_ANCHORS: PoseAnchors = {
  headTop: { x: 100, y: 36 },
  eyes: { x: 100, y: 86 },
  neck: { x: 100, y: 140 },
  back: { x: 100, y: 160 },
};

export const CHEER_ANCHORS: PoseAnchors = {
  headTop: { x: 100, y: 36 },
  eyes: { x: 100, y: 86 },
  neck: { x: 100, y: 140 },
  back: { x: 100, y: 160 },
};

export const HEAD_ANCHORS: PoseAnchors = {
  headTop: { x: 100, y: 20 },
  eyes: { x: 100, y: 96 },
  neck: { x: 100, y: 160 },
  back: { x: 100, y: 160 },
};

export const HEAD_CURIOUS_ANCHORS: PoseAnchors = {
  headTop: { x: 100, y: 20 },
  eyes: { x: 100, y: 96 },
  neck: { x: 100, y: 160 },
  back: { x: 100, y: 160 },
  headRotate: -10,
};
