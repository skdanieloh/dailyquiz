import { useEffect, useRef, useState } from "react";
import type { Mission, StageResult } from "../data/types";
import { DualPlay } from "./dual";
import { NBackPlay } from "./nback";
import { SequencePlay } from "./sequence";
import { UpdatePlay } from "./update";

export function Session({
  mission,
  initialDone,
  onTrial,
  onComplete,
}: {
  mission: Mission;
  initialDone: StageResult[];
  onTrial: (done: StageResult[]) => void;
  onComplete: (done: StageResult[]) => void;
}) {
  const doneRef = useRef(initialDone);
  const finished = useRef(false);
  const [index, setIndex] = useState(initialDone.length);
  const [bridge, setBridge] = useState(true);

  useEffect(() => {
    setBridge(true);
    const id = window.setTimeout(() => setBridge(false), 700);
    return () => window.clearTimeout(id);
  }, [index]);

  function finish(result: StageResult) {
    if (finished.current) return;
    const next = [...doneRef.current, result];
    doneRef.current = next;
    if (next.length >= mission.trials.length) {
      finished.current = true;
      onComplete(next);
      return;
    }
    onTrial(next);
    setIndex(next.length);
  }

  if (bridge) {
    return (
      <div className="play-main bridge">
        <p className="eyebrow">
          {index + 1} / {mission.trials.length}단계
        </p>
        <h2>기억해 주세요</h2>
        <p className="lead">{mission.lead}</p>
      </div>
    );
  }

  const trial = mission.trials[index];
  if (trial.kind === "sequence") return <SequencePlay key={index} trial={trial} onDone={finish} />;
  if (trial.kind === "nback") return <NBackPlay key={index} trial={trial} onDone={finish} />;
  if (trial.kind === "update") return <UpdatePlay key={index} trial={trial} onDone={finish} />;
  return <DualPlay key={index} trial={trial} onDone={finish} />;
}
