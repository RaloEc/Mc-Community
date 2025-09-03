import React, { useState, useEffect } from 'react';
import { Comment } from './types';
import { CommentCard } from './CommentCard';
import { CommentForm } from './CommentForm';
import { Card, CardHeader, CardContent } from './ui/Card';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface CommentSystemProps {
  contentType: string;
  contentId: string;
  pageSize?: number;
  order?: 'asc' | 'desc';
}

// Función para mapear comentarios de la API al tipo UI
const mapApiCommentToUI = (apiComment: any): Comment => {
  return {
    id: apiComment.id,
    author: apiComment.autor?.username || 'Usuario',
    authorId: apiComment.autor_id || apiComment.autor?.id || '',
    avatarUrl: apiComment.autor?.avatar_url || '',
    timestamp: apiComment.created_at,
    text: apiComment.text,
    authorColor: apiComment.autor?.color || '#3b82f6', // Usar color del perfil
    replies: apiComment.replies ? apiComment.replies.map(mapApiCommentToUI) : [],
    isEdited: apiComment.isEdited || apiComment.editado || false,
    editedAt: apiComment.editado_en || null,
    repliedTo: apiComment.repliedTo ? {
      id: apiComment.repliedTo.id,
      author: apiComment.repliedTo.author,
      text: apiComment.repliedTo.text,
      color: apiComment.repliedTo.color,
      isEdited: apiComment.repliedTo.isEdited || false,
      isDeleted: apiComment.repliedTo.isDeleted || false
    } : undefined
  };
};

export const CommentSystem: React.FC<CommentSystemProps> = ({ 
  contentType, 
  contentId, 
  pageSize = 20, 
  order = 'desc' 
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);

  // Verificar autenticación al cargar
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    checkAuth();
  }, []);

  // Cargar comentarios desde la API
  const loadComments = async (reset = false) => {
    try {
      // Validar que los parámetros necesarios estén presentes
      if (!contentType) {
        throw new Error('El tipo de contenido es requerido');
      }
      
      if (!contentId) {
        throw new Error('El ID de contenido es requerido');
      }
      
      setLoading(true);
      setError(null);
      
      const currentOffset = reset ? 0 : offset;
      console.log('Cargando comentarios con parámetros:', { 
        contentType, 
        contentId, 
        pageSize, 
        currentOffset, 
        order 
      });
      
      // Usar rutas relativas
      const url = `/api/comentarios?contentType=${encodeURIComponent(contentType)}&contentId=${encodeURIComponent(contentId)}&limite=${pageSize}&offset=${currentOffset}&orden=${order}`;
      console.log('[CommentSystem] Cargando comentarios desde:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error al cargar comentarios');
      }
      
      const mappedComments = data.comentarios.map(mapApiCommentToUI);
      
      if (reset) {
        setComments(mappedComments);
        setOffset(pageSize);
      } else {
        setComments(prev => [...prev, ...mappedComments]);
        setOffset(prev => prev + pageSize);
      }
      
      setTotal(data.total);
    } catch (err) {
      console.error('Error al cargar comentarios:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Cargar comentarios al montar el componente
  useEffect(() => {
    loadComments(true);
  }, [contentType, contentId, order]);

  // Función para encontrar un comentario recursivamente
  const findComment = (comments: Comment[], commentId: string): Comment | null => {
    for (const comment of comments) {
      if (comment.id === commentId) {
        return comment;
      }
      if (comment.replies && comment.replies.length > 0) {
        const found = findComment(comment.replies, commentId);
        if (found) {
          return found;
        }
      }
    }
    return null;
  };

  // Función para agregar una respuesta a un comentario específico
  const addReplyToComment = (comments: Comment[], parentId: string, newReply: Comment): Comment[] => {
    return comments.map(comment => {
      if (comment.id === parentId) {
        return {
          ...comment,
          replies: [...comment.replies, newReply],
        };
      }

      if (comment.replies && comment.replies.length > 0) {
        const updatedReplies = addReplyToComment(comment.replies, parentId, newReply);
        if (updatedReplies !== comment.replies) {
          return { ...comment, replies: updatedReplies };
        }
      }

      return comment;
    });
  };

  // Manejar la adición de un nuevo comentario principal
  const handleAddComment = async (text: string) => {
    if (!user) {
      setError('Debes iniciar sesión para comentar');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      // Usar rutas relativas
      console.log('[CommentSystem] Enviando comentario a:', '/api/comentarios');
      
      const response = await fetch('/api/comentarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          content_type: contentType,
          content_id: contentId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}`);
      }
      
      const newCommentData = await response.json();
      const newComment = mapApiCommentToUI(newCommentData);
      
      // Añadir al inicio si el orden es descendente, al final si es ascendente
      if (order === 'desc') {
        setComments(prevComments => [newComment, ...prevComments]);
      } else {
        setComments(prevComments => [...prevComments, newComment]);
      }
      
      setTotal(prev => prev + 1);
    } catch (err) {
      console.error('Error al crear comentario:', err);
      setError(err instanceof Error ? err.message : 'Error al crear comentario');
    } finally {
      setSubmitting(false);
    }
  };

  // Manejar la adición de una respuesta a un comentario
  const handleAddReply = async (parentId: string, text: string, repliedTo?: { id: string; author: string; text: string; color?: string }) => {
    if (!user) {
      setError('Debes iniciar sesión para responder');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      // Usar rutas relativas
      console.log('[CommentSystem] Enviando respuesta a:', '/api/comentarios/reply');
      
      const response = await fetch('/api/comentarios/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parent_id: parentId,
          text,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}`);
      }
      
      const newReplyData = await response.json();
      const newReply = mapApiCommentToUI(newReplyData);
      
      setComments(prevComments => addReplyToComment(prevComments, parentId, newReply));
      setTotal(prev => prev + 1);
    } catch (err) {
      console.error('Error al crear respuesta:', err);
      setError(err instanceof Error ? err.message : 'Error al crear respuesta');
    } finally {
      setSubmitting(false);
    }
  };

  // Manejar la edición de un comentario
  const handleEditComment = async (commentId: string, newText: string) => {
    if (!user) {
      setError('Debes iniciar sesión para editar un comentario');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      console.log('[CommentSystem] Editando comentario:', {
        commentId,
        newText: newText.substring(0, 20) + '...'
      });
      
      const response = await fetch('/api/comentarios/edit', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment_id: commentId,
          text: newText,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error al editar comentario');
      }
      
      // Actualizar el comentario en el estado
      setComments(prevComments => {
        return updateCommentInTree(prevComments, commentId, (comment) => ({
          ...comment,
          text: newText,
          isEdited: true,
          editedAt: new Date().toISOString()
        }));
      });
      
    } catch (err) {
      console.error('Error al editar comentario:', err);
      setError(err instanceof Error ? err.message : 'Error al editar comentario');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Manejar la eliminación de un comentario
  const handleDeleteComment = async (commentId: string) => {
    if (!user) {
      setError('Debes iniciar sesión para eliminar un comentario');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      console.log('[CommentSystem] Eliminando comentario:', { commentId });
      
      const response = await fetch(`/api/comentarios/delete?id=${commentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error al eliminar comentario');
      }
      
      // Eliminar el comentario del estado (siempre es borrado completo)
      setComments(prevComments => {
        return removeCommentFromTree(prevComments, commentId);
      });
      setTotal(prev => prev - 1);
      
    } catch (err) {
      console.error('Error al eliminar comentario:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar comentario');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Función para actualizar un comentario en el árbol
  const updateCommentInTree = (comments: Comment[], commentId: string, updateFn: (comment: Comment) => Comment): Comment[] => {
    return comments.map(comment => {
      if (comment.id === commentId) {
        return updateFn(comment);
      }
      
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentInTree(comment.replies, commentId, updateFn)
        };
      }
      
      return comment;
    });
  };
  
  // Función para eliminar un comentario del árbol
  const removeCommentFromTree = (comments: Comment[], commentId: string): Comment[] => {
    return comments.filter(comment => {
      if (comment.id === commentId) {
        return false;
      }
      
      if (comment.replies && comment.replies.length > 0) {
        comment.replies = removeCommentFromTree(comment.replies, commentId);
      }
      
      return true;
    });
  };

  // Manejar el clic en una respuesta citada
  const handleQuotedReplyClick = (commentId: string) => {
    const element = document.getElementById(`comment-${commentId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('highlight');
      setTimeout(() => {
        element.classList.remove('highlight');
      }, 1500);
    }
  };

  // Función para renderizar un hilo completo (comentario + todas sus respuestas) de forma plana
  const renderThread = (comment: Comment): React.ReactNode[] => {
    const thread: React.ReactNode[] = [];
    
    // Verificar si el usuario actual es el autor del comentario
    const isAuthor = user && user.id === comment.authorId;
    
    // Agregar el comentario principal
    thread.push(
      <CommentCard
        key={comment.id}
        comment={comment}
        onReply={handleAddReply}
        onQuotedReplyClick={handleQuotedReplyClick}
        onEdit={handleEditComment}
        onDelete={handleDeleteComment}
        isAuthor={isAuthor}
        currentUser={user}
      />
    );

    // Agregar todas las respuestas de forma plana (sin indentación)
    if (comment.replies && comment.replies.length > 0) {
      comment.replies.forEach(reply => {
        thread.push(...renderThread(reply));
      });
    }

    return thread;
  };

  // Mostrar más comentarios
  const handleLoadMore = () => {
    if (!loading && comments.length < total) {
      loadComments(false);
    }
  };

  if (loading && comments.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mr-3"></div>
              <span className="text-gray-600 dark:text-gray-400">Cargando comentarios...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardContent>
          {/* Mostrar errores */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-md">
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Formulario principal para añadir comentarios */}
          <div className="mb-6 mt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
              {total > 0 ? `Comentarios (${total})` : 'Escribe tu comentario'}
            </h3>
            
            {user ? (
              <CommentForm
                onSubmit={handleAddComment}
                placeholder="Escribe tu comentario..."
                ctaText="Comentar"
                isLoading={submitting}
              />
            ) : (
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  Debes iniciar sesión para comentar
                </p>
                <Button asChild variant="outline">
                  <Link href="/login">Iniciar sesión</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Lista de comentarios */}
          <div className="space-y-4">
            {comments.length === 0 && !loading ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No hay comentarios aún. ¡Sé el primero en comentar!
              </p>
            ) : (
              comments.map(comment => renderThread(comment))
            )}
            
            {/* Botón cargar más */}
            {comments.length < total && (
              <div className="text-center pt-4">
                <Button 
                  onClick={handleLoadMore}
                  variant="outline"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                      Cargando...
                    </>
                  ) : (
                    `Cargar más comentarios (${total - comments.length} restantes)`
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
