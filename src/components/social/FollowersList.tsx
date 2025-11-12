'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useFollowers } from '@/hooks/useSocialFeatures'
import { Users, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface FollowersListProps {
  publicId: string
  userColor?: string
}

export const FollowersList = ({ publicId, userColor = '#3b82f6' }: FollowersListProps) => {
  const [page, setPage] = useState(1)
  const limit = 20
  
  const { data, isLoading, error } = useFollowers(publicId, page, limit)
  
  const colorStyle = {
    '--user-color': userColor,
  } as React.CSSProperties

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Error al cargar seguidores</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" style={{ color: userColor }} />
          Seguidores ({data?.total || 0})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          // Skeleton loading
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
          ))
        ) : data?.followers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Sin seguidores aún</p>
          </div>
        ) : (
          <>
            {/* Lista de seguidores */}
            <div className="space-y-3">
              {data?.followers.map((follow) => (
                <div key={follow.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <Link href={`/perfil/${follow.follower.public_id}`}>
                    <Avatar className="w-10 h-10 cursor-pointer hover:scale-105 transition-transform">
                      <AvatarImage src={follow.follower.avatar_url || undefined} />
                      <AvatarFallback 
                        style={{
                          backgroundColor: `color-mix(in srgb, ${follow.follower.color || userColor} 15%, transparent)`,
                          color: follow.follower.color || userColor
                        }}
                      >
                        {follow.follower.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  
                  <div className="flex-1 min-w-0">
                    <Link 
                      href={`/perfil/${follow.follower.public_id}`}
                      className="font-medium hover:underline truncate block"
                    >
                      {follow.follower.username}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      {follow.follower.role !== 'user' && (
                        <Badge variant="secondary" className="text-xs">
                          {follow.follower.role === 'admin' ? 'Admin' : 'Mod'}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        Desde {new Date(follow.created_at).toLocaleDateString('es-ES', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    style={{
                      borderColor: `color-mix(in srgb, var(--user-color) 30%, transparent)`,
                      color: `var(--user-color)`,
                      ...colorStyle
                    }}
                  >
                    Ver perfil
                  </Button>
                </div>
              ))}
            </div>
            
            {/* Paginación */}
            {data && data.total > limit && (
              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>
                
                <span className="text-sm text-muted-foreground">
                  Página {page} de {Math.ceil(data.total / limit)}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= Math.ceil(data.total / limit)}
                  className="gap-1"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
