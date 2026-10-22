interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  /** Play the sword-slash intro animation. */
  animate?: boolean;
}

/** The sliced BLEEDLE wordmark: two halves of the word offset along a blade cut. */
export function Logo({ size = 'md', animate = false }: LogoProps) {
  return (
    <span className={`logo logo--${size}${animate ? ' logo--animate' : ''}`} role="img" aria-label="Bleedle">
      <span className="logo__word" aria-hidden="true">
        <span className="logo__half logo__half--top">BLEEDLE</span>
        <span className="logo__half logo__half--bottom">BLEEDLE</span>
        <span className="logo__slash-glow">
          <span className="logo__slash" />
        </span>
      </span>
      {size === 'lg' ? (
        <span className="logo__sub" aria-hidden="true">
          <span className="logo__rule" />
          <span className="kanji">ブリードル</span>
          <span className="logo__rule" />
        </span>
      ) : null}
    </span>
  );
}
