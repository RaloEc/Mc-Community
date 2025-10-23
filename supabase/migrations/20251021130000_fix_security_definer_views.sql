-- Migración para eliminar SECURITY DEFINER de las vistas
-- Esto resuelve las alertas de seguridad relacionadas con vistas SECURITY DEFINER

-- 1. Recrear vista_solicitudes_servidores sin SECURITY DEFINER
DROP VIEW IF EXISTS public.vista_solicitudes_servidores;

CREATE VIEW public.vista_solicitudes_servidores AS
SELECT 
  s.id,
  s.usuario_id,
  s.nombre_servidor,
  s.descripcion_solicitud,
  s.ip_servidor,
  s.tipo_juego,
  s.version_preferida,
  s.url_discord,
  s.url_web,
  s.url_imagen_logo,
  s.estado,
  s.motivo_rechazo,
  s.created_at,
  COALESCE(p.username, 'Usuario anónimo'::character varying) AS username,
  p.avatar_url
FROM solicitudes_servidores s
LEFT JOIN perfiles p ON s.usuario_id = p.id;

-- 2. Recrear noticias_con_autor sin SECURITY DEFINER
DROP VIEW IF EXISTS public.noticias_con_autor;

CREATE VIEW public.noticias_con_autor AS
SELECT 
  n.id,
  n.titulo,
  n.contenido,
  n.imagen_portada,
  n.autor,
  n.fecha_publicacion,
  n.destacada,
  n.created_at,
  n.updated_at,
  n.autor_id,
  p.username AS autor_nombre,
  p.role AS autor_role
FROM noticias n
LEFT JOIN perfiles p ON n.autor_id = p.id;

-- 3. Recrear foro_posts_con_perfil sin SECURITY DEFINER
DROP VIEW IF EXISTS public.foro_posts_con_perfil;

CREATE VIEW public.foro_posts_con_perfil AS
SELECT 
  p.id,
  p.contenido,
  p.hilo_id,
  p.autor_id,
  p.es_solucion,
  p.created_at,
  p.updated_at,
  p.post_padre_id,
  p.editado,
  p.editado_en,
  p.historial_ediciones,
  perfiles.username,
  perfiles.avatar_url,
  perfiles.role,
  perfiles.color,
  perfiles.activo
FROM foro_posts p
LEFT JOIN perfiles ON p.autor_id = perfiles.id;

-- Comentario: Las vistas ahora usan SECURITY INVOKER por defecto,
-- lo que significa que se ejecutan con los permisos del usuario que las consulta,
-- no con los permisos del creador de la vista.
