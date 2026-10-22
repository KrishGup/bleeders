import { useEffect, useState } from 'react';
import { dayIndexFor, msUntilNextDay } from '../lib/date';

/** The current puzzle day; flips automatically at local midnight. */
export function useToday(): number {
  const [today, setToday] = useState(() => dayIndexFor());

  useEffect(() => {
    let timer = 0;
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        setToday(dayIndexFor());
        schedule();
      }, msUntilNextDay() + 250);
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        setToday(dayIndexFor());
        schedule();
      }
    };
    schedule();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return today;
}

/** Re-renders every `interval` ms — for countdown clocks. */
export function useNow(interval = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), interval);
    return () => window.clearInterval(id);
  }, [interval]);
  return now;
}
