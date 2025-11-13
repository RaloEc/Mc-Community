"use client";

export function NewsSkeleton() {
  return (
    <div>
      {/* Ticker de noticias skeleton */}
      <div className="hidden md:flex items-center text-white text-sm py-2 px-4 rounded-t-lg bg-gray-300 dark:bg-gray-700">
        <div className="flex items-center font-medium mr-4 whitespace-nowrap">
          <div className="h-4 w-4 mr-2 bg-gray-400 dark:bg-gray-600 rounded-full animate-pulse"></div>
          <div className="h-4 w-24 bg-gray-400 dark:bg-gray-600 rounded animate-pulse"></div>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="whitespace-nowrap">
            <div className="inline-block mr-8 h-4 w-40 bg-gray-400 dark:bg-gray-600 rounded animate-pulse"></div>
            <div className="inline-block mr-8 h-4 w-32 bg-gray-400 dark:bg-gray-600 rounded animate-pulse"></div>
            <div className="inline-block mr-8 h-4 w-36 bg-gray-400 dark:bg-gray-600 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Contenido principal skeleton */}
      <div className="bg-white dark:bg-black rounded-lg shadow-sm overflow-hidden">
        {/* Encabezado con pestañas skeleton */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded my-4 animate-pulse"></div>

              {/* Pestañas de navegación skeleton */}
              <div className="hidden md:flex -mb-px space-x-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="py-4 px-1">
                    <div className="flex items-center">
                      <div className="h-4 w-4 mr-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block">
                <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Columna principal skeleton */}
            <div className="lg:w-2/3">
              {/* Noticia destacada skeleton */}
              <div className="mb-10">
                <div className="relative aspect-video rounded-xl overflow-hidden mb-4 bg-gray-200 dark:bg-gray-800 animate-pulse">
                  <div className="absolute top-4 left-4">
                    <div className="h-5 w-20 bg-white/90 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="px-2">
                  <div className="h-7 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse"></div>
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse"></div>
                  <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse"></div>
                  <div className="flex items-center space-x-4">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Grid de noticias secundarias skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="group">
                    <div className="relative aspect-video rounded-lg overflow-hidden mb-3 bg-gray-200 dark:bg-gray-800 animate-pulse">
                      <div className="absolute top-2 right-2">
                        <div className="h-5 w-12 bg-black/60 rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div className="px-1">
                      <div className="h-5 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse"></div>
                      <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse"></div>
                      <div className="flex items-center space-x-4">
                        <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Barra lateral skeleton */}
            <div className="lg:w-1/3 space-y-6">
              <div className="rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse"></div>
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-start space-x-3 py-2">
                      <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      <div className="flex-1">
                        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse"></div>
                        <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse"></div>
                <div className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded mb-3 animate-pulse"></div>
                <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
