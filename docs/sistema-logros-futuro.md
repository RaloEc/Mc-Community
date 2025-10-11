# Sistema de Logros y Progreso - Planificación Futura

## Estado Actual

Actualmente, la sección de "Progreso y Logros" en el perfil de usuario muestra un mensaje de "Próximamente". El código anterior calculaba logros de forma temporal basándose en las estadísticas del usuario, pero no hay persistencia en base de datos.

## Análisis de Base de Datos

### Tablas Existentes Relevantes

Actualmente **NO existen** tablas específicas para logros en la base de datos. Las tablas existentes que podrían ser útiles para calcular logros son:

1. **perfiles** - Información básica del usuario
   - `id` (uuid)
   - `username` (varchar)
   - `created_at` (timestamptz)
   - `role` (varchar)
   - etc.

2. **noticias** - Noticias publicadas por usuarios
   - `autor_id` (uuid) - FK a perfiles

3. **comentarios** - Comentarios en noticias
   - `usuario_id` (uuid) - FK a perfiles

4. **foro_hilos** - Hilos del foro
   - `autor_id` (uuid) - FK a auth.users

5. **foro_posts** - Respuestas en el foro
   - `autor_id` (uuid) - FK a auth.users

6. **foro_votos_posts** - Votos en posts del foro
   - `usuario_id` (uuid) - FK a auth.users
   - `valor_voto` (smallint) - -1 o 1

## Propuesta de Tablas para el Sistema de Logros

### 1. Tabla `logros` (Definición de logros disponibles)

```sql
CREATE TABLE logros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(100) UNIQUE NOT NULL, -- Ej: 'primer_post', 'comunicador', etc.
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  icono VARCHAR(100), -- Nombre del icono de lucide-react
  color VARCHAR(50), -- Color del logro (ej: 'text-yellow-500')
  categoria VARCHAR(50), -- Ej: 'participacion', 'creacion', 'social', etc.
  puntos INTEGER DEFAULT 0, -- Puntos que otorga el logro
  requisitos JSONB, -- Condiciones para obtener el logro
  orden INTEGER DEFAULT 0, -- Orden de visualización
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ejemplo de requisitos JSONB:
-- {
--   "tipo": "contador",
--   "metrica": "comentarios",
--   "valor": 10
-- }
```

### 2. Tabla `usuarios_logros` (Logros obtenidos por usuarios)

```sql
CREATE TABLE usuarios_logros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logro_id UUID NOT NULL REFERENCES logros(id) ON DELETE CASCADE,
  obtenido_en TIMESTAMPTZ DEFAULT NOW(),
  progreso JSONB, -- Información adicional sobre el progreso
  notificado BOOLEAN DEFAULT false, -- Si se notificó al usuario
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id, logro_id)
);

-- Índices
CREATE INDEX idx_usuarios_logros_usuario ON usuarios_logros(usuario_id);
CREATE INDEX idx_usuarios_logros_logro ON usuarios_logros(logro_id);
CREATE INDEX idx_usuarios_logros_obtenido ON usuarios_logros(obtenido_en);
```

### 3. Tabla `usuarios_estadisticas` (Cache de estadísticas del usuario)

```sql
CREATE TABLE usuarios_estadisticas (
  usuario_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_noticias INTEGER DEFAULT 0,
  total_comentarios INTEGER DEFAULT 0,
  total_hilos INTEGER DEFAULT 0,
  total_respuestas INTEGER DEFAULT 0,
  total_votos_recibidos INTEGER DEFAULT 0,
  total_votos_positivos INTEGER DEFAULT 0,
  total_votos_negativos INTEGER DEFAULT 0,
  puntos_totales INTEGER DEFAULT 0, -- Suma de puntos de todos los logros
  nivel INTEGER DEFAULT 1, -- Nivel del usuario basado en puntos
  ultima_actualizacion TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice
CREATE INDEX idx_usuarios_estadisticas_nivel ON usuarios_estadisticas(nivel);
CREATE INDEX idx_usuarios_estadisticas_puntos ON usuarios_estadisticas(puntos_totales);
```

### 4. Tabla `niveles` (Definición de niveles)

```sql
CREATE TABLE niveles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nivel INTEGER UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  puntos_requeridos INTEGER NOT NULL,
  color VARCHAR(50),
  icono VARCHAR(100),
  beneficios JSONB, -- Beneficios que otorga el nivel
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ejemplo de beneficios JSONB:
-- {
--   "badge_especial": true,
--   "color_nombre_personalizado": true,
--   "acceso_beta": true
-- }
```

## Funciones y Triggers Sugeridos

### 1. Función para actualizar estadísticas

```sql
CREATE OR REPLACE FUNCTION actualizar_estadisticas_usuario(p_usuario_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO usuarios_estadisticas (
    usuario_id,
    total_noticias,
    total_comentarios,
    total_hilos,
    total_respuestas,
    ultima_actualizacion
  )
  SELECT
    p_usuario_id,
    (SELECT COUNT(*) FROM noticias WHERE autor_id = p_usuario_id),
    (SELECT COUNT(*) FROM comentarios WHERE usuario_id = p_usuario_id),
    (SELECT COUNT(*) FROM foro_hilos WHERE autor_id = p_usuario_id),
    (SELECT COUNT(*) FROM foro_posts WHERE autor_id = p_usuario_id),
    NOW()
  ON CONFLICT (usuario_id) DO UPDATE SET
    total_noticias = EXCLUDED.total_noticias,
    total_comentarios = EXCLUDED.total_comentarios,
    total_hilos = EXCLUDED.total_hilos,
    total_respuestas = EXCLUDED.total_respuestas,
    ultima_actualizacion = NOW();
END;
$$ LANGUAGE plpgsql;
```

### 2. Función para verificar y otorgar logros

```sql
CREATE OR REPLACE FUNCTION verificar_logros_usuario(p_usuario_id UUID)
RETURNS void AS $$
DECLARE
  v_logro RECORD;
  v_estadisticas RECORD;
BEGIN
  -- Obtener estadísticas del usuario
  SELECT * INTO v_estadisticas
  FROM usuarios_estadisticas
  WHERE usuario_id = p_usuario_id;
  
  -- Si no existen estadísticas, crearlas
  IF NOT FOUND THEN
    PERFORM actualizar_estadisticas_usuario(p_usuario_id);
    SELECT * INTO v_estadisticas
    FROM usuarios_estadisticas
    WHERE usuario_id = p_usuario_id;
  END IF;
  
  -- Verificar cada logro activo
  FOR v_logro IN SELECT * FROM logros WHERE activo = true LOOP
    -- Aquí iría la lógica para verificar si cumple los requisitos
    -- y otorgar el logro si no lo tiene
    -- (Implementación específica según el tipo de requisito)
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

## Políticas RLS (Row Level Security)

```sql
-- Logros: Todos pueden leer
ALTER TABLE logros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Logros son públicos" ON logros FOR SELECT USING (true);

-- Usuarios_logros: Los usuarios pueden ver sus propios logros y los de otros
ALTER TABLE usuarios_logros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver logros propios y ajenos" ON usuarios_logros 
  FOR SELECT USING (true);

-- Usuarios_estadisticas: Los usuarios pueden ver sus propias estadísticas y las de otros
ALTER TABLE usuarios_estadisticas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver estadísticas propias y ajenas" ON usuarios_estadisticas 
  FOR SELECT USING (true);

-- Niveles: Todos pueden leer
ALTER TABLE niveles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Niveles son públicos" ON niveles FOR SELECT USING (true);
```

## Ejemplos de Logros Iniciales

```sql
-- Logros de participación
INSERT INTO logros (codigo, nombre, descripcion, icono, color, categoria, puntos, requisitos) VALUES
('primer_post', 'Primer Post', 'Publicó su primera contribución', 'Star', 'text-yellow-500', 'participacion', 10, '{"tipo": "contador", "metrica": "total_actividad", "valor": 1}'),
('comunicador', 'Comunicador', 'Realizó 10 comentarios', 'MessageCircle', 'text-blue-500', 'participacion', 25, '{"tipo": "contador", "metrica": "total_comentarios", "valor": 10}'),
('creador', 'Creador', 'Publicó 5 noticias', 'FileText', 'text-purple-500', 'creacion', 50, '{"tipo": "contador", "metrica": "total_noticias", "valor": 5}'),
('veterano', 'Veterano', 'Más de 50 contribuciones', 'Award', 'text-green-500', 'participacion', 100, '{"tipo": "contador", "metrica": "total_actividad", "valor": 50}'),
('popular', 'Popular', 'Recibió 100 votos positivos', 'ThumbsUp', 'text-pink-500', 'social', 75, '{"tipo": "contador", "metrica": "total_votos_positivos", "valor": 100}');

-- Niveles
INSERT INTO niveles (nivel, nombre, puntos_requeridos, color, icono) VALUES
(1, 'Novato', 0, 'text-gray-500', 'User'),
(2, 'Aprendiz', 50, 'text-blue-500', 'UserCheck'),
(3, 'Experimentado', 150, 'text-green-500', 'UserCog'),
(4, 'Experto', 300, 'text-purple-500', 'Award'),
(5, 'Maestro', 500, 'text-yellow-500', 'Crown'),
(6, 'Leyenda', 1000, 'text-red-500', 'Zap');
```

## Integración en el Frontend

### Hook personalizado para logros

```typescript
// src/hooks/useLogros.ts
export function useLogros(usuarioId: string) {
  const { data: logros, isLoading } = useQuery({
    queryKey: ['logros', usuarioId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('usuarios_logros')
        .select(`
          *,
          logro:logros(*)
        `)
        .eq('usuario_id', usuarioId);
      
      if (error) throw error;
      return data;
    }
  });
  
  return { logros, isLoading };
}
```

### Hook para estadísticas

```typescript
// src/hooks/useEstadisticas.ts
export function useEstadisticas(usuarioId: string) {
  const { data: estadisticas, isLoading } = useQuery({
    queryKey: ['estadisticas', usuarioId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('usuarios_estadisticas')
        .select('*')
        .eq('usuario_id', usuarioId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });
  
  return { estadisticas, isLoading };
}
```

## Notas de Implementación

1. **Actualización de estadísticas**: Se puede hacer mediante triggers en las tablas de noticias, comentarios, etc., o mediante un job programado que actualice las estadísticas periódicamente.

2. **Verificación de logros**: Se puede ejecutar después de cada acción del usuario (crear noticia, comentar, etc.) o mediante un job programado.

3. **Notificaciones**: Cuando un usuario obtiene un logro, se puede enviar una notificación en tiempo real usando Supabase Realtime.

4. **Gamificación**: Los puntos y niveles pueden usarse para desbloquear funcionalidades especiales o dar reconocimiento visual en la comunidad.

5. **Extensibilidad**: El sistema JSONB para requisitos permite crear logros complejos sin modificar la estructura de la base de datos.

## Próximos Pasos

1. Crear las migraciones de Supabase para las tablas propuestas
2. Implementar las funciones y triggers necesarios
3. Crear los hooks de React para consumir los datos
4. Actualizar el componente `membership-info.tsx` para mostrar los logros reales
5. Implementar el sistema de notificaciones para nuevos logros
6. Crear una página de administración para gestionar logros y niveles
