import { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { MessageSquare } from 'lucide-react';

interface Comentario {
  id: string;
  texto: string;
  created_at: string;
  usuario: {
    id: string;
    username: string;
    avatar_url: string | null;
    color: string | null;
  };
  respuestas?: Comentario[];
}

// Interfaz para el resultado de la consulta de Supabase
interface ComentarioRow {
  id: string;
  texto: string;
  created_at: string;
  usuario_id: string;
  perfiles: any; // Usar any temporalmente para evitar problemas de tipo
}

interface ComentariosNoticiaProps {
  noticiaId: string;
  className?: string;
}

export function ComentariosNoticia({ noticiaId, className = '' }: ComentariosNoticiaProps) {
  const supabase = useSupabaseClient();
  const { user, profile } = useAuth();
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  // Cargar comentarios
  useEffect(() => {
    const cargarComentarios = async () => {
      try {
        setCargando(true);
        
        // Obtener comentarios de la noticia
        const { data, error } = await supabase
          .from('comentarios')
          .select(`
            id,
            texto,
            created_at,
            usuario_id,
            perfiles:usuario_id (
              id,
              username,
              avatar_url,
              color
            )
          `)
          .eq('noticia_id', noticiaId)
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        // Formatear los comentarios
        const comentariosFormateados = data?.map((c: ComentarioRow) => {
          // Asegurarse de que perfiles sea un objeto
          const perfil = c.perfiles || { 
            id: c.usuario_id, 
            username: null, 
            avatar_url: null, 
            color: null 
          };
          
          return {
            id: c.id,
            texto: c.texto,
            created_at: c.created_at,
            usuario: {
              id: perfil.id || c.usuario_id,
              username: perfil.username || 'Usuario',
              avatar_url: perfil.avatar_url,
              color: perfil.color || '#3b82f6'
            }
          };
        }) || [];
        
        setComentarios(comentariosFormateados);
      } catch (error) {
        console.error('Error al cargar comentarios:', error);
      } finally {
        setCargando(false);
      }
    };
    
    if (noticiaId) {
      cargarComentarios();
    }
  }, [noticiaId, supabase]);
  
  // Enviar un nuevo comentario
  const enviarComentario = async () => {
    if (!user || !nuevoComentario.trim()) return;
    
    try {
      setEnviando(true);
      
      // Insertar el comentario
      const { data, error } = await supabase
        .from('comentarios')
        .insert({
          texto: nuevoComentario.trim(),
          usuario_id: user.id,
          noticia_id: noticiaId
        })
        .select('id')
        .single();
      
      if (error) throw error;
      
      // Relacionar el comentario con la noticia
      await supabase
        .from('noticias_comentarios')
        .insert({
          noticia_id: noticiaId,
          comentario_id: data.id
        });
      
      // Limpiar el campo y recargar comentarios
      setNuevoComentario('');
      
      // Añadir el nuevo comentario a la lista
      const nuevoComentarioObj: Comentario = {
        id: data.id,
        texto: nuevoComentario.trim(),
        created_at: new Date().toISOString(),
        usuario: {
          id: user.id,
          username: profile?.username || 'Usuario',
          avatar_url: profile?.avatar_url || null,
          color: profile?.color || '#3b82f6'
        }
      };
      
      setComentarios([...comentarios, nuevoComentarioObj]);
    } catch (error) {
      console.error('Error al enviar comentario:', error);
    } finally {
      setEnviando(false);
    }
  };
  
  return (
    <div className={`mt-8 ${className}`}>
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        Comentarios ({comentarios.length})
      </h3>
      
      {/* Formulario para nuevo comentario */}
      {user ? (
        <div className="mb-6">
          <Textarea
            placeholder="Escribe un comentario..."
            value={nuevoComentario}
            onChange={(e) => setNuevoComentario(e.target.value)}
            className="mb-2"
            rows={3}
          />
          <Button 
            onClick={enviarComentario} 
            disabled={enviando || !nuevoComentario.trim()}
          >
            {enviando ? 'Enviando...' : 'Enviar comentario'}
          </Button>
        </div>
      ) : (
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          Inicia sesión para dejar un comentario.
        </p>
      )}
      
      {/* Lista de comentarios */}
      <div className="space-y-4">
        {cargando ? (
          <p>Cargando comentarios...</p>
        ) : comentarios.length > 0 ? (
          comentarios.map((comentario) => (
            <div 
              key={comentario.id} 
              className="p-4 border rounded-lg dark:border-gray-700"
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  {comentario.usuario.avatar_url && (
                    <AvatarImage src={comentario.usuario.avatar_url} alt={comentario.usuario.username} />
                  )}
                  <AvatarFallback 
                    style={{ backgroundColor: comentario.usuario.color || '#3b82f6' }}
                    className="text-white"
                  >
                    {comentario.usuario.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">
                      {comentario.usuario.username}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(comentario.created_at), { 
                        addSuffix: true,
                        locale: es 
                      })}
                    </p>
                  </div>
                  <p className="mt-1 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {comentario.texto}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-600 dark:text-gray-400">
            No hay comentarios todavía. ¡Sé el primero en comentar!
          </p>
        )}
      </div>
    </div>
  );
}
