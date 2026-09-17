import { useEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";

type ScrollContainerProps = {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export function ScrollContainer({
  hasMore,
  isLoading,
  onLoadMore,
  children,
  className,
  style,
}: ScrollContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const trigger = triggerRef.current;
    if (!container || !trigger || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoading) onLoadMore();
      },
      { root: container, rootMargin: "200px" },
    );

    observer.observe(trigger);
    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore]);

  return (
    <div ref={containerRef} className={className} style={style}>
      {children}
      <div ref={triggerRef} aria-hidden="true" style={{ height: 1 }} />
      {isLoading && <div className="load-more-state">正在加载更多…</div>}
      {!hasMore && <div className="load-more-state">没有更多数据了</div>}
    </div>
  );
}
