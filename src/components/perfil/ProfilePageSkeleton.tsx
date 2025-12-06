"use client";

import { Card, CardBody, Skeleton } from "@nextui-org/react";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Skeleton de página completa para /perfil
 * Se muestra mientras cargan TODOS los datos para evitar carga escalonada
 */
export function ProfilePageSkeleton() {
  const isMobile = useIsMobile(1024);

  if (isMobile) {
    return <MobileProfileSkeleton />;
  }

  return <DesktopProfileSkeleton />;
}

function MobileProfileSkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-black amoled:bg-black animate-pulse">
      {/* Header con banner y avatar */}
      <div className="relative">
        {/* Banner skeleton */}
        <Skeleton className="w-full h-32 rounded-none" />

        {/* Avatar skeleton */}
        <div className="absolute -bottom-12 left-4">
          <Skeleton className="w-24 h-24 rounded-full" />
        </div>
      </div>

      {/* Info del usuario */}
      <div className="pt-16 px-4 space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-6 w-32 rounded-lg" />
            <Skeleton className="h-4 w-24 rounded-lg" />
          </div>
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>

        {/* Bio skeleton */}
        <Skeleton className="h-16 w-full rounded-lg" />

        {/* Stats skeleton */}
        <div className="flex gap-4">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>

        {/* Tabs skeleton */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>

        {/* Activity cards skeleton */}
        <div className="space-y-4 pt-4">
          {[1, 2, 3, 4].map((i) => (
            <Card
              key={i}
              className="bg-white dark:bg-black amoled:bg-black border border-gray-200 dark:border-gray-800"
            >
              <CardBody className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4 rounded-lg" />
                    <Skeleton className="h-3 w-1/2 rounded-lg" />
                  </div>
                </div>
                <Skeleton className="h-12 w-full rounded-lg" />
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function DesktopProfileSkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-black amoled:bg-black">
      <div className="container mx-auto px-4 py-8 max-w-6xl animate-pulse">
        {/* Profile Header Skeleton */}
        <div className="mb-8">
          <Card className="bg-white dark:bg-black amoled:bg-black overflow-hidden">
            {/* Banner */}
            <Skeleton className="w-full h-48 rounded-none" />

            {/* Avatar y info */}
            <CardBody className="relative pt-0">
              <div className="flex items-end gap-6 -mt-16 px-6">
                {/* Avatar */}
                <Skeleton className="w-32 h-32 rounded-full ring-4 ring-white dark:ring-black" />

                {/* Info del usuario */}
                <div className="flex-1 pb-4 space-y-2">
                  <Skeleton className="h-8 w-48 rounded-lg" />
                  <Skeleton className="h-4 w-32 rounded-lg" />
                  <div className="flex gap-4 mt-2">
                    <Skeleton className="h-5 w-24 rounded-lg" />
                    <Skeleton className="h-5 w-24 rounded-lg" />
                    <Skeleton className="h-5 w-24 rounded-lg" />
                  </div>
                </div>

                {/* Botón editar */}
                <Skeleton className="h-10 w-28 rounded-lg" />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Bio Skeleton */}
        <div className="mb-8">
          <Card className="bg-white dark:bg-black amoled:bg-black">
            <CardBody className="p-6">
              <Skeleton className="h-6 w-full rounded-lg" />
              <Skeleton className="h-6 w-3/4 rounded-lg mt-2" />
            </CardBody>
          </Card>
        </div>

        {/* Tabs Skeleton */}
        <div className="flex gap-4 mb-8 border-b border-gray-200 dark:border-gray-800 pb-4">
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>

        {/* Content Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna izquierda - Feed */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filtros */}
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-8 w-20 rounded-md" />
              ))}
            </div>

            {/* Activity cards */}
            {[1, 2, 3, 4, 5].map((i) => (
              <Card
                key={i}
                className="bg-white dark:bg-black amoled:bg-black border border-gray-200 dark:border-gray-800"
              >
                <CardBody className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4 rounded-lg" />
                      <Skeleton className="h-4 w-1/2 rounded-lg" />
                    </div>
                    <Skeleton className="h-4 w-16 rounded-lg" />
                  </div>
                  <Skeleton className="h-16 w-full rounded-lg" />
                </CardBody>
              </Card>
            ))}
          </div>

          {/* Columna derecha - Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Friend requests skeleton */}
            <Card className="bg-white dark:bg-black amoled:bg-black">
              <CardBody className="p-4 space-y-3">
                <Skeleton className="h-5 w-40 rounded-lg" />
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <Skeleton className="h-4 w-24 rounded-lg" />
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Friends list skeleton */}
            <Card className="bg-white dark:bg-black amoled:bg-black">
              <CardBody className="p-4 space-y-3">
                <Skeleton className="h-5 w-24 rounded-lg" />
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <Skeleton key={i} className="h-12 w-12 rounded-full" />
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Stats skeleton */}
            <Card className="bg-white dark:bg-black amoled:bg-black">
              <CardBody className="p-4 space-y-3">
                <Skeleton className="h-5 w-28 rounded-lg" />
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="text-center space-y-1">
                      <Skeleton className="h-8 w-12 mx-auto rounded-lg" />
                      <Skeleton className="h-3 w-16 mx-auto rounded-lg" />
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Membership info skeleton */}
            <Card className="bg-white dark:bg-black amoled:bg-black">
              <CardBody className="p-4 space-y-3">
                <Skeleton className="h-5 w-32 rounded-lg" />
                <Skeleton className="h-4 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4 rounded-lg" />
              </CardBody>
            </Card>

            {/* Logout button skeleton */}
            <Card className="bg-white dark:bg-black amoled:bg-black">
              <CardBody>
                <Skeleton className="h-10 w-full rounded-lg" />
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePageSkeleton;
