import { useEffect, useRef, useState } from "react";
import type { NBackTrial, StageResult } from "../data/types";

export function NBackPlay({ trial, onDone }: { trial: NBackTrial; onDone: (result: StageResult) => void }) {
  const pressed = useRef(trial.stimuli.map(() => false));
  const [cursor, setCursor] = useState(0);
  const [armed, setArmed] = useState(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    let cancel = false;
    const timers = new Set<number>();
    const later = (ms: number) =>
      new Promise<void>((resolve) => {
        const id = window.setTimeout(() => {
          timers.delete(id);
          resolve();
        }, ms);
        timers.add(id);
      });
    void (async () => {
      for (let index = 0; index < trial.stimuli.length; index += 1) {
        if (cancel) return;
        setCursor(index);
        setArmed(false);
        await later(trial.encodeMs);
      }
      if (cancel) return;
      const targets = new Set(trial.targets);
      const hits = trial.targets.filter((index) => pressed.current[index]).length;
      let falseAlarms = 0;
      pressed.current.forEach((was, index) => {
        if (was && !targets.has(index)) falseAlarms += 1;
      });
      onDoneRef.current({
        correct: hits === trial.targets.length && falseAlarms === 0,
        summary: `${trial.n}-back · 표적 ${hits}/${trial.targets.length} · 오경보 ${falseAlarms}`,
      });
    })();
    return () => {
      cancel = true;
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [trial]);

  return (
    <div className="play-main">
      <p className="prompt">
        {cursor + 1} / {trial.stimuli.length} · {trial.n}개 전과 같으면 눌러요
      </p>
      <div className="stage-visual" aria-hidden="true">
        <span className="giant">{trial.stimuli[cursor]}</span>
      </div>
      <button
        type="button"
        className={armed ? "btn selected" : "btn"}
        onClick={() => {
          pressed.current[cursor] = true;
          setArmed(true);
        }}
      >
        같아요
      </button>
    </div>
  );
}
