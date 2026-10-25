import { useEffect, useRef, useState } from "react";

export function useSteps(
  active: boolean,
  length: number,
  holdMs: number,
  gapMs: number,
  onDone: () => void,
) {
  const [cursor, setCursor] = useState(-1);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!active) return;
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
      for (let index = 0; index < length; index += 1) {
        if (cancel) return;
        setCursor(index);
        await later(holdMs);
        if (cancel) return;
        setCursor(-1);
        if (gapMs > 0) await later(gapMs);
      }
      if (!cancel) onDoneRef.current();
    })();

    return () => {
      cancel = true;
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [active, length, holdMs, gapMs]);

  return cursor;
}
