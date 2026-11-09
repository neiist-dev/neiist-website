"use client";

import { useEffect, useRef } from "react";
import { createCloud } from "@/lib/ticketCode";

export default function TicketPassCanvas({
  value,
  isValidated = false,
  className,
}: {
  value: string;
  isValidated?: boolean;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cloudRef = useRef<ReturnType<typeof createCloud>>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cloud = (cloudRef.current = createCloud(value, isValidated));
    const t0 = performance.now();
    let raf = 0;

    const loop = (now: number) => {
      const size = Math.round(canvas.clientWidth * (window.devicePixelRatio || 1));
      if (canvas.width !== size && size > 0) canvas.width = canvas.height = size;

      if (size > 0) cloud.frame(ctx, size, (now - t0) / 1000);
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [value, isValidated]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%", display: "block" }}
      role="img"
      aria-label={`QR code for ${value}`}
      onClick={() => cloudRef.current?.restart()}
    />
  );
}
