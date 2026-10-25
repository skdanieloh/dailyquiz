export type StageResult = {
  correct: boolean;
  summary: string;
};

export type Interference = {
  shapes: string[];
  target: string;
  targetName: string;
  answer: number;
};

export type SequenceTrial = {
  kind: "sequence";
  mode: "digit" | "spatial" | "color";
  reverse: boolean;
  grid: number;
  encodeMs: number;
  gapMs: number;
  sequence: number[];
  answer: number[];
  interference: Interference | null;
  colors?: { name: string; hex: string }[];
};

export type NBackTrial = {
  kind: "nback";
  n: number;
  encodeMs: number;
  stimuli: string[];
  targets: number[];
};

export type UpdateTrial = {
  kind: "update";
  encodeMs: number;
  boxes: string[];
  events: { box: number; item: string }[];
  answers: string[];
  choices: string[];
};

export type DualTrial = {
  kind: "dual";
  encodeMs: number;
  steps: { equation: string; truth: boolean; letter: string }[];
  letters: string[];
  choices: string[];
};

export type Trial = SequenceTrial | NBackTrial | UpdateTrial | DualTrial;

export type Mission = {
  id: string;
  day: number;
  date: string;
  type: string;
  phase: string;
  subject: string;
  title: string;
  difficulty: number;
  difficultyLabel: string;
  lead: string;
  steps: string[];
  trials: Trial[];
};

export type Curriculum = {
  startDate: string;
  days: number;
  missions: Mission[];
};

export type Attempt = {
  date: string;
  missionId: string;
  type: string;
  phase: string;
  subject: string;
  title: string;
  difficulty: number;
  difficultyLabel: string;
  correctCount: number;
  maxStages: 5;
  reward: number;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  stages: StageResult[];
};
