import React, { useRef } from 'react';

export type SheetSnap = 'min' | 'peek' | 'full';

interface SheetLayoutProps {
  /** Full-bleed map layer */
  map: React.ReactNode;
  /** Sticky top section of the panel (search / inputs) */
  header: React.ReactNode;
  /** Scrollable panel body */
  children: React.ReactNode;
  /** Single line shown when the mobile sheet is minimised */
  minContent?: React.ReactNode;
  snap: SheetSnap;
  onSnapChange: (snap: SheetSnap) => void;
}

const ORDER: SheetSnap[] = ['min', 'peek', 'full'];

const SNAP_HEIGHT: Record<SheetSnap, string> = {
  min: 'h-[92px]',
  peek: 'h-[46%]',
  full: 'h-[calc(100%-12px)]',
};

export const SheetLayout: React.FC<SheetLayoutProps> = ({
  map,
  header,
  children,
  minContent,
  snap,
  onSnapChange,
}) => {
  const touchStartY = useRef<number | null>(null);

  const step = (dir: 1 | -1) => {
    const idx = ORDER.indexOf(snap);
    const next = ORDER[Math.min(ORDER.length - 1, Math.max(0, idx + dir))];
    onSnapChange(next);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartY.current = null;
    if (dy < -30) step(1);
    else if (dy > 30) step(-1);
  };

  const isMin = snap === 'min';

  return (
    <div className="relative h-full w-full overflow-hidden">
      {map}

      <section
        className={`absolute z-20 inset-x-0 bottom-0 ${SNAP_HEIGHT[snap]} bg-white rounded-t-[28px] shadow-[0_-8px_30px_rgba(15,23,42,0.12)] flex flex-col transition-[height] duration-300 ease-out
          lg:top-4 lg:left-4 lg:bottom-4 lg:right-auto lg:w-[400px] lg:h-auto lg:rounded-[28px] lg:shadow-2xl lg:shadow-slate-900/10 lg:ring-1 lg:ring-slate-900/5`}
      >
        {/* Drag handle (mobile) */}
        <div
          className="lg:hidden shrink-0 pt-2.5 pb-1.5 flex justify-center cursor-grab touch-none"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onClick={() => onSnapChange(snap === 'full' ? 'peek' : snap === 'peek' ? 'full' : 'peek')}
        >
          <div className="w-10 h-1.5 rounded-full bg-slate-200" />
        </div>

        {isMin && minContent ? (
          <div
            className="lg:hidden px-5 pb-safe flex-1 flex items-center"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onClick={() => onSnapChange('peek')}
          >
            {minContent}
          </div>
        ) : null}

        <div className={`${isMin ? 'hidden lg:flex' : 'flex'} flex-col flex-1 min-h-0`}>
          <div className="shrink-0 px-4 lg:px-5 pt-1 lg:pt-5 pb-3">{header}</div>
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2 lg:px-3 pb-safe">{children}</div>
        </div>
      </section>
    </div>
  );
};
