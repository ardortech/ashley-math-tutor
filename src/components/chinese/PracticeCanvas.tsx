import { useRef, useEffect, useCallback, useState } from "react";
import TiaoTiaoHeadHappy from "../pet/TiaoTiaoHeadHappy";

interface Props {
  char: string;
  onDone: () => void;
}

const CANVAS_SIZE = 240;
const LINE_COLOR = "#1B2638";
const MIN_WIDTH = 2;
const MAX_WIDTH = 8;

function pressureToWidth(pressure: number): number {
  if (pressure === 0) return 3;
  return MIN_WIDTH + (MAX_WIDTH - MIN_WIDTH) * Math.min(pressure, 1);
}

export default function PracticeCanvas({ char, onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [finished, setFinished] = useState(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const drawGuideLines = useCallback((ctx: CanvasRenderingContext2D) => {
    const s = CANVAS_SIZE;
    const half = s / 2;

    ctx.clearRect(0, 0, s, s);

    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);

    ctx.beginPath();
    ctx.moveTo(half, 0);
    ctx.lineTo(half, s);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, half);
    ctx.lineTo(s, half);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(s, s);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(s, 0);
    ctx.lineTo(0, s);
    ctx.stroke();

    ctx.setLineDash([]);

    const chars = [...char];
    const perChar = s / chars.length;
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${perChar * 0.75}px 'LXGW WenKai TC', 'Noto Sans TC', sans-serif`;
    chars.forEach((c, i) => {
      ctx.fillText(c, perChar * i + perChar / 2, s / 2);
    });
  }, [char]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawGuideLines(ctx);
    setHasDrawn(false);
    setFinished(false);
  }, [char, drawGuideLines]);

  const getPos = useCallback((e: PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_SIZE / rect.width;
    const scaleY = CANVAS_SIZE / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (finished) return;
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.setPointerCapture(e.pointerId);
      const pos = getPos(e.nativeEvent);
      if (!pos) return;
      lastPoint.current = pos;
      setDrawing(true);
      setHasDrawn(true);

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, pressureToWidth(e.pressure) / 2, 0, Math.PI * 2);
      ctx.fillStyle = LINE_COLOR;
      ctx.fill();
    },
    [finished, getPos],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!drawing || finished) return;
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const pos = getPos(e.nativeEvent);
      if (!pos || !lastPoint.current) return;

      ctx.beginPath();
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = LINE_COLOR;
      ctx.lineWidth = pressureToWidth(e.pressure);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      lastPoint.current = pos;
    },
    [drawing, finished, getPos],
  );

  const handlePointerUp = useCallback(() => {
    setDrawing(false);
    lastPoint.current = null;
  }, []);

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawGuideLines(ctx);
    setHasDrawn(false);
  }, [drawGuideLines]);

  const handleFinish = useCallback(() => {
    setFinished(true);
  }, []);

  return (
    <div className="rounded-2xl border border-card-border bg-card p-4">
      <p className="text-sm font-bold text-ink mb-3 text-center">
        用筆練寫「{char}」
      </p>

      <div className="flex justify-center mb-3">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="rounded-xl border-2 border-ink/20"
          style={{
            width: CANVAS_SIZE,
            height: CANVAS_SIZE,
            touchAction: "none",
            cursor: finished ? "default" : "crosshair",
          }}
        />
      </div>

      {finished ? (
        <div className="flex items-center gap-2 justify-center animate-fade-in">
          <div className="shrink-0" style={{ width: 28, height: 28 }}>
            <TiaoTiaoHeadHappy className="w-full h-full pet-nod" />
          </div>
          <p className="text-sm font-medium text-success">寫得很認真！</p>
          <button
            onClick={onDone}
            className="ml-2 text-sm text-primary font-medium underline underline-offset-2"
          >
            收起
          </button>
        </div>
      ) : (
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleClear}
            disabled={!hasDrawn}
            className="rounded-xl border border-card-border bg-bg px-5 py-2.5 text-sm font-medium text-ink
              active:bg-card-border/30 transition-colors disabled:opacity-40"
          >
            清除
          </button>
          <button
            onClick={handleFinish}
            disabled={!hasDrawn}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white
              shadow-[0_4px_0_0_var(--color-primary-pressed)]
              active:translate-y-0.5 active:shadow-[0_2px_0_0_var(--color-primary-pressed)]
              transition-all disabled:opacity-40"
          >
            寫好了
          </button>
        </div>
      )}
    </div>
  );
}
