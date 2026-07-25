"use client";

import { useRef, useState } from "react";

const DEFAULT_FOCUS = { x: 50, y: 50 };

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function PhotoUpload({
  currentUrl,
  currentFocus,
}: {
  currentUrl: string | null;
  currentFocus: { x: number; y: number };
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [focus, setFocus] = useState(currentFocus);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  const displayUrl = removed ? null : (preview ?? currentUrl);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setRemoved(false);
    setFocus(DEFAULT_FOCUS); // new photo — reset framing to centre
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleRemove() {
    setRemoved(true);
    setPreview(null);
    setFocus(DEFAULT_FOCUS);
    if (inputRef.current) inputRef.current.value = "";
  }

  function focusFromPointer(e: React.PointerEvent) {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    setFocus({
      x: clamp(((e.clientX - rect.left) / rect.width) * 100),
      y: clamp(((e.clientY - rect.top) / rect.height) * 100),
    });
  }

  function handlePointerDown(e: React.PointerEvent) {
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    focusFromPointer(e);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (dragging) focusFromPointer(e);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    const step = e.shiftKey ? 10 : 2;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    setFocus((f) => ({ x: clamp(f.x + move[0]), y: clamp(f.y + move[1]) }));
  }

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name="remove_photo" value={removed ? "true" : "false"} />
      <input type="hidden" name="photo_focus_x" value={focus.x} />
      <input type="hidden" name="photo_focus_y" value={focus.y} />
      <input
        ref={inputRef}
        id="photo"
        name="photo"
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
      />

      {displayUrl ? (
        <div className="flex flex-col gap-2">
          {/* Focal-point picker — the frame mirrors the detail-page banner, so
              wherever the marker sits is what the banner will show. */}
          <div
            ref={frameRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={() => setDragging(false)}
            className="relative h-52 w-full cursor-crosshair touch-none overflow-hidden rounded-xl select-none"
          >
            <img
              src={displayUrl}
              alt="Vehicle"
              draggable={false}
              className="h-full w-full object-cover"
              style={{ objectPosition: `${focus.x}% ${focus.y}%` }}
            />
            <div className="pointer-events-none absolute inset-0 bg-black/10" />
            <button
              type="button"
              aria-label="Photo focal point — drag, or use arrow keys to adjust"
              onKeyDown={handleKeyDown}
              className="absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-white/25 shadow-[0_0_0_2px_rgba(0,0,0,0.35)] outline-none ring-white/70 backdrop-blur-[1px] focus-visible:ring-2"
              style={{ left: `${focus.x}%`, top: `${focus.y}%` }}
            >
              <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
            </button>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Drag the dot (or use arrow keys) to set which part of the photo stays in frame.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="h-9 flex-1 rounded-lg border border-zinc-300 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Change photo
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="h-9 rounded-lg border border-zinc-300 px-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 dark:border-zinc-700 dark:hover:bg-red-950"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 text-sm text-zinc-400 transition-colors hover:border-zinc-400 hover:text-zinc-600 dark:border-zinc-700 dark:hover:border-zinc-500 dark:hover:text-zinc-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          Add a photo
        </button>
      )}
    </div>
  );
}
