import { useEffect, useState } from "react";
import type { DualTrial, StageResult } from "../data/types";

export function DualPlay({ trial, onDone }: { trial: DualTrial; onDone: (result: StageResult) => void }) {
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<"equation" | "letter" | "recall">("equation");
  const [eqCorrect, setEqCorrect] = useState(0);
  const [input, setInput] = useState<string[]>([]);

  useEffect(() => {
    if (phase !== "letter") return;
    const id = window.setTimeout(() => {
      if (step + 1 >= trial.steps.length) setPhase("recall");
      else {
        setStep((value) => value + 1);
        setPhase("equation");
      }
    }, trial.encodeMs);
    return () => window.clearTimeout(id);
  }, [phase, step, trial.encodeMs, trial.steps.length]);

  function answer(truth: boolean) {
    if (phase !== "equation") return;
    if (truth === trial.steps[step].truth) setEqCorrect((count) => count + 1);
    setPhase("letter");
  }

  function finish(letters: string[]) {
    const lettersOk = letters.join() === trial.letters.join();
    const correct = eqCorrect === trial.steps.length && lettersOk;
    onDone({
      correct,
      summary: `계산 ${eqCorrect}/${trial.steps.length} · 입력 ${letters.join("-")} · 정답 ${trial.letters.join("-")}`,
    });
  }

  if (phase === "recall") {
    return (
      <div className="play-main">
        <p className="prompt">글자를 본 순서대로 눌러 주세요</p>
        <p className="entry">{Array.from({ length: trial.letters.length }, (_, index) => input[index] ?? "·").join("  ")}</p>
        <div className="choices">
          {trial.choices.map((choice) => (
            <button
              key={choice}
              type="button"
              className="key"
              onClick={() => {
                if (input.length >= trial.letters.length) return;
                const next = [...input, choice];
                setInput(next);
              }}
            >
              {choice}
            </button>
          ))}
        </div>
        <div className="split">
          <button type="button" className="btn secondary" onClick={() => setInput((prev) => prev.slice(0, -1))}>
            지우기
          </button>
          <button
            type="button"
            className="btn"
            disabled={input.length !== trial.letters.length}
            onClick={() => finish(input)}
          >
            확인
          </button>
        </div>
      </div>
    );
  }

  const current = trial.steps[step];
  return (
    <div className="play-main">
      <p className="prompt">
        {step + 1} / {trial.steps.length}
      </p>
      {phase === "equation" ? (
        <>
          <div className="stage-visual">
            <span className="equation">{current.equation}</span>
          </div>
          <div className="split">
            <button type="button" className="btn secondary" onClick={() => answer(false)}>
              아니에요
            </button>
            <button type="button" className="btn" onClick={() => answer(true)}>
              맞아요
            </button>
          </div>
        </>
      ) : (
        <div className="stage-visual" aria-hidden="true">
          <span className="giant">{current.letter}</span>
        </div>
      )}
    </div>
  );
}
