import type { ReactNode } from 'react';

interface Option<T extends string> {
  value: T;
  label: ReactNode;
  hint?: string;
}

interface SegmentedProps<T extends string> {
  value: T;
  options: readonly Option<T>[];
  onChange: (value: T) => void;
  label: string;
  size?: 'sm' | 'md';
}

/** A radio-group styled as a segmented control. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  size = 'md',
}: SegmentedProps<T>) {
  return (
    <div className={`segmented segmented--${size}`} role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          title={option.hint}
          className={`segmented__option${option.value === value ? ' is-active' : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
