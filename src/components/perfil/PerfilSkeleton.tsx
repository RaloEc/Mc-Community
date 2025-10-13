'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export const PerfilSkeleton = () => {
  return (
    <div className="container mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <Card className="overflow-hidden">
        {/* Banner Skeleton */}
        <Skeleton className="h-48 w-full rounded-none" />
        
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 -mt-16">
            {/* Avatar Skeleton */}
            <Skeleton className="w-24 h-24 rounded-full border-4 border-background" />
            
            {/* Info Skeleton */}
            <div className="flex-grow w-full sm:w-auto space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="space-y-2">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex flex-col items-center p-4 rounded-lg border"
              >
                <Skeleton className="h-12 w-12 rounded-full mb-3" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs Skeleton */}
      <Tabs defaultValue="hilos" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="hilos" disabled>
            <Skeleton className="h-4 w-20" />
          </TabsTrigger>
          <TabsTrigger value="respuestas" disabled>
            <Skeleton className="h-4 w-20" />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hilos" className="mt-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="p-4 rounded-lg border space-y-2"
                >
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-3/4" />
                  <div className="flex gap-2 mt-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
