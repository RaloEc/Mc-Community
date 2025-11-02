import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { processEditorContent } from '@/components/tiptap-editor/processImages';

// Función para generar un slug a partir de un título
function createSlug(title: string): string {
  const now = new Date();
  const datePart = now.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
  const timePart = now.toTimeString().split(' ')[0].replace(/:/g, ''); // HHMMSS
  const randomPart = Math.random().toString(36).substring(2, 8);

  return title
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-') // Reemplaza espacios y guiones bajos por guiones
    .replace(/[^a-z0-9-]/g, '') // Elimina caracteres no alfanuméricos excepto guiones
    .replace(/--+/g, '-') // Reemplaza múltiples guiones por uno solo
    .replace(/^-+|-+$/g, '') // Elimina guiones al principio y al final
    .substring(0, 75) + `-${datePart}${timePart}-${randomPart}`;
}

export async function POST(request: Request) {
  const { titulo, contenido, categoria_id, weapon_stats_id } = await request.json();

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ message: 'No autenticado.' }, { status: 401 });
  }

  if (!titulo || !contenido || !categoria_id) {
    return NextResponse.json({ message: 'Todos los campos son requeridos.' }, { status: 400 });
  }

  // Procesar imágenes temporales antes de guardar
  let contenidoProcesado = contenido;
  try {
    console.log('Procesando imágenes temporales en el contenido del hilo...');
    contenidoProcesado = await processEditorContent(contenido);
    console.log('Imágenes procesadas correctamente');
  } catch (error) {
    console.error('Error al procesar imágenes:', error);
    // Continuar con el contenido original si falla el procesamiento
  }

  const slug = createSlug(titulo);

  // El `categoria_id` recibido del formulario es el UUID correcto para la inserción.
  const { data, error } = await supabase
    .from('foro_hilos')
    .insert({
      titulo,
      contenido: contenidoProcesado,
      categoria_id,
      autor_id: session.user.id,
      slug,
      weapon_stats_id: weapon_stats_id ?? null,
    })
    .select('id, slug') // Solo seleccionamos lo necesario para la redirección
    .single();

  if (error) {
    console.error('Error al crear el hilo:', error);
    return NextResponse.json({ message: 'Error en el servidor al crear el hilo.', error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
