import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto p-4 space-y-6 max-w-5xl">
      {/* Header Skeleton */}
      <div className="w-full h-48 bg-slate-900/50 rounded-xl border border-slate-800 p-6 flex items-center gap-6">
        <Skeleton className="w-32 h-32 rounded-lg" />
        <div className="space-y-4 flex-1">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
          <div className="flex gap-4 mt-4">
            <Skeleton className="h-12 w-24 rounded-lg" />
            <Skeleton className="h-12 w-24 rounded-lg" />
            <Skeleton className="h-12 w-24 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32 rounded-md" />
          <Skeleton className="h-10 w-32 rounded-md" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
        <Skeleton className="h-[600px] w-full rounded-xl" />
      </div>
    </div>
  );
}
