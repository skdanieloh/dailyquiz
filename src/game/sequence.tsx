import { useState } from "react";
import type { SequenceTrial, StageResult } from "../data/types";
import { useSteps } from "./useSteps";

function formatSequence(trial: SequenceTrial, values: number[]) {
  if (trial.mode === "color") {
    return values.map((value) => trial.colors?.[value]?.name ?? String(value)).join("-");
  }
  if (trial.mode === "spatial") return values.map((value) => String(value + 1)).join("-");
  return values.join("-");
}

export function SequencePlay({
  trial,
  onDone,
}: {
  trial: SequenceTrial;
  onDone: (result: StageResult) => void;
}) {
  const [phase, setPhase] = useState<"encode" | "distract" | "recall">("encode");
  const [input, setInput] = useState<number[]>([]);
  const [distractorOk, setDistractorOk] = useState<boolean | null>(null);
  const cursor = useSteps(phase === "encode", trial.sequence.length, trial.encodeMs, trial.gapMs, () => {
    setPhase(trial.interference ? "distract" : "recall");
  });

  function finish(nextDistractor = distractorOk) {
    const match =
      input.length === trial.answer.length && input.every((value, index) => value === trial.answer[index]);
    const correct = match && nextDistractor !== false;
    const prefix = nextDistractor === false ? "간섭 실패 · " : "";
    onDone({
      correct,
      summary: `${prefix}입력 ${formatSequence(trial, input)} · 정답 ${formatSequence(trial, trial.answer)}`,
    });
  }

  return (
    <div className="play-main">
      {phase === "encode" ? <Encode trial={trial} cursor={cursor} /> : null}
      {phase === "distract" && trial.interference ? (
        <div>
          <p className="prompt">잠깐, {trial.interference.targetName}은 몇 개일까요?</p>
          <div className="shape-row" aria-hidden="true">
            {trial.interference.shapes.map((shape, index) => (
              <span key={`${shape}-${index}`} className="shape">
                {shape}
              </span>
            ))}
          </div>
          <div className="choices">
            {[0, 1, 2, 3, 4].map((count) => (
              <button
                key={count}
                type="button"
                className="key"
                onClick={() => {
                  setDistractorOk(count === trial.interference?.answer);
                  setPhase("recall");
                }}
              >
                {count}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {phase === "recall" ? (
        <div>
          <p className="prompt">{trial.reverse ? "반대 순서로 눌러 주세요" : "본 순서대로 눌러 주세요"}</p>
          <Preview trial={trial} input={input} />
          {trial.mode === "spatial" ? (
            <div className="grid" style={{ gridTemplateColumns: `repeat(${trial.grid}, 1fr)` }}>
              {Array.from({ length: trial.grid * trial.grid }, (_, cell) => {
                const order = input.indexOf(cell);
                return (
                  <button
                    key={cell}
                    type="button"
                    className={order >= 0 ? "cell on" : "cell"}
                    aria-label={`${cell + 1}번 칸`}
                    onClick={() => {
                      if (input.length >= trial.answer.length) return;
                      setInput([...input, cell]);
                    }}
                  >
                    {order >= 0 ? order + 1 : ""}
                  </button>
                );
              })}
            </div>
          ) : null}
          {trial.mode === "digit" ? (
            <div className="keypad">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  className="key"
                  onClick={() => {
                    if (input.length >= trial.answer.length) return;
                    setInput([...input, digit]);
                  }}
                >
                  {digit}
                </button>
              ))}
              <span />
              <button
                type="button"
                className="key"
                onClick={() => {
                  if (input.length >= trial.answer.length) return;
                  setInput([...input, 0]);
                }}
              >
                0
              </button>
              <span />
            </div>
          ) : null}
          {trial.mode === "color" ? (
            <div className="choices">
              {(trial.colors ?? []).map((color, index) => (
                <button
                  key={color.name}
                  type="button"
                  className="swatch"
                  style={{ background: color.hex }}
                  aria-label={color.name}
                  onClick={() => {
                    if (input.length >= trial.answer.length) return;
                    setInput([...input, index]);
                  }}
                />
              ))}
            </div>
          ) : null}
          <div className="split">
            <button type="button" className="btn secondary" onClick={() => setInput((prev) => prev.slice(0, -1))}>
              지우기
            </button>
            <button
              type="button"
              className="btn"
              disabled={input.length !== trial.answer.length}
              onClick={() => finish()}
            >
              확인
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Encode({ trial, cursor }: { trial: SequenceTrial; cursor: number }) {
  if (trial.mode === "spatial") {
    return (
      <div className="grid" style={{ gridTemplateColumns: `repeat(${trial.grid}, 1fr)` }} aria-hidden="true">
        {Array.from({ length: trial.grid * trial.grid }, (_, cell) => (
          <div key={cell} className={cursor >= 0 && trial.sequence[cursor] === cell ? "cell flash" : "cell"} />
        ))}
      </div>
    );
  }
  if (trial.mode === "color") {
    const color = cursor >= 0 ? trial.colors?.[trial.sequence[cursor]] : undefined;
    return (
      <div className="stage-visual" aria-hidden="true">
        <span className="swatch giant" style={{ background: color?.hex ?? "#f2f4f6" }} />
      </div>
    );
  }
  return (
    <div className="stage-visual" aria-hidden="true">
      <span className={cursor >= 0 ? "giant" : "giant ghost"}>{cursor >= 0 ? trial.sequence[cursor] : "•"}</span>
    </div>
  );
}

function Preview({ trial, input }: { trial: SequenceTrial; input: number[] }) {
  if (trial.mode === "color") {
    return (
      <div className="chips">
        {Array.from({ length: trial.answer.length }, (_, index) => {
          const color = trial.colors?.[input[index]];
          return <span key={index} className="chip" style={{ background: color?.hex ?? "#f2f4f6" }} />;
        })}
      </div>
    );
  }
  if (trial.mode === "spatial") {
    return <p className="entry">{input.length ? input.map((cell) => cell + 1).join("  ") : "칸을 눌러 주세요"}</p>;
  }
  return (
    <p className="entry">
      {Array.from({ length: trial.answer.length }, (_, index) => input[index] ?? "·").join("  ")}
    </p>
  );
}
