import { useEffect, useState } from 'react';

/**
 * Seconds left until `deadlineMs` (epoch milliseconds), ticking once a second
 * while `active`. Shared by the slab detail claim signature and transfers.
 */
export function useCountdown(deadlineMs: number, active = true): number {
  const compute = () => Math.max(0, Math.ceil((deadlineMs - Date.now()) / 1000));
  const [secondsLeft, setSecondsLeft] = useState<number>(compute);

  useEffect(() => {
    setSecondsLeft(compute());
    if (!active) return;
    const id = setInterval(() => setSecondsLeft(compute()), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadlineMs, active]);

  return secondsLeft;
}

/** Re-renders once a second while `active`; returns the current time. */
export function useNow(active: boolean): number {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}
