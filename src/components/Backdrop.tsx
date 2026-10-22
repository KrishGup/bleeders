import { useEffect, useRef } from 'react';

interface Mote {
  x: number;
  y: number;
  r: number;
  speed: number;
  drift: number;
  phase: number;
  alpha: number;
}

/** Fixed page backdrop: gradient wash, film grain, drifting reishi motes and a giant watermark kanji. */
export function Backdrop({ kanji, animate }: { kanji?: string; animate: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    if (!animate) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    let width = 0;
    let height = 0;
    let motes: Mote[] = [];
    let raf = 0;
    let running = true;
    let color = '#74d4ff';

    const readColor = () => {
      const host = document.querySelector('[data-mode]') ?? document.documentElement;
      color = getComputedStyle(host).getPropertyValue('--mode-accent').trim() || color;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const sameWidth = width === window.innerWidth;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Mobile browsers resize the viewport as their toolbars slide in and out while scrolling;
      // keep the motes where they are unless the width really changed.
      if (sameWidth && motes.length) return;
      const count = width < 640 ? 26 : 48;
      motes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.6 + Math.random() * 1.9,
        speed: 0.12 + Math.random() * 0.38,
        drift: 0.2 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.18 + Math.random() * 0.45,
      }));
    };

    let frame = 0;
    const tick = () => {
      if (!running) return;
      frame += 1;
      if (frame % 120 === 1) readColor();
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = color;
      for (const m of motes) {
        m.y -= m.speed;
        m.x += Math.sin(frame * 0.01 + m.phase) * m.drift * 0.3;
        if (m.y < -10) {
          m.y = height + 10;
          m.x = Math.random() * width;
        }
        const flicker = 0.65 + Math.sin(frame * 0.03 + m.phase) * 0.35;
        ctx.globalAlpha = m.alpha * flicker * 0.35;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r * 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = m.alpha * flicker;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };

    const onVisibility = () => {
      running = document.visibilityState === 'visible';
      cancelAnimationFrame(raf);
      if (running) raf = requestAnimationFrame(tick);
    };

    resize();
    readColor();
    raf = requestAnimationFrame(tick);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [animate]);

  return (
    <div className="backdrop" aria-hidden="true">
      <canvas ref={ref} className="backdrop__canvas" />
      <div className="backdrop__noise" />
      {kanji ? (
        <span key={kanji} className="backdrop__kanji kanji">
          {kanji}
        </span>
      ) : null}
    </div>
  );
}
