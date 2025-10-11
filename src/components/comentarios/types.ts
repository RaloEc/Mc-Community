export interface Comment {
  id: string;
  author: string;
  authorId: string; // ID del usuario autor del comentario
  avatarUrl: string;
  timestamp: string; // Formato ISOString
  text: string;
  replies: Comment[];
  // Color opcional asociado al autor de este comentario (hex, rgb o nombre CSS)
  authorColor?: string;
  // Información sobre la edición del comentario
  isEdited?: boolean;
  editedAt?: string;
  // Información sobre borrado suave
  deleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  // Historial de ediciones (opcional)
  editHistory?: {
    original: string;
    versions: {
      contenido: string;
      fecha: string;
      version: number;
    }[];
  };
  // Información sobre el comentario al que se responde
  repliedTo?: {
    id: string;      // ID del comentario al que se responde
    author: string;  // Nombre del autor del comentario original
    text: string;    // Texto del comentario original
    // Color opcional del autor del comentario original
    color?: string;
    // Indica si el comentario original fue editado o eliminado
    isEdited?: boolean;
    isDeleted?: boolean;
  };
  // Funcionalidad específica del foro
  isSolution?: boolean; // Indica si este comentario está marcado como solución
  parentCommentId?: string; // ID del comentario padre (si es una respuesta anidada marcada como solución)
  // Sistema de votos
  votos_totales?: number; // Total de votos del comentario
}
