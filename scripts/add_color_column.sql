-- Agregar columna de color a la tabla perfiles
ALTER TABLE perfiles ADD COLUMN color VARCHAR(20) DEFAULT '#3b82f6';

-- Comentario para la columna
COMMENT ON COLUMN perfiles.color IS 'Color personalizado del usuario para mostrar su nombre';
