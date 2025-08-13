import { SupabaseClient, User } from '@supabase/supabase-js';

/**
 * Verifica si el usuario actual tiene el rol de 'admin'.
 * @param supabase - Instancia del cliente de Supabase.
 * @returns `true` si el usuario es administrador, `false` en caso contrario.
 */
export async function isAdmin(supabase: SupabaseClient): Promise<boolean> {
  try {
    // 1. Obtener el usuario actual de la sesión
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return false; // No hay usuario autenticado
    }

    // 2. Obtener el perfil del usuario para verificar su rol
    const { data: perfil, error } = await supabase
      .from('perfiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error al verificar el rol del usuario:', error);
      return false;
    }

    // 3. Comprobar si el rol es 'admin'
    return perfil?.role === 'admin';

  } catch (error) {
    console.error('Error inesperado en la función isAdmin:', error);
    return false;
  }
}
