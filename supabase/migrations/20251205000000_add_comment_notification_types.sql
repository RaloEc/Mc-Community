-- Migración: Agregar nuevos tipos de notificación para comentarios
-- Fecha: 2025-12-05

-- Agregar nuevos valores al ENUM notification_type
-- Nota: PostgreSQL 9.1+ permite ALTER TYPE ... ADD VALUE

-- Agregar tipo para comentarios en noticias
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'news_comment';

-- Agregar tipo para comentarios en hilos del foro
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'thread_comment';

-- Agregar tipo para respuestas a comentarios
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'comment_reply';

-- Comentarios descriptivos
COMMENT ON TYPE public.notification_type IS 'Tipos de notificación: friend_request (solicitud de amistad), info (información general), news_comment (comentario en noticia), thread_comment (comentario en hilo), comment_reply (respuesta a comentario)';
