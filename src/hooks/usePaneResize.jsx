import { useCallback, useEffect, useRef, useState } from 'react';

export function useHorizontalResize({
  initial,
  min = 180,
  max = 520,
  storageKey,
}) {
  const [size, setSize] = useState(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const n = Number(saved);
          if (!Number.isNaN(n)) return Math.min(max, Math.max(min, n));
        }
      } catch {
        /* ignore */
      }
    }
    return initial;
  });

  const sizeRef = useRef(size);
  sizeRef.current = size;

  const persist = useCallback((value) => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, String(Math.round(value)));
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  const startDrag = useCallback((side, event) => {
    event.preventDefault();
    const startX = event.clientX;
    const startSize = sizeRef.current;

    const onMove = (e) => {
      const delta = side === 'left' ? e.clientX - startX : startX - e.clientX;
      const next = Math.min(max, Math.max(min, startSize + delta));
      setSize(next);
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.classList.remove('zd-resize-active');
      persist(sizeRef.current);
    };

    document.body.classList.add('zd-resize-active');
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [min, max, persist]);

  return { size, startDrag };
}

export function PaneResizeHandle({ side, onMouseDown, label }) {
  return (
    <div
      className={`zd-pane-resizer zd-pane-resizer--${side}`}
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      onMouseDown={onMouseDown}
      title={label}
    />
  );
}

export function usePaneLayoutStorage() {
  useEffect(() => () => {
    document.body.classList.remove('zd-resize-active');
  }, []);
}
