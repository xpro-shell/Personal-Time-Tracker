import React, { useEffect, useRef } from 'react';

interface OrbitParticle {
  angle: number;
  radiusFactor: number;
  speed: number;
  size: number;
  alpha: number;
  color: string;
}

export const ObservatoryCardBlackHole: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext('2d');
    } catch {
      ctx = null;
    }
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let rafId = 0;
    let isPaused = typeof document !== 'undefined' ? document.hidden : false;
    let startTime = performance.now();
    let elapsedAtPause = 0;

    const particleColors = ['#c4b5fd', '#818cf8', '#67e8f9', '#a78bfa', '#93c5fd'];
    const particles: OrbitParticle[] = Array.from({ length: 88 }, (_, idx) => {
      const band = idx / 88;
      return {
        angle: Math.random() * Math.PI * 2,
        radiusFactor: 1.28 + band * 1.5,
        speed: (0.04 + (1 - band) * 0.052) * (0.85 + Math.random() * 0.3),
        size: 0.75 + Math.random() * 1.35,
        alpha: 0.25 + (1 - band) * 0.45,
        color: particleColors[idx % particleColors.length],
      };
    });

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(300, rect.width);
      height = Math.max(200, rect.height);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const drawBlackHole = (timeSec: number) => {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      // Anchor in open upper-right/center visual pocket where no UI controls obscure the core
      const isCompact = width < 640;
      const cx = isCompact ? width * 0.74 : width * 0.64;
      const cy = isCompact ? height * 0.34 : height * 0.42;
      const horizonR = Math.max(40, Math.min(80, Math.min(width, height) * 0.24));

      // Outer deep space gravitational corona (violet -> blue -> faint cyan)
      const corona = ctx.createRadialGradient(cx, cy, horizonR * 0.82, cx, cy, horizonR * 3.5);
      corona.addColorStop(0, 'rgba(0, 0, 0, 0)');
      corona.addColorStop(0.24, 'rgba(139, 92, 246, 0.24)');
      corona.addColorStop(0.45, 'rgba(59, 130, 246, 0.14)');
      corona.addColorStop(0.68, 'rgba(34, 211, 238, 0.065)');
      corona.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = corona;
      ctx.beginPath();
      ctx.arc(cx, cy, horizonR * 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.2);

      // Subtle slow-rotating outer observatory energy ring
      const ringPhase = prefersReducedMotion ? 0 : timeSec * 0.028;
      ctx.save();
      ctx.rotate(ringPhase);
      ctx.setLineDash([4, 9]);
      ctx.beginPath();
      ctx.ellipse(0, 0, horizonR * 2.55, horizonR * 0.76, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.16)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Gravitational lensing arcs curving above & below the sphere
      ctx.beginPath();
      ctx.ellipse(0, 0, horizonR * 1.32, horizonR * 1.18, 0, Math.PI * 1.04, Math.PI * 1.96);
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.36)';
      ctx.lineWidth = Math.max(2.5, horizonR * 0.058);
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(0, 0, horizonR * 1.24, horizonR * 1.12, 0, 0.06, Math.PI - 0.06);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
      ctx.lineWidth = Math.max(1.5, horizonR * 0.035);
      ctx.stroke();

      // Back hemisphere of luminous accretion disk (occluded by event horizon)
      [
        { scale: 1.48, color: 'rgba(196, 181, 253, 0.38)', lw: 4.5 },
        { scale: 1.82, color: 'rgba(99, 102, 241, 0.28)', lw: 3.4 },
        { scale: 2.18, color: 'rgba(34, 211, 238, 0.18)', lw: 2.2 },
      ].forEach((r) => {
        const rx = horizonR * r.scale;
        const ry = rx * 0.25;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, Math.PI, Math.PI * 2);
        ctx.strokeStyle = r.color;
        ctx.lineWidth = r.lw;
        ctx.stroke();
      });

      // Event horizon singularity (deep abyss core)
      const coreGrad = ctx.createRadialGradient(
        -horizonR * 0.14,
        -horizonR * 0.14,
        horizonR * 0.08,
        0,
        0,
        horizonR
      );
      coreGrad.addColorStop(0, '#000000');
      coreGrad.addColorStop(0.84, '#020207');
      coreGrad.addColorStop(1, '#09091c');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(0, 0, horizonR, 0, Math.PI * 2);
      ctx.fill();

      // Whisper-thin photon sphere rim
      ctx.beginPath();
      ctx.arc(0, 0, horizonR + 1, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(165, 243, 252, 0.52)';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Front hemisphere of accretion disk (sweeping smoothly across front)
      [
        { scale: 1.38, color: 'rgba(224, 231, 255, 0.52)', lw: 5 },
        { scale: 1.66, color: 'rgba(167, 139, 250, 0.4)', lw: 4 },
        { scale: 1.98, color: 'rgba(96, 165, 250, 0.26)', lw: 3 },
        { scale: 2.32, color: 'rgba(34, 211, 238, 0.16)', lw: 1.8 },
      ].forEach((r) => {
        const rx = horizonR * r.scale;
        const ry = rx * 0.25;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI);
        ctx.strokeStyle = r.color;
        ctx.lineWidth = r.lw;
        ctx.stroke();
      });

      // Tiny particles orbiting smoothly & slowly around gravitational core
      particles.forEach((p) => {
        const theta = p.angle + (prefersReducedMotion ? 0 : timeSec * p.speed);
        const rx = horizonR * p.radiusFactor;
        const ry = rx * 0.27;
        const px = Math.cos(theta) * rx;
        const py = Math.sin(theta) * ry;
        const inFront = Math.sin(theta) >= 0;

        if (!inFront && Math.hypot(px, py) < horizonR * 0.96) return;

        ctx.globalAlpha = inFront ? p.alpha : p.alpha * 0.42;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      ctx.restore();
    };

    const tick = (now: number) => {
      if (isPaused || prefersReducedMotion) return;
      drawBlackHole((now - startTime) / 1000);
      rafId = window.requestAnimationFrame(tick);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        isPaused = true;
        elapsedAtPause = (performance.now() - startTime) / 1000;
        if (rafId) {
          window.cancelAnimationFrame(rafId);
          rafId = 0;
        }
      } else {
        isPaused = false;
        startTime = performance.now() - elapsedAtPause * 1000;
        if (!prefersReducedMotion) {
          rafId = window.requestAnimationFrame(tick);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    drawBlackHole(0);
    if (!prefersReducedMotion && !isPaused) {
      rafId = window.requestAnimationFrame(tick);
    }

    return () => {
      ro.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[14%] top-[36%] -translate-y-1/2 w-56 h-56 rounded-full opacity-50 blur-2xl"
        style={{
          background:
            'radial-gradient(circle, rgba(2,2,8,0.95) 28%, rgba(139,92,246,0.28) 46%, rgba(56,189,248,0.16) 66%, transparent 80%)',
        }}
      />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 w-full h-full rounded-2xl"
      />
    </>
  );
};
