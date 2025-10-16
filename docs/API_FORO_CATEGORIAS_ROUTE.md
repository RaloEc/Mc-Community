# API Route Handler: Gestión de Categorías del Foro

## 📍 Endpoint

`/api/admin/foro/categorias`

## 🔧 Métodos HTTP Implementados

- `GET` - Obtener todas las categorías
- `POST` - Crear una nueva categoría (requiere autenticación admin)
- `PUT` - Actualizar una categoría existente (requiere autenticación admin)
- `DELETE` - Eliminar una categoría (requiere autenticación admin)

---

## 📝 POST - Crear Nueva Categoría

### Descripción

Crea una nueva categoría en el foro con validación completa de datos y verificación de permisos de administrador.

### Autenticación

✅ **Requerida** - Usuario autenticado con rol `admin`

### Request

#### Headers
```
Content-Type: application/json
Cookie: sb-access-token=... (automático)
```

#### Body (JSON)

```typescript
{
  nombre: string,        // Requerido, min 1 carácter
  slug: string,          // Requerido, min 1 carácter
  descripcion?: string,  // Opcional, default: ""
  orden?: number,        // Opcional, default: 0, min: 0
  icono?: string | null, // Opcional, emoji
  parent_id?: string | null, // Opcional, UUID de categoría padre
  nivel?: number,        // Opcional, default: 1, min: 1, max: 3
  color?: string,        // Opcional, default: "#3b82f6", formato: #RRGGBB
  es_activa?: boolean    // Opcional, default: true
}
```

#### Ejemplo de Request

```json
{
  "nombre": "Discusión General",
  "slug": "discusion-general",
  "descripcion": "Habla sobre cualquier tema relacionado con Minecraft",
  "orden": 1,
  "icono": "💬",
  "parent_id": null,
  "nivel": 1,
  "color": "#3b82f6",
  "es_activa": true
}
```

### Response

#### ✅ Éxito (201 Created)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "nombre": "Discusión General",
  "slug": "discusion-general",
  "descripcion": "Habla sobre cualquier tema relacionado con Minecraft",
  "orden": 1,
  "icono": "💬",
  "parent_id": null,
  "nivel": 1,
  "color": "#3b82f6",
  "es_activa": true,
  "created_at": "2025-10-15T23:30:00.000Z",
  "updated_at": "2025-10-15T23:30:00.000Z"
}
```

#### ❌ Errores Posibles

**401 Unauthorized - No autenticado**
```json
{
  "error": "No autenticado. Debes iniciar sesión."
}
```

**403 Forbidden - Sin permisos de admin**
```json
{
  "error": "No autorizado. Se requieren permisos de administrador."
}
```

**400 Bad Request - JSON inválido**
```json
{
  "error": "Cuerpo de la petición inválido. Debe ser JSON válido."
}
```

**400 Bad Request - Validación fallida**
```json
{
  "error": "Datos de validación inválidos",
  "detalles": [
    {
      "campo": "nombre",
      "mensaje": "El nombre no puede estar vacío"
    },
    {
      "campo": "slug",
      "mensaje": "El slug no puede estar vacío"
    }
  ]
}
```

**400 Bad Request - Categoría padre no existe**
```json
{
  "error": "La categoría padre especificada no existe."
}
```

**409 Conflict - Slug duplicado**
```json
{
  "error": "El slug ya existe. Por favor, elige uno único."
}
```

**500 Internal Server Error**
```json
{
  "error": "Error interno del servidor al crear la categoría."
}
```

---

## 🔄 PUT - Actualizar Categoría

### Descripción

Actualiza una categoría existente. Permite actualizaciones parciales.

### Autenticación

✅ **Requerida** - Usuario autenticado con rol `admin`

### Request

#### URL Parameters
```
?id=550e8400-e29b-41d4-a716-446655440000
```

#### Body (JSON) - Todos los campos son opcionales

```typescript
{
  nombre?: string,
  slug?: string,
  descripcion?: string,
  orden?: number,
  icono?: string | null,
  parent_id?: string | null,
  nivel?: number,
  color?: string,
  es_activa?: boolean
}
```

#### Ejemplo de Request

```json
{
  "nombre": "Discusión General Actualizada",
  "es_activa": false
}
```

### Response

#### ✅ Éxito (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "nombre": "Discusión General Actualizada",
  "slug": "discusion-general",
  "descripcion": "Habla sobre cualquier tema relacionado con Minecraft",
  "orden": 1,
  "icono": "💬",
  "parent_id": null,
  "nivel": 1,
  "color": "#3b82f6",
  "es_activa": false,
  "created_at": "2025-10-15T23:30:00.000Z",
  "updated_at": "2025-10-15T23:45:00.000Z"
}
```

#### ❌ Errores Adicionales

**400 Bad Request - ID faltante**
```json
{
  "error": "El ID de la categoría es obligatorio."
}
```

**404 Not Found - Categoría no encontrada**
```json
{
  "error": "No se encontró la categoría para actualizar."
}
```

---

## 🗑️ DELETE - Eliminar Categoría

### Descripción

Elimina una categoría del foro. No se puede eliminar si tiene hilos asociados.

### Autenticación

✅ **Requerida** - Usuario autenticado con rol `admin`

### Request

#### URL Parameters
```
?id=550e8400-e29b-41d4-a716-446655440000
```

### Response

#### ✅ Éxito (200 OK)

```json
{
  "message": "Categoría eliminada correctamente"
}
```

#### ❌ Errores Adicionales

**409 Conflict - Tiene hilos asociados**
```json
{
  "error": "No se puede eliminar la categoría porque tiene hilos asociados."
}
```

---

## 📋 GET - Obtener Todas las Categorías

### Descripción

Obtiene todas las categorías del foro con conteo de hilos.

### Autenticación

❌ **No requerida** - Endpoint público

### Response

#### ✅ Éxito (200 OK)

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nombre": "Discusión General",
    "slug": "discusion-general",
    "descripcion": "Habla sobre cualquier tema",
    "orden": 1,
    "icono": "💬",
    "parent_id": null,
    "nivel": 1,
    "color": "#3b82f6",
    "es_activa": true,
    "hilos_count": 25,
    "hilos_total": 45,
    "created_at": "2025-10-15T23:30:00.000Z",
    "updated_at": "2025-10-15T23:30:00.000Z"
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "nombre": "Preguntas Frecuentes",
    "slug": "preguntas-frecuentes",
    "descripcion": "Subcategoría de preguntas",
    "orden": 0,
    "icono": "❓",
    "parent_id": "550e8400-e29b-41d4-a716-446655440000",
    "nivel": 2,
    "color": "#10b981",
    "es_activa": true,
    "hilos_count": 20,
    "hilos_total": 20,
    "created_at": "2025-10-15T23:35:00.000Z",
    "updated_at": "2025-10-15T23:35:00.000Z"
  }
]
```

---

## 🔒 Esquema de Validación Zod

```typescript
const categoriaSchema = z.object({
  nombre: z.string().min(1, 'El nombre no puede estar vacío').trim(),
  slug: z.string().min(1, 'El slug no puede estar vacío').trim(),
  descripcion: z.string().optional().default(''),
  orden: z.number().int().min(0).optional().default(0),
  icono: z.string().nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  nivel: z.number().int().min(1).max(3).optional().default(1),
  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color debe ser un código hexadecimal válido')
    .optional()
    .default('#3b82f6'),
  es_activa: z.boolean().optional().default(true),
});
```

### Reglas de Validación

| Campo | Tipo | Requerido | Validación | Default |
|-------|------|-----------|------------|---------|
| `nombre` | string | ✅ Sí | Min 1 carácter, trimmed | - |
| `slug` | string | ✅ Sí | Min 1 carácter, trimmed | - |
| `descripcion` | string | ❌ No | - | `""` |
| `orden` | number | ❌ No | Entero >= 0 | `0` |
| `icono` | string\|null | ❌ No | - | `null` |
| `parent_id` | string\|null | ❌ No | UUID válido | `null` |
| `nivel` | number | ❌ No | Entero 1-3 | `1` |
| `color` | string | ❌ No | Hex #RRGGBB | `"#3b82f6"` |
| `es_activa` | boolean | ❌ No | - | `true` |

---

## 🔐 Flujo de Autenticación y Autorización

### Paso 1: Verificar Autenticación

```typescript
const clienteAuth = await createClient();
const { data: { user }, error: authError } = await clienteAuth.auth.getUser();

if (authError || !user) {
  return NextResponse.json(
    { error: 'No autenticado. Debes iniciar sesión.' },
    { status: 401 }
  );
}
```

### Paso 2: Verificar Rol de Administrador

```typescript
async function esAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return perfil?.role === 'admin';
}

const admin = await esAdmin(clienteAuth);
if (!admin) {
  return NextResponse.json(
    { error: 'No autorizado. Se requieren permisos de administrador.' },
    { status: 403 }
  );
}
```

---

## 🧪 Ejemplos de Uso

### Ejemplo 1: Crear Categoría Principal

```javascript
const response = await fetch('/api/admin/foro/categorias', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    nombre: 'Tutoriales',
    slug: 'tutoriales',
    descripcion: 'Guías y tutoriales para Minecraft',
    icono: '📚',
    color: '#8b5cf6',
    orden: 0
  })
});

const data = await response.json();
console.log(data);
```

### Ejemplo 2: Crear Subcategoría

```javascript
const response = await fetch('/api/admin/foro/categorias', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    nombre: 'Construcciones',
    slug: 'construcciones',
    descripcion: 'Tutoriales de construcción',
    parent_id: '550e8400-e29b-41d4-a716-446655440000', // ID de "Tutoriales"
    nivel: 2,
    icono: '🏗️',
    color: '#f59e0b'
  })
});

const data = await response.json();
```

### Ejemplo 3: Actualizar Categoría

```javascript
const categoriaId = '550e8400-e29b-41d4-a716-446655440000';

const response = await fetch(`/api/admin/foro/categorias?id=${categoriaId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    nombre: 'Tutoriales Avanzados',
    es_activa: true
  })
});

const data = await response.json();
```

### Ejemplo 4: Eliminar Categoría

```javascript
const categoriaId = '550e8400-e29b-41d4-a716-446655440000';

const response = await fetch(`/api/admin/foro/categorias?id=${categoriaId}`, {
  method: 'DELETE'
});

const data = await response.json();
```

### Ejemplo 5: Obtener Todas las Categorías

```javascript
const response = await fetch('/api/admin/foro/categorias');
const categorias = await response.json();

console.log(`Total de categorías: ${categorias.length}`);
```

---

## 🛡️ Manejo de Errores de Base de Datos

| Código PostgreSQL | Descripción | HTTP Status | Mensaje |
|-------------------|-------------|-------------|---------|
| `23505` | unique_violation | 409 | El slug ya existe |
| `23503` | foreign_key_violation | 400/409 | Categoría padre no existe / Tiene hilos asociados |
| `PGRST116` | No rows returned | 404 | Categoría no encontrada |

---

## 📊 Estructura de la Tabla `foro_categorias`

```sql
CREATE TABLE foro_categorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  descripcion TEXT,
  orden INTEGER DEFAULT 0,
  icono VARCHAR(10),
  parent_id UUID REFERENCES foro_categorias(id) ON DELETE CASCADE,
  nivel INTEGER DEFAULT 1 CHECK (nivel BETWEEN 1 AND 3),
  color VARCHAR(7) DEFAULT '#3b82f6',
  es_activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🔍 Testing

### Test 1: Crear categoría sin autenticación

```bash
curl -X POST http://localhost:3000/api/admin/foro/categorias \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test","slug":"test"}'

# Esperado: 401 Unauthorized
```

### Test 2: Crear categoría con datos inválidos

```bash
curl -X POST http://localhost:3000/api/admin/foro/categorias \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{"nombre":"","slug":""}'

# Esperado: 400 Bad Request con detalles de validación
```

### Test 3: Crear categoría válida

```bash
curl -X POST http://localhost:3000/api/admin/foro/categorias \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{
    "nombre":"Categoría de Prueba",
    "slug":"categoria-prueba",
    "descripcion":"Descripción de prueba",
    "icono":"🧪"
  }'

# Esperado: 201 Created con datos de la categoría
```

---

## 📚 Referencias

- [Next.js 14 Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Zod Documentation](https://zod.dev/)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
