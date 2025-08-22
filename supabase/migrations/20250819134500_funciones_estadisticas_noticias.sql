-- Función para obtener noticias por mes
CREATE OR REPLACE FUNCTION obtener_noticias_por_mes()
RETURNS TABLE (
  mes TEXT,
  cantidad BIGINT
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(fecha_publicacion, 'YYYY-MM') AS mes,
    COUNT(*) AS cantidad
  FROM 
    noticias
  WHERE 
    fecha_publicacion <= CURRENT_DATE
  GROUP BY 
    TO_CHAR(fecha_publicacion, 'YYYY-MM')
  ORDER BY 
    mes DESC
  LIMIT 12;
END;
$$;

-- Función para obtener noticias por categoría
CREATE OR REPLACE FUNCTION obtener_noticias_por_categoria()
RETURNS TABLE (
  categoria_id UUID,
  categoria_nombre TEXT,
  categoria_color TEXT,
  cantidad BIGINT
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS categoria_id,
    c.nombre AS categoria_nombre,
    c.color AS categoria_color,
    COUNT(n.id) AS cantidad
  FROM 
    categorias_noticias c
  LEFT JOIN 
    noticias n ON c.id = n.categoria_id
  GROUP BY 
    c.id, c.nombre, c.color
  ORDER BY 
    cantidad DESC;
END;
$$;

-- Función para obtener noticias por autor
CREATE OR REPLACE FUNCTION obtener_noticias_por_autor()
RETURNS TABLE (
  autor_id UUID,
  autor_nombre TEXT,
  autor_color TEXT,
  cantidad BIGINT
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS autor_id,
    p.username AS autor_nombre,
    CASE 
      WHEN p.rol = 'admin' THEN '#ef4444'
      WHEN p.rol = 'moderator' THEN '#f59e0b'
      ELSE '#3b82f6'
    END AS autor_color,
    COUNT(n.id) AS cantidad
  FROM 
    perfiles p
  INNER JOIN 
    noticias n ON p.id = n.autor_id
  GROUP BY 
    p.id, p.username, p.rol
  ORDER BY 
    cantidad DESC
  LIMIT 10;
END;
$$;

-- Función para obtener estadísticas generales de noticias
CREATE OR REPLACE FUNCTION obtener_estadisticas_noticias()
RETURNS TABLE (
  total_noticias BIGINT,
  total_vistas BIGINT,
  total_categorias BIGINT,
  total_autores BIGINT,
  noticias_recientes BIGINT,
  noticias_pendientes BIGINT
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM noticias) AS total_noticias,
    (SELECT COALESCE(SUM(vistas), 0) FROM noticias) AS total_vistas,
    (SELECT COUNT(*) FROM categorias_noticias) AS total_categorias,
    (SELECT COUNT(DISTINCT autor_id) FROM noticias WHERE autor_id IS NOT NULL) AS total_autores,
    (SELECT COUNT(*) FROM noticias WHERE fecha_publicacion >= CURRENT_DATE - INTERVAL '30 days' AND fecha_publicacion <= CURRENT_DATE) AS noticias_recientes,
    (SELECT COUNT(*) FROM noticias WHERE fecha_publicacion > CURRENT_DATE) AS noticias_pendientes;
END;
$$;

-- Crear índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_noticias_fecha_publicacion ON noticias(fecha_publicacion);
CREATE INDEX IF NOT EXISTS idx_noticias_categoria_id ON noticias(categoria_id);
CREATE INDEX IF NOT EXISTS idx_noticias_autor_id ON noticias(autor_id);
CREATE INDEX IF NOT EXISTS idx_noticias_vistas ON noticias(vistas);

-- Asegurar que la tabla categorias_noticias existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'categorias_noticias'
  ) THEN
    CREATE TABLE categorias_noticias (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      nombre TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      descripcion TEXT,
      orden INTEGER DEFAULT 0,
      color TEXT DEFAULT '#3b82f6',
      es_activa BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Añadir restricción de clave foránea en la tabla noticias si existe
    IF EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'noticias'
    ) THEN
      -- Verificar si la columna categoria_id ya existe
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'noticias' 
        AND column_name = 'categoria_id'
      ) THEN
        ALTER TABLE noticias ADD COLUMN categoria_id UUID REFERENCES categorias_noticias(id);
      ELSE
        -- Si existe pero no tiene la restricción de clave foránea, añadirla
        BEGIN
          ALTER TABLE noticias 
          ADD CONSTRAINT noticias_categoria_id_fkey 
          FOREIGN KEY (categoria_id) 
          REFERENCES categorias_noticias(id);
        EXCEPTION
          WHEN duplicate_object THEN
            NULL; -- La restricción ya existe, no hacer nada
        END;
      END IF;
    END IF;
  END IF;
END
$$;
