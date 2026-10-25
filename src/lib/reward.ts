export const STAGE_COUNT = 5;
export const MIN_REWARD = 500;
export const STEP_REWARD = 100;

export function rewardOf(correctCount: number) {
  const correct = Math.max(0, Math.min(STAGE_COUNT, Math.round(correctCount)));
  return MIN_REWARD + correct * STEP_REWARD;
}
