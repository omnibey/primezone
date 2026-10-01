"use client";

import { useEffect, useRef, useCallback } from "react";

type Banner = {
  url?: string;
  link?: string;
  image_url?: string;
  image?: string;
  mobile_image_url?: string;
  mobile_image?: string;
};

interface Props {
  banners?: Banner[];
}

// ── Layout ──
const LARGE_PCT = 0.50;
const MEDIUM_PCT = 0.34;
const SMALL_PCT = 0.16;
const GAP = 2;
const KEYLINE = 16;
const MIN_RADIUS = 24;
const MAX_RADIUS = 40;

// ── Animation ──
const SNAP_DURATION_MS = 800;

// ── Fling detection (px/ms) ──
const FLING_THRESHOLD = 0.3;

// ── Trackpad / wheel ──
const WHEEL_STEP_PX = 80;
const WHEEL_COOLDOWN_MS = 250;

export default function DynamicHeroSlider({ banners = [] }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<Map<number, HTMLImageElement>>(new Map());
  const layoutCache = useRef<{ left: number[]; width: number[] }>({
    left: [],
    width: [],
  });

  const boxSize = useRef({ width: 0, height: 0 });
  const dprRef = useRef(1);

  // ── Focal position (the "scroll" value — 0 = first card, 1 = second, etc.) ──
  const focalProgress = useRef(0);

  // ── Ease-out animation ──
  const animStartTime = useRef<number | null>(null);
  const animFrom = useRef(0);
  const animTo = useRef(0);
  const isAnimating = useRef(false);

  // ── Drag ──
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartFocal = useRef(0);
  const pointerSamples = useRef<{ x: number; t: number }[]>([]);

  // ── Wheel ──
  const wheelAccum = useRef(0);
  const wheelCooldown = useRef(false);

  const rafId = useRef<number | null>(null);
  const n = banners.length;

  // ── AutoPlay ──
  const autoPlayTimer = useRef<NodeJS.Timeout | null>(null);
  const autoPlayDir = useRef<1 | -1>(1);

  // ════════════════════════════════════════════════════════
  // IMAGE LOADING
  // ════════════════════════════════════════════════════════

  useEffect(() => {
    imagesRef.current.clear();
    const isMobile = window.innerWidth < 768;

    banners.forEach((b, i) => {
      const src = isMobile
        ? b.mobile_image_url || b.mobile_image || b.image_url || b.image
        : b.image_url || b.image || b.mobile_image_url || b.mobile_image;
      if (!src) return;

      const img = new Image();
      img.onload = () => requestAnimationFrame(render);
      img.onerror = () => console.warn("Banner image failed:", src);
      img.src = src;
      imagesRef.current.set(i, img);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banners]);

  // ════════════════════════════════════════════════════════
  // LAYOUT MATH
  //
  // At rest:  card₀ = 50%,  card₁ = 34%,  card₂ = 16%
  // During scroll the widths interpolate continuously.
  // ════════════════════════════════════════════════════════

    const computeLayout = useCallback(
      (cssWidth: number) => {
        const visibleCards = Math.min(3, n);
        const visibleGaps = Math.max(0, visibleCards - 1);
        const available = cssWidth - 2 * KEYLINE - visibleGaps * GAP;

        let L = 0, M = 0, S = 0;
        if (n >= 3) {
          L = available * LARGE_PCT;
          M = available * MEDIUM_PCT;
          S = available * SMALL_PCT;
        } else if (n === 2) {
          L = available * (LARGE_PCT / (LARGE_PCT + MEDIUM_PCT));
          M = available * (MEDIUM_PCT / (LARGE_PCT + MEDIUM_PCT));
        } else if (n === 1) {
          L = available;
        }

        const width: number[] = new Array(n).fill(0);
        const left: number[] = new Array(n).fill(0);
        const fp = focalProgress.current;

        const getSlot = (d: number) => {
          if (d <= -2) return { w: 0, x: -GAP - Math.abs(d + 1) * GAP };
          if (d === -1) return { w: 0, x: -GAP };
          if (d === 0) return { w: L, x: 0 };
          if (d === 1) return { w: M, x: L + GAP };
          if (d === 2) return { w: S, x: L + M + 2 * GAP };
          if (d === 3) return { w: 0, x: L + M + S + 3 * GAP };
          if (d >= 4) return { w: 0, x: L + M + S + 3 * GAP + (d - 3) * GAP };
          return { w: 0, x: 0 };
        };

        const interpolateSlot = (d: number) => {
          const d1 = Math.floor(d);
          const frac = d - d1;
          const s1 = getSlot(d1);
          const s2 = getSlot(d1 + 1);
          return {
            w: s1.w + frac * (s2.w - s1.w),
            x: s1.x + frac * (s2.x - s1.x)
          };
        };

        // 1. Calculate standard layout with perfect mathematical gaps
        for (let i = 0; i < n; i++) {
          const slot = interpolateSlot(i - fp);
          width[i] = Math.max(0, slot.w);
          left[i] = KEYLINE + slot.x;
        }

        // 2. End-of-list override: Anchor the last cards so they don't slide off-screen
        if (n >= 3 && fp > n - 3) {
          const t = fp - (n - 3);
          if (t <= 1) {
            width[n - 3] = L + (S - L) * t;
            width[n - 2] = M + (L - M) * t;
            width[n - 1] = S + (M - S) * t;
          } else {
            const t2 = t - 1;
            width[n - 3] = S;
            width[n - 2] = L + (M - L) * t2;
            width[n - 1] = M + (L - M) * t2;
          }
          left[n - 3] = KEYLINE;
          left[n - 2] = left[n - 3] + width[n - 3] + GAP;
          left[n - 1] = left[n - 2] + width[n - 2] + GAP;
        } else if (n === 2 && fp > 0) {
          const t = Math.min(1, fp);
          width[0] = L + (M - L) * t;
          width[1] = M + (L - M) * t;
          left[0] = KEYLINE;
          left[1] = left[0] + width[0] + GAP;
        } else if (n === 1) {
          width[0] = L;
          left[0] = KEYLINE;
        }

        layoutCache.current = { left, width };
        return { left, width, L };
      },
      [n]
    );

  // ════════════════════════════════════════════════════════
  // CANVAS DRAWING
  // ════════════════════════════════════════════════════════

  const roundedRectPath = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
    const radius = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  };

  const drawCover = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number,
    y: number,
    w: number,
    h: number,
    fixedW: number
  ) => {
    // Determine scale to cover the fixed large width and height
    const scale = Math.max(fixedW / img.naturalWidth, h / img.naturalHeight);
    
    // Calculate the size of the drawn image
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;

    // Center the image within the current animated card bounds (w, h)
    const drawX = x + (w - drawW) / 2;
    const drawY = y + (h - drawH) / 2;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  };

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || n === 0) return;

    const { width: cw, height: ch } = boxSize.current;
    if (cw === 0 || ch === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const ratio = dprRef.current;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, cw, ch);

    const { left, width, L } = computeLayout(cw);
    const fp = focalProgress.current;

    for (let i = 0; i < n; i++) {
      const w = width[i];
      const x = left[i];
      if (w < 1 || x + w < -50 || x > cw + 50) continue;

      const offset = i - fp;
      const t = Math.min(1, Math.abs(offset));
      const r = MIN_RADIUS + t * (MAX_RADIUS - MIN_RADIUS);

      ctx.save();
      roundedRectPath(ctx, x, 0, w, ch, r);
      ctx.clip();

      const img = imagesRef.current.get(i);
      if (img && img.complete && img.naturalWidth > 0) {
        drawCover(ctx, img, x, 0, w, ch, L);
      } else {
        ctx.fillStyle = "#e6e6e6";
        ctx.fillRect(x, 0, w, ch);
      }
      ctx.restore();
    }
  }, [computeLayout, n]);

  // ════════════════════════════════════════════════════════
  // RESIZE
  // ════════════════════════════════════════════════════════

  const applySize = useCallback(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    const cw = wrapper.clientWidth;
    const ch = wrapper.clientHeight;
    const ratio = window.devicePixelRatio || 1;

    boxSize.current = { width: cw, height: ch };
    dprRef.current = ratio;

    canvas.width = Math.round(cw * ratio);
    canvas.height = Math.round(ch * ratio);
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;

    render();
  }, [render]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    applySize();
    const ro = new ResizeObserver(() => applySize());
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, [applySize]);

  // ════════════════════════════════════════════════════════
  // EASE-OUT QUART — slow and smooth glide
  // ════════════════════════════════════════════════════════

  const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4);

  // ════════════════════════════════════════════════════════
  // ANIMATION LOOP
  // ════════════════════════════════════════════════════════

  const loop = useCallback(
    (now: number) => {
      // During drag: just render (focalProgress updated by pointer handler)
      if (isDragging.current) {
        render();
        rafId.current = requestAnimationFrame(loop);
        return;
      }

      // Ease-out animation
      if (isAnimating.current && animStartTime.current !== null) {
        const elapsed = now - animStartTime.current;
        const t = Math.min(elapsed / SNAP_DURATION_MS, 1);
        const eased = easeOutQuart(t);

        focalProgress.current =
          animFrom.current +
          (animTo.current - animFrom.current) * eased;

        if (t >= 1) {
          focalProgress.current = animTo.current;
          isAnimating.current = false;
          animStartTime.current = null;
        }

        render();

        if (isAnimating.current) {
          rafId.current = requestAnimationFrame(loop);
        } else {
          rafId.current = null;
        }
        return;
      }

      // Nothing to do
      rafId.current = null;
    },
    [render]
  );

  const ensureLoop = useCallback(() => {
    if (rafId.current == null) {
      rafId.current = requestAnimationFrame(loop);
    }
  }, [loop]);

  // ════════════════════════════════════════════════════════
  // SNAP TO TARGET — starts ease-out from current position
  // ════════════════════════════════════════════════════════

  const snapTo = useCallback(
    (target: number) => {
      const clamped = Math.max(0, Math.min(n - 1, target));
      animFrom.current = focalProgress.current; // wherever we are visually right now
      animTo.current = clamped;
      animStartTime.current = performance.now();
      isAnimating.current = true;
      ensureLoop();
    },
    [n, ensureLoop]
  );

  // ════════════════════════════════════════════════════════
  // AUTOPLAY
  // ════════════════════════════════════════════════════════

  const startAutoPlay = useCallback(() => {
    if (autoPlayTimer.current) clearTimeout(autoPlayTimer.current);
    autoPlayTimer.current = setTimeout(() => {
      // Don't auto-play if the user is currently interacting
      if (isDragging.current) {
        startAutoPlay();
        return;
      }

      if (n <= 1) return;

      const current = Math.round(focalProgress.current);
      let next = current + autoPlayDir.current;

      // Ping-pong loop
      if (next >= n) {
        next = n - 2;
        autoPlayDir.current = -1;
      } else if (next < 0) {
        next = 1;
        autoPlayDir.current = 1;
      }

      next = Math.max(0, Math.min(n - 1, next));
      snapTo(next);
      
      // Loop again
      startAutoPlay();
    }, 3000);
  }, [n, snapTo]);

  useEffect(() => {
    startAutoPlay();
    return () => {
      if (autoPlayTimer.current) clearTimeout(autoPlayTimer.current);
    };
  }, [startAutoPlay]);

  // ════════════════════════════════════════════════════════
  // RUBBER BAND — only used during drag for visual feedback
  // ════════════════════════════════════════════════════════

  const applyRubberBand = (raw: number): number => {
    return Math.max(0, Math.min(n - 1, raw));
  };

  // ════════════════════════════════════════════════════════
  // VELOCITY — from recent pointer samples
  // ════════════════════════════════════════════════════════

  const computeVelocity = (): number => {
    const samples = pointerSamples.current;
    const now = performance.now();

    // Discard stale samples (> 60ms old)
    while (samples.length > 2 && now - samples[0].t > 60) {
      samples.shift();
    }

    if (samples.length < 2) return 0;

    const last = samples[samples.length - 1];

    // If the finger was stationary for > 30ms before lifting, velocity = 0
    if (now - last.t > 30) return 0;

    const first = samples[0];
    const dt = Math.max(1, last.t - first.t);
    return (last.x - first.x) / dt; // px/ms (positive = finger moved right)
  };

  // ════════════════════════════════════════════════════════
  // SNAP TARGET — decides which card to land on
  // ════════════════════════════════════════════════════════

  const computeSnapTarget = (
    rawFocal: number,
    pxPerMs: number
  ): number => {
    const start = Math.round(dragStartFocal.current);

    if (Math.abs(pxPerMs) > FLING_THRESHOLD) {
      // Fling → advance exactly 1 card in that direction
      if (pxPerMs < 0) {
        return Math.min(n - 1, start + 1);
      } else {
        return Math.max(0, start - 1);
      }
    }

    // No fling → snap to nearest, but strictly bounded to +/- 1 card per touch
    const nearest = Math.round(rawFocal);
    const boundedTarget = Math.max(start - 1, Math.min(start + 1, nearest));
    return Math.max(0, Math.min(n - 1, boundedTarget));
  };

  // ════════════════════════════════════════════════════════
  // POINTER DOWN
  // ════════════════════════════════════════════════════════

  const handlePointerDown = (
    e: React.PointerEvent<HTMLCanvasElement>
  ) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;

    // Reset autoplay timer on interaction
    startAutoPlay();

    // Cancel any running animation immediately
    isAnimating.current = false;
    animStartTime.current = null;

    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartFocal.current = focalProgress.current;
    pointerSamples.current = [
      { x: e.clientX, t: performance.now() },
    ];

    try {
      (e.target as HTMLCanvasElement).setPointerCapture(
        e.pointerId
      );
    } catch {}

    ensureLoop();
  };

  // ════════════════════════════════════════════════════════
  // POINTER MOVE
  // ════════════════════════════════════════════════════════

  const handlePointerMove = (
    e: React.PointerEvent<HTMLCanvasElement>
  ) => {
    if (!isDragging.current) return;

    const dx = e.clientX - dragStartX.current;
    const LARGE = boxSize.current.width * LARGE_PCT || 1;

    // Raw focal = where the finger says we should be (unclamped)
    const rawFocal = dragStartFocal.current - dx / LARGE;
    
    // Force max 1 card visual drag per touch
    const start = dragStartFocal.current;
    const boundedFocal = Math.max(start - 1, Math.min(start + 1, rawFocal));

    // Visual focal = rubber-banded version (for rendering)
    focalProgress.current = applyRubberBand(boundedFocal);

    // Record pointer sample for velocity
    const now = performance.now();
    pointerSamples.current.push({ x: e.clientX, t: now });
    // Keep at most 8 recent samples
    while (pointerSamples.current.length > 8) {
      pointerSamples.current.shift();
    }
  };

  // ════════════════════════════════════════════════════════
  // POINTER UP
  // ════════════════════════════════════════════════════════

  const handlePointerUp = (
    e: React.PointerEvent<HTMLCanvasElement>
  ) => {
    if (!isDragging.current) return;
    isDragging.current = false;

    try {
      (e.target as HTMLCanvasElement).releasePointerCapture(
        e.pointerId
      );
    } catch {}

    const totalDrag = Math.abs(
      e.clientX - dragStartX.current
    );

    // ── Tap detection ──
    if (totalDrag < 6) {
      handleTap(e.clientX);
      snapTo(Math.round(focalProgress.current));
      return;
    }

    // ── Compute velocity (px/ms) ──
    const pxPerMs = computeVelocity();

    // ── Compute raw (unclamped) focal for target calculation ──
    const LARGE = boxSize.current.width * LARGE_PCT || 1;
    const rawFocal =
      dragStartFocal.current -
      (e.clientX - dragStartX.current) / LARGE;

    // ── Find target and animate ──
    const target = computeSnapTarget(rawFocal, pxPerMs);
    snapTo(target);
  };

  // ════════════════════════════════════════════════════════
  // TAP (click on a card → navigate)
  // ════════════════════════════════════════════════════════

  const handleTap = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const { left, width } = layoutCache.current;

    for (let i = 0; i < n; i++) {
      if (x >= left[i] && x <= left[i] + width[i]) {
        const href = banners[i]?.url || banners[i]?.link;
        if (href && href !== "#") {
          window.location.href = href;
        }
        break;
      }
    }
  };

  // ════════════════════════════════════════════════════════
  // WHEEL (trackpad two-finger swipe + shift+scroll)
  //
  // Discrete steps: accumulate deltaX until threshold,
  // then advance exactly 1 card. Cooldown prevents rapid fire.
  // ════════════════════════════════════════════════════════

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      const delta =
        Math.abs(e.deltaX) > Math.abs(e.deltaY)
          ? e.deltaX
          : e.shiftKey
            ? e.deltaY
            : 0;
      if (delta === 0) return;

      e.preventDefault();

      if (wheelCooldown.current) {
        wheelAccum.current = 0; // Ignore inertia during cooldown
        return;
      }

      wheelAccum.current += delta;

      if (Math.abs(wheelAccum.current) >= 120) {
        startAutoPlay(); // Reset auto-play on explicit scroll
        
        const direction = wheelAccum.current > 0 ? 1 : -1;
        const current = isAnimating.current
          ? animTo.current
          : Math.round(focalProgress.current);
        const newTarget = Math.max(
          0,
          Math.min(n - 1, current + direction)
        );

        wheelAccum.current = 0;
        wheelCooldown.current = true;

        snapTo(newTarget);

        setTimeout(() => {
          wheelCooldown.current = false;
        }, 400);
      }
    };

    canvas.addEventListener("wheel", handleWheel, {
      passive: false,
    });
    return () => {
      canvas.removeEventListener("wheel", handleWheel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, snapTo]);

  // ── Cleanup ──
  useEffect(() => {
    return () => {
      if (rafId.current != null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  // ════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════

  if (!banners || banners.length === 0) return null;

  return (
    <div className="dynamic-carousel-wrapper" ref={wrapperRef}>
      <canvas
        ref={canvasRef}
        className="dynamic-carousel-canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
    </div>
  );
}