import { useState, useEffect } from "react";
import { formatLiveTimeIST } from "@/lib/time";

export function useLiveTime(intervalMs = 1000): string {
  const [time, setTime] = useState(() => formatLiveTimeIST());

  useEffect(() => {
    const id = setInterval(() => {
      setTime(formatLiveTimeIST());
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return time;
}

export { formatTimeIST, formatDateTimeIST } from "@/lib/time";
