'use client'

import React, { useState, useCallback, useEffect } from 'react'
import type { Comentario } from '@/types'
import type { Comment } from './comentarios/types'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CommentForm } from './comentarios/CommentForm'
import { CommentCard } from './comentarios/CommentCard'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import './comentarios/CommentCard.css'

interface ComentariosProps {
  contentType: 'noticia' | 'hilo'
  contentId: string
}

export default function ComentariosNuevo({ contentType, contentId }: ComentariosProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comentario[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [replyLoading, setReplyLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Mapea un comentario del tipo API/Dominio (Comentario) al tipo de UI (Comment)
  const mapComentarioToUI = useCallback((c: Comentario): Comment => {
    const isEdited = c.updated_at && c.updated_at !== c.created_at;
    return {
      id: c.id,
      author: c.autor?.username || 'Usuario',
      authorId: c.author_id,
      avatarUrl: c.autor?.avatar_url || '',
      timestamp: c.created_at,
      text: c.text,
      replies: (c.replies || []).map((r: Comentario) => mapComentarioToUI(r)),
      authorColor: c.autor?.color || undefined,
      isEdited: Boolean(isEdited),
      editedAt: c.updated_at,
      repliedTo: c.repliedTo
        ? {
            id: c.repliedTo.id,
            author: c.repliedTo.author,
            text: c.repliedTo.text,
          }
        : undefined,
    }
  }, [])

  // Función recursiva para agregar respuestas
  const addReplyToComment = useCallback((comments: Comentario[], parentId: string, newReply: Comentario): Comentario[] => {
    return comments.map(comment => {
      if (comment.id === parentId) {
        return {
          ...comment,
          replies: [...comment.replies, newReply],
        }
      }
      if (comment.replies.length > 0) {
        return {
          ...comment,
          replies: addReplyToComment(comment.replies, parentId, newReply),
        }
      }
      return comment
    })
  }, [])

  // Cargar comentarios
  const loadComments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/comentarios?contentType=${contentType}&contentId=${contentId}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar comentarios')
      }
      
      const data = await response.json()
      setComments(data.comentarios || [])
    } catch (err) {
      console.error('Error cargando comentarios:', err)
      setError('Error al cargar los comentarios')
    } finally {
      setLoading(false)
    }
  }, [contentType, contentId])

  // Agregar comentario principal
  const handleAddComment = async (text: string) => {
    if (!user) return
    
    try {
      setSubmitting(true)
      setError(null)
      
      const response = await fetch('/api/comentarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content_type: contentType,
          content_id: contentId,
          text,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Error al enviar comentario')
      }
      
      const newComment = await response.json()
      setComments(prevComments => [newComment, ...prevComments])
    } catch (err) {
      console.error('Error enviando comentario:', err)
      setError('Error al enviar el comentario')
    } finally {
      setSubmitting(false)
    }
  }

  // Agregar respuesta
  const handleAddReply = async (parentId: string, text: string): Promise<boolean> => {
    if (!user) return false
    
    try {
      setReplyLoading(true)
      setError(null)
      
      const response = await fetch('/api/comentarios/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parent_id: parentId,
          text,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Error al enviar respuesta')
      }
      
      const newReply = await response.json()
      setComments(prevComments => addReplyToComment(prevComments, parentId, newReply))
      return true
    } catch (err) {
      console.error('Error enviando respuesta:', err)
      setError('Error al enviar la respuesta')
      return false
    } finally {
      setReplyLoading(false)
    }
  }

  // Buscar un comentario por ID en el árbol de comentarios
  const findComment = (comments: Comentario[], commentId: string): Comentario | null => {
    for (const comment of comments) {
      if (comment.id === commentId) {
        return comment;
      }
      if (comment.replies.length > 0) {
        const found = findComment(comment.replies, commentId);
        if (found) {
          return found;
        }
      }
    }
    return null;
  };

  // Manejar clic en respuesta citada
  const handleQuotedReplyClick = (commentId: string) => {
    const element = document.getElementById(`comment-${commentId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('highlight');
      setTimeout(() => {
        element.classList.remove('highlight');
      }, 1500); // Duración de la animación
    }
  };

  // Renderizar hilo de comentarios con estructura anidada
  const renderThread = (comment: Comentario) => {
    const uiComment = mapComentarioToUI(comment)
    return (
      <div key={comment.id} id={`comment-${comment.id}`} className="comment-container">
        <CommentCard 
          key={comment.id} 
          comment={uiComment} 
          onReply={handleAddReply}
          onQuotedReplyClick={handleQuotedReplyClick}
        />
      </div>
    );
  };

  // Cargar comentarios al montar
  useEffect(() => {
    loadComments()
  }, [loadComments])

  if (loading) {
    return (
      <Card className="dark:data-[theme=amoled]:bg-black">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Comentarios</h2>
      
      {/* Formulario para crear un nuevo comentario */}
      <div className="bg-white dark:bg-gray-800 dark:data-[theme=amoled]:bg-black p-4 rounded-lg shadow mb-6">
        <CommentForm 
          onSubmit={handleAddComment}
          isLoading={submitting}
          placeholder="Escribe un comentario..."
          ctaText="Comentar"
        />
      </div>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadComments}
            className="mt-2"
          >
            Reintentar
          </Button>
        </div>
      )}
      
      {!user ? (
        <div className="bg-gray-50 dark:bg-gray-800 dark:data-[theme=amoled]:bg-gray-900 rounded-lg p-4 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Inicia sesión para participar en la conversación
          </p>
          <Button variant="outline" size="sm" asChild>
            <a href="/login">Iniciar sesión</a>
          </Button>
        </div>
      ) : (
        <div className="whatsapp-chat-container">
          {comments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                Sé el primero en comentar
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => renderThread(comment))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
