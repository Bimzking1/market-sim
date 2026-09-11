import { useEffect, useRef } from "react";

export function Sparkline({
  history,
  positive,
  width = 80,
  height = 28,
}: {
  history: number[];
  positive: boolean;
  width?: number;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || history.length < 2) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min || 1;

    const points = history.map((v, i) => ({
      x: (i / (history.length - 1)) * width,
      y: height - ((v - min) / range) * (height - 4) - 2,
    }));

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = positive ? "#40a868" : "#d05040";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const last = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(last.x, last.y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = positive ? "#40a868" : "#d05040";
    ctx.fill();
  }, [history, positive, width, height]);

  if (history.length < 2) {
    return <div className="text-[10px] text-mist-400">No data</div>;
  }

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className="block"
    />
  );
}
