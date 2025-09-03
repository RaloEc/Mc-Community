import React, { useState } from 'react';
import type { Comment } from './types';
import { Avatar } from './ui/Avatar';
import { Button } from './ui/Button';
import { CommentForm } from './CommentForm';
import { useAuth } from '@/context/AuthContext';

interface CommentCardProps {
  comment: Comment;
  onReply: (commentId: string, text: string, repliedTo?: { id: string; author: string; text: string; color?: string }) => void;
  onQuotedReplyClick: (commentId: string) => void;
  onEdit?: (commentId: string, newText: string) => void;
  onDelete?: (commentId: string) => void;
  isAuthor?: boolean;
  currentUser?: any;
}

const ChevronDownIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m6 9 6 6 6-6"/>
  </svg>
);

// Icono de editar
const EditIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

// Icono de eliminar
const DeleteIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 6h18"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

export const CommentCard: React.FC<CommentCardProps> = ({ 
  comment, 
  onReply, 
  onQuotedReplyClick, 
  onEdit, 
  onDelete, 
  isAuthor: propIsAuthor, 
  currentUser 
}) => {
  const { user: authUser } = useAuth();
  const [isReplying, setIsReplying] = useState(false);
  const [isQuoteExpanded, setIsQuoteExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Usar el usuario proporcionado por props o el del contexto de autenticación
  const user = currentUser || authUser;
  
  // Verificar si el usuario actual es el autor del comentario
  // Usar la prop isAuthor si se proporciona, de lo contrario calcularla
  const isAuthor = propIsAuthor !== undefined ? propIsAuthor : (user && user.id === comment.authorId);

  const handleReplySubmit = (text: string) => {
    const repliedTo = {
      id: comment.id,
      author: comment.author,
      text: comment.text,
      color: comment.authorColor
    };
    console.log('[CommentCard] Enviando respuesta al comentario:', {
      commentId: comment.id,
      text: text.substring(0, 20) + '...',
      repliedTo
    });
    onReply(comment.id, text, repliedTo);
    setIsReplying(false);
  };
  
  // Manejar la edición de un comentario
  const handleEditSubmit = () => {
    if (onEdit && editText.trim() !== comment.text) {
      console.log('[CommentCard] Editando comentario:', {
        commentId: comment.id,
        newText: editText.substring(0, 20) + '...'
      });
      onEdit(comment.id, editText);
    }
    setIsEditing(false);
  };
  
  // Manejar la eliminación de un comentario
  const handleDelete = () => {
    if (onDelete) {
      console.log('[CommentCard] Eliminando comentario:', {
        commentId: comment.id
      });
      onDelete(comment.id);
    }
    setShowDeleteConfirm(false);
  };
  
  const formattedDate = new Date(comment.timestamp).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="mb-6">
      <div 
        id={`comment-${comment.id}`} 
        className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm overflow-hidden"
        aria-labelledby={`comment-author-${comment.id}`}
      >
        {/* Cabecera del comentario con autor y fecha */}
        <div className="bg-gray-50 dark:bg-gray-900 px-4 py-2 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar src={comment.avatarUrl} alt={comment.author} />
            <div>
              <p 
                id={`comment-author-${comment.id}`}
                className="font-semibold text-sm" 
                style={{ color: comment.authorColor || 'inherit' }}
              >
                {comment.author}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{formattedDate}</p>
            </div>
          </div>
        </div>
        
        {/* Contenido principal */}
        <div className="p-4">
          {/* Bloque de cita si es una respuesta */}
          {comment.repliedTo && (
            <div className="mb-4 rounded-md bg-gray-100 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 overflow-hidden">
              <button
                onClick={() => setIsQuoteExpanded(!isQuoteExpanded)}
                className="w-full flex justify-between items-center p-2 text-left hover:bg-gray-200 dark:hover:bg-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400"
                aria-expanded={isQuoteExpanded}
              >
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Respondiendo a <span 
                    className="font-semibold" 
                    style={{ color: comment.repliedTo.color || '#14b8a6' }}
                  >
                    {comment.repliedTo.author}
                  </span>
                  {comment.repliedTo.isEdited && (
                    <span className="ml-1 text-xs text-gray-500 dark:text-gray-400 italic">
                      (editado)
                    </span>
                  )}
                </span>
                <ChevronDownIcon className={`transform transition-transform duration-200 ${isQuoteExpanded ? 'rotate-180' : ''}`} />
              </button>
              <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isQuoteExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <div className="p-3 border-t border-gray-200 dark:border-gray-800">
                  {comment.repliedTo.isDeleted ? (
                    <p className="text-sm italic text-gray-500 dark:text-gray-400 mb-2">
                      Este comentario ha sido eliminado.
                    </p>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        {comment.repliedTo.text}
                      </p>
                      <button 
                        onClick={() => onQuotedReplyClick(comment.repliedTo!.id)}
                        className="text-xs font-semibold text-teal-600 dark:text-teal-500 hover:underline"
                      >
                        Ver original
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Formulario de edición */}
          {isEditing ? (
            <div className="mt-4">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-100"
                rows={4}
              />
              <div className="mt-2 flex gap-2">
                <Button
                  onClick={handleEditSubmit}
                  className="h-auto px-3 py-1 text-xs bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 transition-colors"
                >
                  Guardar
                </Button>
                <Button
                  onClick={() => {
                    setIsEditing(false);
                    setEditText(comment.text);
                  }}
                  className="h-auto px-3 py-1 text-xs bg-gray-500 text-white hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 transition-colors"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Texto del comentario */}
              {comment.deleted ? (
                <p className="text-gray-500 dark:text-gray-400 italic">
                  [Comentario eliminado]
                </p>
              ) : (
                <p className="text-gray-700 dark:text-gray-100">
                  {comment.text}
                  {comment.isEdited && (
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 italic">
                      (editado)
                    </span>
                  )}
                </p>
              )}
              
              {/* Confirmación de eliminación */}
              {showDeleteConfirm && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                    ¿Estás seguro de que quieres eliminar este comentario?
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleDelete}
                      className="h-auto px-3 py-1 text-xs bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 transition-colors"
                    >
                      Eliminar
                    </Button>
                    <Button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="h-auto px-3 py-1 text-xs bg-gray-500 text-white hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 transition-colors"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Botones de acción */}
              <div className="mt-4 flex items-center gap-2">
                <Button
                  onClick={() => setIsReplying(!isReplying)}
                  className="h-auto px-3 py-1 text-xs bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                >
                  {isReplying ? 'Cancelar' : 'Responder'}
                </Button>
                
                {isAuthor && onEdit && (
                  <Button
                    onClick={() => {
                      setIsEditing(true);
                      setEditText(comment.text);
                    }}
                    className="h-auto px-3 py-1 text-xs bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 transition-colors flex items-center gap-1"
                  >
                    <EditIcon className="w-3 h-3" /> Editar
                  </Button>
                )}
                
                {isAuthor && onDelete && (
                  <Button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="h-auto px-3 py-1 text-xs bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 transition-colors flex items-center gap-1"
                  >
                    <DeleteIcon className="w-3 h-3" /> Eliminar
                  </Button>
                )}
              </div>
            </>
          )}
          
          {/* Formulario de respuesta */}
          <div 
            className={`overflow-hidden transition-all duration-300 ease-in-out ${isReplying ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
          >
            <div className="mt-4 border-t border-gray-200 dark:border-gray-800 pt-4">
              <CommentForm
                onSubmit={handleReplySubmit}
                placeholder={`Respondiendo a ${comment.author}...`}
                ctaText="Publicar"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
