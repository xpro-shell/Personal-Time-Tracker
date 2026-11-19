import React, { useEffect, useRef } from 'react';

interface UniverseBlackHoleCanvasProps {
  variant: 'full' | 'subtle';
}

interface StarParticle {
  angle: number;
  radius: number;
  speed: number;
  size: number;
  hue: string;
  alpha: number;
  orbitTilt: number;
}

interface BgStar {
  x: number;
  y: number;
  r: number;
  alpha: number;
  twinkleSpeed: number;
  phase: number;
  color: string;
}

export const UniverseBlackHoleCanvas: React.FC<UniverseBlackHoleCanvasProps> = ({
  variant,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let rafId = 0;

    const starPalette = ['#e0f2fe', '#c7d2fe', '#fde68a', '#f5d0fe', '#99f6e4'];
    const accretionPalette = [
      '#22d3ee',
      '#60a5fa',
      '#a855f7',
      '#f59e0b',
      '#fbbf24',
      '#34d399',
    ];

    const bgStars: BgStar[] = Array.from({ length: variant === 'full' ? 145 : 70 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.55 + Math.random() * 1.45,
      alpha: 0.28 + Math.random() * 0.65,
      twinkleSpeed: 0.6 + Math.random() * 1.6,
      phase: Math.random() * Math.PI * 2,
      color: starPalette[Math.floor(Math.random() * starPalette.length)],
    }));

    const diskParticles: StarParticle[] =
      variant === 'full'
        ? Array.from({ length: 135 }, (_, i) => {
            const band = i / 135;
            return {
              angle: Math.random() * Math.PI * 2,
              radius: 0.24 + band * 0.68,
              speed: (0.28 + (1 - band) * 0.52) * (Math.random() * 0.35 + 0.85),
              size: 1.0 + Math.random() * 2.1,
              hue: accretionPalette[i % accretionPalette.length],
              alpha: 0.35 + (1 - band) * 0.55,
              orbitTilt: 0.28 + (Math.random() - 0.5) * 0.08,
            };
          })
        : [];

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(320, rect.width);
      height = Math.max(260, rect.height);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const drawFrame = (timeSec: number) => {
      ctx.clearRect(0, 0, width, height);

      // Deep space background nebula wash
      if (variant === 'full') {
        const bgGrad = ctx.createRadialGradient(
          width * 0.54,
          height * 0.44,
          10,
          width * 0.5,
          height * 0.5,
          Math.max(width, height) * 0.82
        );
        bgGrad.addColorStop(0, 'rgba(18, 22, 48, 0.92)');
        bgGrad.addColorStop(0.45, 'rgba(9, 12, 26, 0.96)');
        bgGrad.addColorStop(1, 'rgba(4, 6, 13, 0.99)');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Cosmic purple & cyan nebula clouds
        const neb1 = ctx.createRadialGradient(
          width * 0.22,
          height * 0.25,
          0,
          width * 0.22,
          height * 0.25,
          width * 0.45
        );
        neb1.addColorStop(0, 'rgba(56, 189, 248, 0.14)');
        neb1.addColorStop(0.6, 'rgba(99, 102, 241, 0.06)');
        neb1.addColorStop(1, 'transparent');
        ctx.fillStyle = neb1;
        ctx.fillRect(0, 0, width, height);

        const neb2 = ctx.createRadialGradient(
          width * 0.82,
          height * 0.72,
          0,
          width * 0.82,
          height * 0.72,
          width * 0.46
        );
        neb2.addColorStop(0, 'rgba(192, 132, 252, 0.14)');
        neb2.addColorStop(0.55, 'rgba(245, 158, 11, 0.05)');
        neb2.addColorStop(1, 'transparent');
        ctx.fillStyle = neb2;
        ctx.fillRect(0, 0, width, height);
      }

      // Twinkling Universe Starfield
      bgStars.forEach((s) => {
        const twinkle = prefersReducedMotion
          ? 0.8
          : 0.45 + 0.55 * Math.sin(timeSec * s.twinkleSpeed + s.phase);
        const px = s.x * width;
        const py = s.y * height;
        ctx.globalAlpha = s.alpha * twinkle;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(px, py, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      if (variant === 'full') {
        // Huge Gargantua Black Hole anchored dramatically in background
        const cx = width * 0.52;
        const cy = height * 0.48;
        const baseRadius = Math.min(width, height) * 0.34;
        const horizonR = Math.max(54, Math.min(138, baseRadius * 0.46));
        const maxDiskR = Math.max(150, Math.min(390, baseRadius * 1.48));

        // 1. Gravitational Lensing Halo (outer warm gold -> cyan -> indigo aura)
        const halo = ctx.createRadialGradient(cx, cy, horizonR * 0.88, cx, cy, maxDiskR * 1.18);
        halo.addColorStop(0, 'rgba(0, 0, 0, 0)');
        halo.addColorStop(0.22, 'rgba(251, 191, 36, 0.28)');
        halo.addColorStop(0.42, 'rgba(56, 189, 248, 0.18)');
        halo.addColorStop(0.68, 'rgba(139, 92, 246, 0.11)');
        halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(cx, cy, maxDiskR * 1.18, 0, Math.PI * 2);
        ctx.fill();

        // 2. Vertical Gravitational Lensing Arc (upper & lower bent accretion halo)
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-0.18);

        // Upper lensed arc
        ctx.beginPath();
        ctx.ellipse(0, 0, horizonR * 1.38, horizonR * 1.18, 0, Math.PI * 1.04, Math.PI * 1.96);
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.42)';
        ctx.lineWidth = Math.max(4, horizonR * 0.08);
        ctx.stroke();

        // Inner cyan-white photon ring
        ctx.beginPath();
        ctx.ellipse(0, 0, horizonR * 1.16, horizonR * 1.07, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.45)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Back half of inclined accretion disk (behind event horizon)
        for (let ring = 0; ring < 4; ring++) {
          const rX = horizonR * (1.55 + ring * 0.42);
          const rY = rX * 0.26;
          ctx.beginPath();
          ctx.ellipse(0, 0, rX, rY, 0, Math.PI, Math.PI * 2);
          ctx.strokeStyle =
            ring === 0
              ? 'rgba(253, 224, 71, 0.46)'
              : ring === 1
              ? 'rgba(56, 189, 248, 0.34)'
              : ring === 2
              ? 'rgba(168, 85, 247, 0.24)'
              : 'rgba(52, 211, 153, 0.16)';
          ctx.lineWidth = Math.max(2, 7 - ring * 1.4);
          ctx.stroke();
        }

        // 3. The Event Horizon (Absolute Pitch-Black Singularity Sphere)
        const bhSphere = ctx.createRadialGradient(
          -horizonR * 0.12,
          -horizonR * 0.12,
          horizonR * 0.1,
          0,
          0,
          horizonR
        );
        bhSphere.addColorStop(0, '#000000');
        bhSphere.addColorStop(0.86, '#020205');
        bhSphere.addColorStop(1, '#090b16');
        ctx.fillStyle = bhSphere;
        ctx.beginPath();
        ctx.arc(0, 0, horizonR, 0, Math.PI * 2);
        ctx.fill();

        // Sharp blinding photon rim around event horizon
        ctx.beginPath();
        ctx.arc(0, 0, horizonR + 1.5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(254, 240, 138, 0.65)';
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // 4. Front half of inclined accretion disk (sweeping IN FRONT of event horizon!)
        for (let ring = 0; ring < 5; ring++) {
          const rX = horizonR * (1.42 + ring * 0.38);
          const rY = rX * 0.26;
          ctx.beginPath();
          ctx.ellipse(0, 0, rX, rY, 0, 0, Math.PI);
          ctx.strokeStyle =
            ring === 0
              ? 'rgba(254, 249, 195, 0.65)'
              : ring === 1
              ? 'rgba(251, 191, 36, 0.48)'
              : ring === 2
              ? 'rgba(34, 211, 238, 0.35)'
              : ring === 3
              ? 'rgba(168, 85, 247, 0.24)'
              : 'rgba(16, 185, 129, 0.14)';
          ctx.lineWidth = Math.max(2.2, 8.5 - ring * 1.4);
          ctx.stroke();
        }

        // 5. Orbiting relativistic plasma particles
        diskParticles.forEach((p) => {
          const theta = p.angle + (prefersReducedMotion ? 0 : timeSec * p.speed);
          const rx = horizonR * 1.25 + p.radius * (maxDiskR - horizonR * 0.9);
          const ry = rx * p.orbitTilt;
          const x = Math.cos(theta) * rx;
          const y = Math.sin(theta) * ry;
          const isInFront = Math.sin(theta) >= 0;

          // Hide particles occluded directly behind the black sphere
          if (!isInFront && Math.hypot(x, y) < horizonR * 0.96) return;

          ctx.globalAlpha = isInFront ? p.alpha : p.alpha * 0.45;
          ctx.fillStyle = p.hue;
          ctx.beginPath();
          ctx.arc(x, y, p.size, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;

        ctx.restore();
      }
    };

    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsedSec = (now - startTime) / 1000;
      drawFrame(elapsedSec);
      if (!prefersReducedMotion) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    drawFrame(0);
    if (!prefersReducedMotion) {
      rafId = window.requestAnimationFrame(tick);
    }

    return () => {
      ro.disconnect();
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [variant]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 w-full h-full rounded-2xl"
    />
  );
};
