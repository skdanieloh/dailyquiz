import { useState } from "react";
import type { StageResult, UpdateTrial } from "../data/types";
import { useSteps } from "./useSteps";

export function UpdatePlay({ trial, onDone }: { trial: UpdateTrial; onDone: (result: StageResult) => void }) {
  const [phase, setPhase] = useState<"encode" | "recall">("encode");
  const [picks, setPicks] = useState<string[]>([]);
  const cursor = useSteps(phase === "encode", trial.events.length, trial.encodeMs, 160, () => setPhase("recall"));
  const event = cursor >= 0 ? trial.events[cursor] : null;

  function choose(item: string) {
    const next = [...picks, item];
    if (next.length < trial.answers.length) {
      setPicks(next);
      return;
    }
    const correct = next.every((value, index) => value === trial.answers[index]);
    const summary = trial.boxes
      .map((box, index) => `${box} ${next[index]}(정답 ${trial.answers[index]})`)
      .join(" · ");
    onDone({ correct, summary });
  }

  if (phase === "encode") {
    return (
      <div className="play-main">
        <p className="prompt">마지막에 들어온 숫자만 남겨 두세요</p>
        <div className="boxes">
          {trial.boxes.map((box, index) => (
            <div key={box} className={event?.box === index ? "box live" : "box"}>
              <span>{box}</span>
              <strong>{event?.box === index ? event.item : ""}</strong>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const box = trial.boxes[picks.length];
  return (
    <div className="play-main">
      <p className="prompt">{box} 칸의 마지막 숫자</p>
      <div className="choices">
        {trial.choices.map((choice) => (
          <button key={choice} type="button" className="key" onClick={() => choose(choice)}>
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
}
