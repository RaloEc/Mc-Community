-- Añadir campo categoria_padre_id a la tabla categorias
DO $$
BEGIN
  -- Verificar si la tabla existe
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'categorias'
  ) THEN
    -- Verificar si la columna ya existe
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'categorias' 
      AND column_name = 'categoria_padre_id'
    ) THEN
      -- Añadir la columna categoria_padre_id
      ALTER TABLE categorias 
      ADD COLUMN categoria_padre_id UUID REFERENCES categorias(id) ON DELETE SET NULL;
      
      -- Añadir índice para mejorar el rendimiento
      CREATE INDEX idx_categorias_categoria_padre_id ON categorias(categoria_padre_id);
      
      RAISE NOTICE 'Columna categoria_padre_id añadida a la tabla categorias';
    ELSE
      RAISE NOTICE 'La columna categoria_padre_id ya existe en la tabla categorias';
    END IF;
  ELSE
    -- Si la tabla no existe, verificar si existe categorias_noticias
    IF EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'categorias_noticias'
    ) THEN
      -- Verificar si la columna ya existe
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'categorias_noticias' 
        AND column_name = 'categoria_padre_id'
      ) THEN
        -- Añadir la columna categoria_padre_id
        ALTER TABLE categorias_noticias 
        ADD COLUMN categoria_padre_id UUID REFERENCES categorias_noticias(id) ON DELETE SET NULL;
        
        -- Añadir índice para mejorar el rendimiento
        CREATE INDEX idx_categorias_noticias_categoria_padre_id ON categorias_noticias(categoria_padre_id);
        
        RAISE NOTICE 'Columna categoria_padre_id añadida a la tabla categorias_noticias';
      ELSE
        RAISE NOTICE 'La columna categoria_padre_id ya existe en la tabla categorias_noticias';
      END IF;
    ELSE
      RAISE EXCEPTION 'No se encontró ninguna tabla de categorías (categorias o categorias_noticias)';
    END IF;
  END IF;
END
$$;
