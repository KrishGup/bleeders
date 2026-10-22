import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  hue: 'accent' | 'white';
  streak: boolean;
}

/**
 * A burst of spiritual pressure: radiating reishi motes, slash-like streaks
 * and an expanding shockwave ring. Fires whenever `trigger` changes.
 */
export function ReiatsuBurst({ trigger, originId }: { trigger: number; originId?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!trigger) return;
    if (document.documentElement.dataset.motion === 'reduced') return;
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const origin = originId ? document.getElementById(originId)?.getBoundingClientRect() : undefined;
    const cx = origin ? origin.left + origin.width / 2 : width / 2;
    const cy = origin ? origin.top + origin.height / 2 : height * 0.4;
    const accent =
      getComputedStyle(document.querySelector('[data-mode]') ?? document.documentElement)
        .getPropertyValue('--mode-accent')
        .trim() || '#74d4ff';

    const particles: Particle[] = Array.from({ length: 150 }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 9;
      const max = 50 + Math.random() * 50;
      return {
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        life: max,
        max,
        size: 1 + Math.random() * 3.2,
        hue: i % 3 === 0 ? 'white' : 'accent',
        streak: i % 5 === 0,
      };
    });

    let frame = 0;
    let raf = 0;
    const tick = () => {
      frame += 1;
      ctx.clearRect(0, 0, width, height);

      const ring = frame / 42;
      if (ring < 1) {
        ctx.beginPath();
        ctx.arc(cx, cy, 20 + ring * Math.max(width, height) * 0.55, 0, Math.PI * 2);
        ctx.strokeStyle = accent;
        ctx.globalAlpha = (1 - ring) * 0.55;
        ctx.lineWidth = 3 + (1 - ring) * 10;
        ctx.stroke();
      }

      let alive = 0;
      for (const p of particles) {
        if (p.life <= 0) continue;
        alive += 1;
        p.life -= 1;
        p.vx *= 0.965;
        p.vy = p.vy * 0.965 + 0.05;
        p.x += p.vx;
        p.y += p.vy;
        const t = p.life / p.max;
        ctx.globalAlpha = Math.max(0, t);
        ctx.fillStyle = p.hue === 'white' ? '#ffffff' : accent;
        ctx.strokeStyle = ctx.fillStyle;
        if (p.streak) {
          ctx.lineWidth = p.size * 0.8;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 4, p.y - p.vy * 4);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (0.6 + t * 0.6), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      if (alive > 0) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, width, height);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, width, height);
    };
  }, [trigger, originId]);

  return <canvas ref={ref} className="burst" aria-hidden="true" />;
}
