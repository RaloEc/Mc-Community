import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/utils/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar que el usuario sea admin
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (perfil?.role !== 'admin') {
      return NextResponse.json(
        { error: 'No tienes permisos de administrador' },
        { status: 403 }
      );
    }

    // Obtener el tipo de estadística solicitado
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');
    const limite = parseInt(searchParams.get('limite') || '10');
    const dias = parseInt(searchParams.get('dias') || '30');

    let data, error;

    switch (tipo) {
      case 'generales':
        ({ data, error } = await supabase.rpc('get_estadisticas_generales_foro'));
        break;

      case 'hilos-populares':
        ({ data, error } = await supabase.rpc('get_hilos_populares', {
          limite,
          periodo_dias: dias,
        }));
        break;

      case 'categorias':
        ({ data, error } = await supabase.rpc('get_estadisticas_por_categoria'));
        break;

      case 'usuarios-activos':
        ({ data, error } = await supabase.rpc('get_usuarios_mas_activos_foro', {
          limite,
          offset_val: 0,
        }));
        break;

      case 'actividad-diaria':
        ({ data, error } = await supabase.rpc('get_actividad_diaria_foro', {
          dias,
        }));
        break;

      default:
        return NextResponse.json(
          { error: 'Tipo de estadística no válido' },
          { status: 400 }
        );
    }

    if (error) {
      console.error(`Error al obtener estadísticas (${tipo}):`, error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error en endpoint de estadísticas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
