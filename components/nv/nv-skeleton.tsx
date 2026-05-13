'use client';

import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';

type NvSkeletonProps = {
  className?: string;
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  staticBg?: boolean;
};

export function NvSkeleton({
  className,
  width,
  height,
  circle = false,
  staticBg = false,
}: NvSkeletonProps) {
  const style: CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };
  return (
    <div
      aria-hidden
      className={cn(
        staticBg ? 'nv-skeleton-static' : 'nv-skeleton',
        circle ? 'rounded-full' : 'rounded-[var(--nv-radius-sm)]',
        className
      )}
      style={style}
    />
  );
}

export function NvSkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }).map((_, idx) => (
        <NvSkeleton key={idx} width={idx === lines - 1 ? '60%' : '100%'} height={12} />
      ))}
    </div>
  );
}

export function NvSkeletonKPI() {
  return (
    <div className="rounded-[var(--nv-radius-md)] border border-[var(--nv-border)] bg-[var(--nv-surface)] p-5">
      <NvSkeleton width="40%" height={11} className="mb-3" />
      <NvSkeleton width="65%" height={28} className="mb-2" />
      <NvSkeleton width="50%" height={11} />
    </div>
  );
}

export function NvSkeletonRow() {
  return (
    <div className="flex items-center gap-4 rounded-[var(--nv-radius-md)] border border-[var(--nv-border)] bg-[var(--nv-surface)] p-4">
      <NvSkeleton width={40} height={40} circle />
      <div className="flex flex-1 flex-col gap-2">
        <NvSkeleton width="55%" height={14} />
        <NvSkeleton width="35%" height={11} />
      </div>
      <NvSkeleton width={80} height={28} />
    </div>
  );
}
