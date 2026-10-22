import { formatCountdown, msUntilNextDay } from '../lib/date';
import { useNow } from '../hooks/useToday';

export function Countdown({ label = 'Next souls in' }: { label?: string }) {
  const now = useNow(1000);
  const remaining = msUntilNextDay(new Date(now));
  return (
    <span className="countdown" role="timer" aria-live="off">
      <span className="countdown__label">{label}</span>
      <span className="countdown__time">{formatCountdown(remaining)}</span>
    </span>
  );
}
