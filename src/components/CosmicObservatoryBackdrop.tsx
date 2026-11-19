import React, { useEffect, useRef } from 'react';

interface FineStar {
  x: number;
  y: number;
  r: number;
  baseAlpha: number;
  twinkleSpeed: number;
  phase: number;
  driftX: number;
  driftY: number;
  color: string;
}

interface DustMote {
  x: number;
  y: number;
  r: number;
  alpha: number;
  vx: number;
  vy: number;
  color: string;
}

interface DistantGalaxy {
  x: number;
  y: number;
  rx: number;
  ry: number;
  angle: number;
  coreColor: string;
  haloColor: string;
}

interface BgOrbitParticle {
  angle: number;
  radiusFactor: number;
  speed: number;
  size: number;
  alpha: number;
  color: string;
}

export const CosmicObservatoryBackdrop: React.FC = () => {
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

    const starPalette = ['#f8fafc', '#e0e7ff', '#ddd6fe', '#cffafe', '#c7d2fe'];
    const dustPalette = ['rgba(139, 92, 246, 0.28)', 'rgba(56, 189, 248, 0.24)', 'rgba(99, 102, 241, 0.24)'];
    const bhParticleColors = ['#c4b5fd', '#818cf8', '#67e8f9', '#a78bfa', '#93c5fd'];

    const stars: FineStar[] = Array.from({ length: 150 }, (_, idx) => {
      const layer = idx % 3;
      return {
        x: Math.random(),
        y: Math.random(),
        r: layer === 0 ? 0.45 + Math.random() * 0.45 : layer === 1 ? 0.65 + Math.random() * 0.6 : 0.9 + Math.random() * 0.7,
        baseAlpha: layer === 0 ? 0.22 + Math.random() * 0.3 : 0.35 + Math.random() * 0.52,
        twinkleSpeed: 0.35 + Math.random() * 0.95,
        phase: Math.random() * Math.PI * 2,
        driftX: (layer + 1) * 0.00045,
        driftY: (layer + 1) * -0.00018,
        color: starPalette[idx % starPalette.length],
      };
    });

    const dustMotes: DustMote[] = Array.from({ length: 30 }, (_, idx) => ({
      x: Math.random(),
      y: Math.random(),
      r: 1.2 + Math.random() * 2.2,
      alpha: 0.08 + Math.random() * 0.16,
      vx: 0.0008 + Math.random() * 0.001,
      vy: -0.0004 + Math.random() * 0.0008,
      color: dustPalette[idx % dustPalette.length],
    }));

    const bhParticles: BgOrbitParticle[] = Array.from({ length: 90 }, (_, idx) => {
      const band = idx / 90;
      return {
        angle: Math.random() * Math.PI * 2,
        radiusFactor: 1.32 + band * 1.65,
        speed: (0.024 + (1 - band) * 0.032) * (0.85 + Math.random() * 0.3),
        size: 0.8 + Math.random() * 1.5,
        alpha: 0.18 + (1 - band) * 0.34,
        color: bhParticleColors[idx % bhParticleColors.length],
      };
    });

    const galaxies: DistantGalaxy[] = [
      {
        x: 0.12,
        y: 0.20,
        rx: 74,
        ry: 26,
        angle: -0.48,
        coreColor: 'rgba(196, 181, 253, 0.09)',
        haloColor: 'rgba(79, 70, 229, 0.035)',
      },
      {
        x: 0.88,
        y: 0.82,
        rx: 84,
        ry: 28,
        angle: 0.34,
        coreColor: 'rgba(165, 243, 252, 0.075)',
        haloColor: 'rgba(124, 58, 237, 0.035)',
      },
      {
        x: 0.20,
        y: 0.78,
        rx: 56,
        ry: 20,
        angle: 0.62,
        coreColor: 'rgba(199, 210, 254, 0.065)',
        haloColor: 'rgba(56, 189, 248, 0.025)',
      },
    ];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(320, window.innerWidth);
      height = Math.max(320, window.innerHeight);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const drawFrame = (timeSec: number) => {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      // Subtle drifting nebula mist washes
      const driftA = Math.sin(timeSec * 0.045) * width * 0.018;
      const driftB = Math.cos(timeSec * 0.035) * height * 0.018;

      const nebLeft = ctx.createRadialGradient(
        width * 0.16 + driftA,
        height * 0.24 + driftB,
        0,
        width * 0.16 + driftA,
        height * 0.24 + driftB,
        width * 0.52
      );
      nebLeft.addColorStop(0, 'rgba(67, 56, 202, 0.11)');
      nebLeft.addColorStop(0.5, 'rgba(88, 28, 135, 0.055)');
      nebLeft.addColorStop(1, 'transparent');
      ctx.fillStyle = nebLeft;
      ctx.fillRect(0, 0, width, height);

      const nebRight = ctx.createRadialGradient(
        width * 0.84 - driftA,
        height * 0.68 - driftB,
        0,
        width * 0.84 - driftA,
        height * 0.68 - driftB,
        width * 0.52
      );
      nebRight.addColorStop(0, 'rgba(14, 116, 144, 0.09)');
      nebRight.addColorStop(0.55, 'rgba(109, 40, 217, 0.05)');
      nebRight.addColorStop(1, 'transparent');
      ctx.fillStyle = nebRight;
      ctx.fillRect(0, 0, width, height);

      // Faint distant galaxies
      galaxies.forEach((g) => {
        ctx.save();
        ctx.translate(g.x * width, g.y * height);
        ctx.rotate(g.angle);
        ctx.scale(1, g.ry / g.rx);
        const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, g.rx);
        grad.addColorStop(0, g.coreColor);
        grad.addColorStop(0.45, g.haloColor);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, g.rx, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Multi-depth extremely fine stars
      stars.forEach((s) => {
        const px = ((s.x + (prefersReducedMotion ? 0 : timeSec * s.driftX)) % 1 + 1) % 1;
        const py = ((s.y + (prefersReducedMotion ? 0 : timeSec * s.driftY)) % 1 + 1) % 1;
        const twinkle = prefersReducedMotion
          ? 0.8
          : 0.55 + 0.45 * Math.sin(timeSec * s.twinkleSpeed + s.phase);
        ctx.globalAlpha = s.baseAlpha * twinkle;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(px * width, py * height, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Second Big 3D Black Hole floating atmospherically in the main cosmic backdrop behind the entire frame
      const cx = width * 0.5;
      const cy = height * 0.56;
      const horizonR = Math.max(88, Math.min(205, Math.min(width, height) * 0.24));

      // Vast deep gravitational corona
      const megaCorona = ctx.createRadialGradient(cx, cy, horizonR * 0.85, cx, cy, horizonR * 3.8);
      megaCorona.addColorStop(0, 'rgba(0, 0, 0, 0)');
      megaCorona.addColorStop(0.22, 'rgba(139, 92, 246, 0.14)');
      megaCorona.addColorStop(0.45, 'rgba(59, 130, 246, 0.085)');
      megaCorona.addColorStop(0.7, 'rgba(34, 211, 238, 0.038)');
      megaCorona.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = megaCorona;
      ctx.beginPath();
      ctx.arc(cx, cy, horizonR * 3.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.16);

      // Distant subtle orbital telescope grid ring
      ctx.save();
      ctx.rotate(prefersReducedMotion ? 0 : timeSec * 0.015);
      ctx.setLineDash([5, 14]);
      ctx.beginPath();
      ctx.ellipse(0, 0, horizonR * 2.85, horizonR * 0.82, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.11)';
      ctx.lineWidth = 1.1;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Gravitational lensing arcs curving above & below event horizon
      ctx.beginPath();
      ctx.ellipse(0, 0, horizonR * 1.32, horizonR * 1.18, 0, Math.PI * 1.04, Math.PI * 1.96);
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.24)';
      ctx.lineWidth = Math.max(3, horizonR * 0.048);
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(0, 0, horizonR * 1.22, horizonR * 1.11, 0, 0.06, Math.PI - 0.06);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.lineWidth = Math.max(2, horizonR * 0.028);
      ctx.stroke();

      // Back half of inclined accretion disk
      [
        { scale: 1.52, color: 'rgba(196, 181, 253, 0.22)', lw: 5 },
        { scale: 1.88, color: 'rgba(99, 102, 241, 0.16)', lw: 3.6 },
        { scale: 2.28, color: 'rgba(34, 211, 238, 0.11)', lw: 2.2 },
      ].forEach((r) => {
        const rx = horizonR * r.scale;
        const ry = rx * 0.24;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, Math.PI, Math.PI * 2);
        ctx.strokeStyle = r.color;
        ctx.lineWidth = r.lw;
        ctx.stroke();
      });

      // Pitch-black singularity sphere
      const coreGrad = ctx.createRadialGradient(
        -horizonR * 0.14,
        -horizonR * 0.14,
        horizonR * 0.08,
        0,
        0,
        horizonR
      );
      coreGrad.addColorStop(0, 'rgba(0, 0, 0, 0.96)');
      coreGrad.addColorStop(0.84, 'rgba(2, 2, 7, 0.94)');
      coreGrad.addColorStop(1, 'rgba(10, 12, 28, 0.85)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(0, 0, horizonR, 0, Math.PI * 2);
      ctx.fill();

      // Soft photon rim
      ctx.beginPath();
      ctx.arc(0, 0, horizonR + 1, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(165, 243, 252, 0.30)';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Front half of luminous accretion disk
      [
        { scale: 1.4, color: 'rgba(224, 231, 255, 0.30)', lw: 5.5 },
        { scale: 1.72, color: 'rgba(167, 139, 250, 0.23)', lw: 4.2 },
        { scale: 2.08, color: 'rgba(96, 165, 250, 0.16)', lw: 3 },
        { scale: 2.46, color: 'rgba(34, 211, 238, 0.10)', lw: 2 },
      ].forEach((r) => {
        const rx = horizonR * r.scale;
        const ry = rx * 0.24;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI);
        ctx.strokeStyle = r.color;
        ctx.lineWidth = r.lw;
        ctx.stroke();
      });

      // Slow orbiting micro-particles around global black hole
      bhParticles.forEach((p) => {
        const theta = p.angle + (prefersReducedMotion ? 0 : timeSec * p.speed);
        const rx = horizonR * p.radiusFactor;
        const ry = rx * 0.26;
        const px = Math.cos(theta) * rx;
        const py = Math.sin(theta) * ry;
        const inFront = Math.sin(theta) >= 0;

        if (!inFront && Math.hypot(px, py) < horizonR * 0.96) return;

        ctx.globalAlpha = inFront ? p.alpha : p.alpha * 0.4;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      ctx.restore();

      // Faint cosmic dust motes drifting across foreground layer
      dustMotes.forEach((m) => {
        const px = ((m.x + (prefersReducedMotion ? 0 : timeSec * m.vx)) % 1 + 1) % 1;
        const py = ((m.y + (prefersReducedMotion ? 0 : timeSec * m.vy)) % 1 + 1) % 1;
        ctx.globalAlpha = m.alpha;
        ctx.fillStyle = m.color;
        ctx.beginPath();
        ctx.arc(px * width, py * height, m.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    };

    const tick = (now: number) => {
      if (isPaused || prefersReducedMotion) return;
      const elapsedSec = (now - startTime) / 1000;
      drawFrame(elapsedSec);
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
    drawFrame(0);
    if (!prefersReducedMotion && !isPaused) {
      rafId = window.requestAnimationFrame(tick);
    }

    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Pure CSS Deep-Space Fallback & Base Atmospheric Gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 55% at 15% 15%, rgba(49, 46, 129, 0.24), transparent 65%), radial-gradient(ellipse 70% 55% at 85% 75%, rgba(88, 28, 135, 0.20), transparent 65%), radial-gradient(circle at 50% 54%, rgba(139, 92, 246, 0.14) 12%, rgba(14, 116, 144, 0.08) 38%, transparent 70%), linear-gradient(180deg, #03040a 0%, #050712 50%, #04050d 100%)',
        }}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-95"
      />
    </div>
  );
};
