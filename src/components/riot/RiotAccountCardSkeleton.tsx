"use client";

/**
 * Skeleton UI para RiotAccountCard
 * Muestra un placeholder mientras se carga la información
 */
export function RiotAccountCardSkeleton() {
  return (
    <div className="w-full">
      {/* Main Card */}
      <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-[#0f111a] amoled:bg-black">
        <div className="p-4 md:p-5 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full md:items-center">
            <div className="flex flex-col md:flex-row items-center md:items-center gap-4 md:gap-6 flex-1 min-h-[180px]">
              {/* Left: Profile Icon Skeleton */}
              <div className="relative flex-shrink-0">
                <div className="relative w-20 h-20 md:w-22 md:h-22 rounded-full border-[3px] border-gray-300 dark:border-gray-700 shadow-lg overflow-hidden bg-gray-200 dark:bg-gray-800 animate-pulse" />
              </div>

              {/* Middle: Info Skeleton */}
              <div className="flex-1 text-center md:text-left space-y-3 min-w-0 w-full flex flex-col justify-center">
                {/* Name skeleton */}
                <div className="space-y-2">
                  <div className="h-7 bg-gray-300 dark:bg-gray-700 rounded w-48 animate-pulse" />
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-32 animate-pulse" />
                </div>

                {/* Winrate bar skeleton */}
                <div className="max-w-xs mx-auto md:mx-0 space-y-2">
                  <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-full animate-pulse" />
                  <div className="h-2 bg-gray-300 dark:bg-gray-700 rounded w-full animate-pulse" />
                </div>
              </div>
            </div>

            {/* Right: Queue Rankings Skeleton */}
            <div className="w-full md:max-w-xs">
              <div className="grid grid-cols-2 gap-1.5 w-full">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="relative overflow-hidden rounded-xl bg-gray-200 dark:bg-gray-800 px-2.5 py-2 flex flex-col items-center text-center gap-1.5 animate-pulse"
                  >
                    <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-20" />
                    <div className="w-24 h-24 bg-gray-300 dark:bg-gray-700 rounded" />
                    <div className="space-y-1 w-full">
                      <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-16 mx-auto" />
                      <div className="h-2 bg-gray-300 dark:bg-gray-700 rounded w-12 mx-auto" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions Skeleton */}
      <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-40 animate-pulse" />
        <div className="flex items-center gap-4">
          <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-24 animate-pulse" />
          <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-20 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
