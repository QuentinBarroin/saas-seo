import { NvSkeleton } from '@/components/nv';

export default function AppLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <NvSkeleton className="h-6 w-48" />
        <NvSkeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NvSkeleton className="h-32" />
        <NvSkeleton className="h-32" />
        <NvSkeleton className="h-32" />
      </div>
    </div>
  );
}
