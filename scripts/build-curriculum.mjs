import { mkdirSync, writeFileSync } from "node:fs";

const START = "2026-10-25";
const DAYS = 400;

const COLORS = [
  { name: "빨강", hex: "#f04452" },
  { name: "파랑", hex: "#3182f6" },
  { name: "노랑", hex: "#ffc342" },
  { name: "초록", hex: "#03b26c" },
  { name: "보라", hex: "#a234c7" },
  { name: "주황", hex: "#ff8a00" },
];

const SHAPES = [
  { glyph: "●", name: "동그라미" },
  { glyph: "▲", name: "세모" },
  { glyph: "■", name: "네모" },
];

const LETTERS = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅎ"];
const NBACK = ["●", "▲", "■", "★", "♥", "◆"];
const BOXES = ["가", "나", "다", "라"];

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sample(rng, list, count) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

function addDays(iso, days) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

function label(value) {
  if (value < 2.5) return "매우 쉬움";
  if (value < 4.5) return "쉬움";
  if (value < 6.5) return "보통";
  if (value < 8.5) return "어려움";
  return "매우 어려움";
}

function schedule(day) {
  if (day < 60) {
    return {
      phase: "기초 폭",
      types: ["digit-forward", "spatial", "color"],
      interference: false,
    };
  }
  if (day < 130) {
    return {
      phase: "역순 조작",
      types: ["digit-backward", "spatial-backward", "digit-forward", "color"],
      interference: false,
    };
  }
  if (day < 200) {
    return {
      phase: "작업 갱신",
      types: ["update", "nback", "digit-backward"],
      interference: false,
    };
  }
  if (day < 270) {
    return {
      phase: "이중 과제",
      types: ["dual", "nback", "update"],
      interference: false,
    };
  }
  if (day < 340) {
    return {
      phase: "간섭 통제",
      types: ["digit-forward", "spatial", "color", "digit-backward"],
      interference: true,
    };
  }
  return {
    phase: "통합",
    types: ["dual", "nback", "spatial-backward", "update", "digit-backward"],
    interference: false,
  };
}

function lengthsFor(day, min, max) {
  const mid = min + (day / 399) * (max - min);
  const lens = [];
  for (let i = 0; i < 5; i += 1) {
    let value = Math.round(mid + (i - 2) * 0.4);
    value = Math.max(min, Math.min(max, value));
    if (i > 0) value = Math.max(value, lens[i - 1]);
    lens.push(value);
  }
  return lens;
}

function timing(day) {
  const encodeMs = Math.max(460, Math.round(980 - (day * (980 - 460)) / 399));
  const gapMs = Math.max(120, Math.round(260 - (day * (260 - 120)) / 399));
  return { encodeMs, gapMs };
}

function makeDigits(rng, length, allowRepeat) {
  const seq = [];
  for (let i = 0; i < length; i += 1) {
    let n = Math.floor(rng() * 10);
    let guard = 0;
    while (!allowRepeat && i > 0 && n === seq[i - 1] && guard < 10) {
      n = Math.floor(rng() * 10);
      guard += 1;
    }
    seq.push(n);
  }
  return seq;
}

function makeIndexSeq(rng, length, size) {
  const pool = [...Array(size).keys()];
  if (length > pool.length) throw new Error("sequence longer than pool");
  return sample(rng, pool, length);
}

function interferenceFor(rng) {
  const shapes = Array.from({ length: 4 }, () => SHAPES[Math.floor(rng() * SHAPES.length)]);
  const target = shapes[Math.floor(rng() * shapes.length)];
  return {
    shapes: shapes.map((shape) => shape.glyph),
    target: target.glyph,
    targetName: target.name,
    answer: shapes.filter((shape) => shape.glyph === target.glyph).length,
  };
}

function meta(type, n) {
  const table = {
    "digit-forward": {
      subject: "숫자 폭",
      title: "앞으로 숫자 기억하기",
      lead: "숫자를 본 순서대로 눌러요.",
      steps: [
        "숫자가 하나씩 나타났다가 사라져요.",
        "같은 순서로 숫자를 누르고 확인을 눌러요.",
        "5단계가 끝나면 점수와 시간이 바로 열려요.",
      ],
    },
    "digit-backward": {
      subject: "역순 숫자",
      title: "숫자를 거꾸로 기억하기",
      lead: "숫자를 보고, 반대 순서로 눌러요.",
      steps: [
        "숫자가 하나씩 나타나요.",
        "마지막 숫자부터 거꾸로 입력해요.",
        "순서를 뒤집는 것이 이번 훈련의 핵심이에요.",
      ],
    },
    spatial: {
      subject: "위치 폭",
      title: "칸의 순서를 기억하기",
      lead: "불이 들어온 칸을 같은 순서로 눌러요.",
      steps: [
        "파란 불이 칸을 하나씩 지나가요.",
        "같은 순서로 칸을 눌러요.",
        "위치만 기억하면 돼요. 숫자는 없어요.",
      ],
    },
    "spatial-backward": {
      subject: "역순 위치",
      title: "칸을 거꾸로 기억하기",
      lead: "불이 들어온 칸을 반대 순서로 눌러요.",
      steps: [
        "파란 불이 지나간 순서를 봐요.",
        "마지막 칸부터 거꾸로 눌러요.",
        "본 순서 그대로 누르면 틀려요.",
      ],
    },
    color: {
      subject: "색깔 폭",
      title: "색깔 순서를 기억하기",
      lead: "색깔을 본 순서대로 눌러요.",
      steps: [
        "색깔이 하나씩 커졌다가 사라져요.",
        "같은 순서로 색깔을 눌러요.",
        "이름 대신 색만 기억해도 돼요.",
      ],
    },
    nback: {
      subject: "엔백",
      title: `${n}-back 같은 모양 찾기`,
      lead: `${n}개 전과 같은 모양이면 같아요를 눌러요.`,
      steps: [
        `모양이 하나씩 바뀌어요.`,
        `지금 모양이 ${n}개 전과 같으면 같아요를 눌러요.`,
        "같지 않으면 누르지 않아요.",
      ],
    },
    update: {
      subject: "작업 갱신",
      title: "마지막 숫자만 기억하기",
      lead: "칸마다 마지막에 들어온 숫자만 남겨요.",
      steps: [
        "숫자가 칸 안으로 들어왔다가 사라져요.",
        "같은 칸에 새 숫자가 오면 이전 숫자는 지워요.",
        "각 칸의 마지막 숫자만 고르면 돼요.",
      ],
    },
    dual: {
      subject: "이중 과제",
      title: "계산하면서 글자 기억하기",
      lead: "식이 맞는지 고르고, 글자는 순서대로 기억해요.",
      steps: [
        "덧셈이 맞으면 맞아요, 틀리면 아니에요.",
        "이어서 나타나는 글자를 순서대로 기억해요.",
        "계산과 글자를 모두 맞춰야 그 단계가 성공이에요.",
      ],
    },
  };
  return table[type];
}

function makeNback(rng, n, length) {
  const stimuli = Array.from({ length }, () => NBACK[Math.floor(rng() * NBACK.length)]);
  const candidates = [];
  for (let i = n; i < length; i += 1) candidates.push(i);
  const chosen = sample(rng, candidates, 2);
  const chosenSet = new Set(chosen);
  for (let i = n; i < length; i += 1) {
    if (chosenSet.has(i)) stimuli[i] = stimuli[i - n];
    else if (stimuli[i] === stimuli[i - n]) {
      stimuli[i] = NBACK.find((shape) => shape !== stimuli[i - n]);
    }
  }
  const targets = [];
  for (let i = n; i < length; i += 1) {
    if (stimuli[i] === stimuli[i - n]) targets.push(i);
  }
  return { stimuli, targets };
}

function makeUpdate(rng, day) {
  const boxCount = day < 180 ? 2 : day < 280 ? 3 : 4;
  const reps = day < 220 ? 2 : day < 320 ? 3 : 4;
  const boxes = BOXES.slice(0, boxCount);
  const answers = [];
  const queues = boxes.map(() => []);
  boxes.forEach((_, box) => {
    const seq = [];
    for (let i = 0; i < reps; i += 1) {
      let n = String(Math.floor(rng() * 10));
      let guard = 0;
      while (seq.length > 0 && n === seq[seq.length - 1] && guard < 10) {
        n = String(Math.floor(rng() * 10));
        guard += 1;
      }
      seq.push(n);
      queues[box].push({ box, item: n });
    }
    answers.push(seq[seq.length - 1]);
  });
  const events = [];
  while (queues.some((queue) => queue.length > 0)) {
    const available = queues.map((queue, index) => (queue.length ? index : -1)).filter((index) => index >= 0);
    const pick = available[Math.floor(rng() * available.length)];
    events.push(queues[pick].shift());
  }
  const used = new Set(events.map((event) => event.item));
  const choices = [...used];
  while (choices.length < Math.min(8, used.size + 2)) {
    const extra = String(Math.floor(rng() * 10));
    if (!choices.includes(extra)) choices.push(extra);
  }
  return { boxes, events, answers, choices: sample(rng, choices, choices.length) };
}

function makeDual(rng, day) {
  const count = day < 240 ? 2 : day < 330 ? 3 : 4;
  const unique = day < 330;
  const used = new Set();
  const steps = [];
  for (let i = 0; i < count; i += 1) {
    const a = 1 + Math.floor(rng() * 9);
    const b = 1 + Math.floor(rng() * 9);
    const truth = rng() < 0.55;
    let c = a + b;
    if (!truth) {
      const delta = 1 + Math.floor(rng() * 2);
      c += rng() < 0.5 ? delta : -delta;
      if (c === a + b) c += 1;
      if (c < 0) c = a + b + 1;
    }
    let letter = LETTERS[Math.floor(rng() * LETTERS.length)];
    let guard = 0;
    while (unique && used.has(letter) && guard < 12) {
      letter = LETTERS[Math.floor(rng() * LETTERS.length)];
      guard += 1;
    }
    used.add(letter);
    steps.push({ equation: `${a}+${b}=${c}`, truth, letter });
  }
  const letters = steps.map((step) => step.letter);
  const choices = [...new Set(letters)];
  while (choices.length < Math.min(8, letters.length + 2)) {
    const extra = LETTERS[Math.floor(rng() * LETTERS.length)];
    if (!choices.includes(extra)) choices.push(extra);
  }
  return { steps, letters, choices: sample(rng, choices, choices.length) };
}

function buildMission(day) {
  const plan = schedule(day);
  const type = plan.types[day % plan.types.length];
  const n = day < 200 ? 1 : day < 300 ? 2 : 3;
  const info = meta(type, n);
  const { encodeMs, gapMs } = timing(day);
  const allowRepeat = day >= 240;
  const trials = [];

  for (let trial = 0; trial < 5; trial += 1) {
    const rng = mulberry32(day * 9973 + trial * 131 + 17);
    if (type === "nback") {
      const length = n + (day < 180 ? 5 : day < 260 ? 6 : day < 360 ? 7 : 8);
      const made = makeNback(rng, n, length);
      if (made.targets.length !== 2) {
        throw new Error(`nback target count ${made.targets.length} on day ${day}`);
      }
      trials.push({
        kind: "nback",
        n,
        encodeMs: Math.max(680, encodeMs),
        stimuli: made.stimuli,
        targets: made.targets,
      });
      continue;
    }
    if (type === "update") {
      const made = makeUpdate(rng, day);
      trials.push({
        kind: "update",
        encodeMs: Math.max(640, encodeMs),
        ...made,
      });
      continue;
    }
    if (type === "dual") {
      const made = makeDual(rng, day);
      trials.push({
        kind: "dual",
        encodeMs: Math.max(700, encodeMs),
        ...made,
      });
      continue;
    }

    const reverse = type.endsWith("backward");
    const mode = type.startsWith("digit") ? "digit" : type.startsWith("spatial") ? "spatial" : "color";
    const lens = lengthsFor(
      day,
      2,
      mode === "digit" ? (reverse ? 7 : 8) : mode === "spatial" ? (reverse ? 6 : 7) : 6,
    );
    const length = lens[trial];
    const grid = mode === "spatial" && (length >= 6 || day >= 200) ? 4 : 3;
    const paletteSize = Math.min(6, Math.max(4, length, day >= 260 ? 5 : 4));
    let sequence;
    if (mode === "digit") sequence = makeDigits(rng, length, allowRepeat);
    else if (mode === "spatial") sequence = makeIndexSeq(rng, length, grid * grid);
    else sequence = makeIndexSeq(rng, length, paletteSize);
    const answer = reverse ? [...sequence].reverse() : [...sequence];
    trials.push({
      kind: "sequence",
      mode,
      reverse,
      grid,
      encodeMs,
      gapMs,
      sequence,
      answer,
      interference: plan.interference ? interferenceFor(rng) : null,
      colors: mode === "color" ? COLORS.slice(0, paletteSize) : undefined,
    });
  }

  return {
    id: `d${String(day + 1).padStart(3, "0")}`,
    day: day + 1,
    date: addDays(START, day),
    type,
    phase: plan.phase,
    subject: info.subject,
    title: info.title,
    difficulty: 0,
    difficultyLabel: "",
    lead: info.lead,
    steps: info.steps,
    trials,
  };
}

const missions = [];
let lastDifficulty = 0;
for (let day = 0; day < DAYS; day += 1) {
  const mission = buildMission(day);
  let difficulty = Math.round((1 + (day * 9) / 399) * 100) / 100;
  if (difficulty <= lastDifficulty) {
    difficulty = Math.round((lastDifficulty + 0.01) * 100) / 100;
  }
  lastDifficulty = difficulty;
  mission.difficulty = difficulty;
  mission.difficultyLabel = label(difficulty);
  missions.push(mission);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(missions.length === 400, "need 400 missions");
for (let i = 0; i < missions.length; i += 1) {
  const mission = missions[i];
  assert(mission.date === addDays(START, i), `date mismatch ${mission.id}`);
  assert(mission.trials.length === 5, `trials ${mission.id}`);
  if (i > 0) {
    assert(mission.difficulty > missions[i - 1].difficulty, `difficulty not rising ${mission.id}`);
  }
  mission.trials.forEach((trial, index) => {
    if (trial.kind === "sequence") {
      const expected = trial.reverse ? [...trial.sequence].reverse() : trial.sequence;
      assert(trial.answer.join() === expected.join(), `answer ${mission.id}#${index}`);
      if (trial.mode === "spatial") {
        assert(trial.sequence.every((cell) => cell >= 0 && cell < trial.grid * trial.grid), "cell");
      }
      if (trial.interference) {
        const count = trial.interference.shapes.filter((shape) => shape === trial.interference.target).length;
        assert(count === trial.interference.answer, "interference count");
      }
    }
    if (trial.kind === "nback") {
      const found = [];
      for (let cursor = trial.n; cursor < trial.stimuli.length; cursor += 1) {
        if (trial.stimuli[cursor] === trial.stimuli[cursor - trial.n]) found.push(cursor);
      }
      assert(found.join() === trial.targets.join(), `nback ${mission.id}#${index}`);
      assert(found.length === 2, "nback targets");
    }
    if (trial.kind === "update") {
      const last = {};
      trial.events.forEach((event) => {
        last[event.box] = event.item;
      });
      trial.answers.forEach((answer, box) => {
        assert(last[box] === answer, `update ${mission.id}`);
        assert(trial.choices.includes(answer), "update choice");
      });
    }
    if (trial.kind === "dual") {
      assert(trial.letters.join() === trial.steps.map((step) => step.letter).join(), "dual letters");
      trial.steps.forEach((step) => {
        const [expr, shown] = step.equation.split("=");
        const [a, b] = expr.split("+").map(Number);
        assert((a + b === Number(shown)) === step.truth, `dual truth ${step.equation}`);
        assert(trial.choices.includes(step.letter), "dual choice");
      });
    }
  });
}

const payload = {
  startDate: START,
  days: DAYS,
  missions,
};
const out = new URL("../src/data/curriculum.json", import.meta.url);
mkdirSync(new URL("../src/data/", import.meta.url), { recursive: true });
writeFileSync(out, `${JSON.stringify(payload)}\n`);
console.log(
  `curriculum ${DAYS} days, difficulty ${missions[0].difficulty} → ${missions[missions.length - 1].difficulty}`,
);
