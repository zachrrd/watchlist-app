import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ContentRailProps {
  title: string;
  description?: string;
  count?: number;
  children: React.ReactNode;
  className?: string;
}

export default function ContentRail({
  title,
  description,
  count,
  children,
  className = '',
}: ContentRailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    // Allow slight tolerance for subpixel rounding
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
  }, []);

  useEffect(() => {
    checkScrollability();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener('scroll', checkScrollability, { passive: true });
    window.addEventListener('resize', checkScrollability);

    // Initial check after children render
    const timeout = setTimeout(checkScrollability, 100);

    return () => {
      el.removeEventListener('scroll', checkScrollability);
      window.removeEventListener('resize', checkScrollability);
      clearTimeout(timeout);
    };
  }, [checkScrollability, children]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    // Scroll by ~75% of the visible container width
    const scrollDistance = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === 'left' ? -scrollDistance : scrollDistance,
      behavior: 'smooth',
    });
  };

  // If no content or count is zero, return null to avoid empty rails
  if (count === 0) return null;

  return (
    <section className={`w-full overflow-hidden space-y-2.5 ${className}`}>
      {/* Rail Header */}
      <div className="flex items-center justify-between gap-4 px-0.5">
        <div className="flex items-baseline gap-2.5 min-w-0">
          <h2 className="text-lg sm:text-xl font-semibold tracking-[-0.02em] text-zinc-100 truncate">
            {title}
          </h2>
          {typeof count === 'number' && (
            <span className="shrink-0 rounded-full border border-white/[0.07] bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium tabular-nums text-zinc-400">
              {count}
            </span>
          )}
          {description && (
            <span className="hidden md:inline text-xs text-zinc-400 truncate">
              · {description}
            </span>
          )}
        </div>

        {/* Desktop Navigation Arrows — positioned in header to avoid covering posters */}
        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={!canScrollLeft}
            onClick={() => handleScroll('left')}
            className={`h-8 w-8 rounded-full border border-white/[0.08] bg-[#111216] text-zinc-300 transition-all ${
              canScrollLeft
                ? 'hover:bg-white/[0.08] hover:text-white cursor-pointer active:scale-95'
                : 'opacity-25 cursor-not-allowed pointer-events-none'
            }`}
            aria-label={`Scroll ${title} left`}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={!canScrollRight}
            onClick={() => handleScroll('right')}
            className={`h-8 w-8 rounded-full border border-white/[0.08] bg-[#111216] text-zinc-300 transition-all ${
              canScrollRight
                ? 'hover:bg-white/[0.08] hover:text-white cursor-pointer active:scale-95'
                : 'opacity-25 cursor-not-allowed pointer-events-none'
            }`}
            aria-label={`Scroll ${title} right`}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Horizontal Scroll Track */}
      <div
        ref={scrollRef}
        className="flex items-stretch gap-3.5 sm:gap-4 overflow-x-auto scrollbar-none py-2 px-1 -mx-1 scroll-smooth snap-x snap-mandatory"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {children}
      </div>
    </section>
  );
}
