'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useFriends } from '@/hooks/useSocialFeatures'
import { Users, MessageCircle, UserMinus } from 'lucide-react'
import Link from 'next/link'

interface FriendsListProps {
  publicId: string
  userColor?: string
  showActions?: boolean
}

export const FriendsList = ({ 
  publicId, 
  userColor = '#3b82f6',
  showActions = false 
}: FriendsListProps) => {
  const { data, isLoading, error } = useFriends(publicId)
  
  const colorStyle = {
    '--user-color': userColor,
  } as React.CSSProperties

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Error al cargar amigos</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" style={{ color: userColor }} />
          Amigos ({data?.total || 0})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          // Skeleton loading
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
                {showActions && (
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : data?.friends.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Sin amigos aún</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data?.friends.map((friendship) => (
              <div key={friendship.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <Link href={`/perfil/${friendship.friend.public_id}`}>
                  <Avatar className="w-12 h-12 cursor-pointer hover:scale-105 transition-transform">
                    <AvatarImage src={friendship.friend.avatar_url || undefined} />
                    <AvatarFallback 
                      style={{
                        backgroundColor: `color-mix(in srgb, ${friendship.friend.color || userColor} 15%, transparent)`,
                        color: friendship.friend.color || userColor
                      }}
                    >
                      {friendship.friend.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                
                <div className="flex-1 min-w-0">
                  <Link 
                    href={`/perfil/${friendship.friend.public_id}`}
                    className="font-medium hover:underline truncate block"
                  >
                    {friendship.friend.username}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    {friendship.friend.role !== 'user' && (
                      <Badge variant="secondary" className="text-xs">
                        {friendship.friend.role === 'admin' ? 'Admin' : 'Mod'}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Amigos desde {new Date(friendship.created_at).toLocaleDateString('es-ES', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
                
                {showActions && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="gap-1"
                      style={{
                        borderColor: `color-mix(in srgb, var(--user-color) 30%, transparent)`,
                        color: `var(--user-color)`,
                        ...colorStyle
                      }}
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="hidden sm:inline">Chat</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-destructive hover:text-destructive"
                    >
                      <UserMinus className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
