import { useEffect, useState } from "react";
import { kstDate } from "./kst";

export function useKstToday() {
  const [today, setToday] = useState(() => kstDate());
  useEffect(() => {
    const id = window.setInterval(() => setToday(kstDate()), 15000);
    return () => window.clearInterval(id);
  }, []);
  return today;
}
