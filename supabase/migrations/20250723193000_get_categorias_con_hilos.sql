CREATE OR REPLACE FUNCTION get_categorias_con_hilos()
RETURNS TABLE(
  id uuid,
  nombre character varying,
  descripcion text,
  hilos json
)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.nombre,
    c.descripcion,
    COALESCE((SELECT json_agg(hilos_agg) FROM (
      SELECT
        h.id,
        h.titulo,
        h.created_at,
        h.categoria_id,
        (SELECT COUNT(*) FROM foro_comentarios fc WHERE fc.hilo_id = h.id) as comentarios_count,
        json_build_object(
          'id', p.id,
          'username', p.username,
          'rol', p.rol
        ) as perfiles
      FROM foro_hilos h
      LEFT JOIN perfiles p ON h.autor_id = p.id
      WHERE h.categoria_id = c.id
      ORDER BY h.created_at DESC
      LIMIT 5
    ) as hilos_agg), '[]'::json) as hilos
  FROM foro_categorias c
  ORDER BY c.nombre;
END;
$$ LANGUAGE plpgsql;
