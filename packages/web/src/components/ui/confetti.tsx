'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface ConfettiPiece {
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
  speedX: number;
  speedY: number;
  rotationSpeed: number;
  opacity: number;
}

interface ConfettiProps {
  active: boolean;
  duration?: number;
  particleCount?: number;
  className?: string;
}

const CONFETTI_COLORS = [
  '#4A7C6F', // sage green (primary)
  '#6B8FA3', // slate blue (secondary)
  '#8B6FB0', // vinny purple (accent)
  '#5B9A6F', // success green
  '#C4943D', // warm amber
  '#5B84C4', // calm blue
];

export function Confetti({
  active,
  duration = 3000,
  particleCount = 60,
  className,
}: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const piecesRef = useRef<ConfettiPiece[]>([]);
  const [visible, setVisible] = useState(false);

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const createPieces = useCallback(
    (width: number, height: number): ConfettiPiece[] => {
      return Array.from({ length: particleCount }, () => ({
        x: Math.random() * width,
        y: -10 - Math.random() * height * 0.3,
        size: 4 + Math.random() * 6,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        rotation: Math.random() * 360,
        speedX: (Math.random() - 0.5) * 3,
        speedY: 1.5 + Math.random() * 3,
        rotationSpeed: (Math.random() - 0.5) * 8,
        opacity: 1,
      }));
    },
    [particleCount]
  );

  useEffect(() => {
    if (!active || prefersReducedMotion) return;

    setVisible(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    piecesRef.current = createPieces(canvas.width, canvas.height);
    const startTime = Date.now();

    function animate() {
      if (!canvas || !ctx) return;

      const elapsed = Date.now() - startTime;
      const fadeStart = duration * 0.6;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let activePieces = 0;
      for (const piece of piecesRef.current) {
        piece.x += piece.speedX;
        piece.y += piece.speedY;
        piece.rotation += piece.rotationSpeed;
        piece.speedY += 0.05; // gravity

        // Fade out
        if (elapsed > fadeStart) {
          piece.opacity = Math.max(0, 1 - (elapsed - fadeStart) / (duration - fadeStart));
        }

        if (piece.opacity <= 0 || piece.y > canvas.height + 20) continue;
        activePieces++;

        ctx.save();
        ctx.translate(piece.x, piece.y);
        ctx.rotate((piece.rotation * Math.PI) / 180);
        ctx.globalAlpha = piece.opacity;
        ctx.fillStyle = piece.color;
        ctx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size * 0.6);
        ctx.restore();
      }

      if (elapsed < duration && activePieces > 0) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setVisible(false);
      }
    }

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [active, duration, prefersReducedMotion, createPieces]);

  if (!visible || prefersReducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
      aria-hidden="true"
    />
  );
}
