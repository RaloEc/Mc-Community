import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export interface WeaponStats {
  dano: number;
  alcance: number;
  control: number;
  manejo: number;
  estabilidad: number;
  precision: number;
  perforacionBlindaje: number;
  cadenciaDisparo: number;
  capacidad: number;
  velocidadBoca: number;
  sonidoDisparo: number;
  nombreArma?: string;
  recordId?: string;
}

export interface WeaponStatsRecordResponse extends WeaponStats {
  recordId: string;
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignorar errores en Route Handlers
            }
          },
        },
      }
    );
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener la imagen del FormData
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Imagen requerida' },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no válido. Solo se permiten JPEG, PNG y WebP.' },
        { status: 400 }
      );
    }

    // Validar tamaño (5MB máximo)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande. Máximo 5MB.' },
        { status: 400 }
      );
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${user.id}/${timestamp}-${randomId}.${fileExtension}`;

    // Leer el archivo como ArrayBuffer
    const fileBuffer = await file.arrayBuffer();
    
    // Subir imagen a Supabase Storage
    console.log('Subiendo imagen a Supabase Storage...', {
      bucket: 'weapon-analysis-temp',
      fileName,
      size: file.size,
      type: file.type
    });
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('weapon-analysis-temp')
      .upload(fileName, fileBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
        duplex: 'half'
      });

    if (uploadError) {
      console.error('Error subiendo imagen:', JSON.stringify(uploadError, null, 2));
      console.error('Detalles del error:', {
        message: uploadError?.message,
        bucket: 'weapon-analysis-temp',
        fileName: fileName,
        userId: user.id
      });
      return NextResponse.json(
        { 
          error: 'Error al subir la imagen',
          details: uploadError?.message || 'Error desconocido'
        },
        { status: 500 }
      );
    }

    // Leer la imagen como ArrayBuffer
    console.log('Leyendo imagen como ArrayBuffer...');
    const imageBuffer = Buffer.from(await file.arrayBuffer());
    const imageBase64 = imageBuffer.toString('base64');
    
    // Llamar a la función de borde para análisis
    console.log('Invocando Edge Function con datos binarios...');
    
    const { data: analysisData, error: analysisError } = await supabase.functions
      .invoke('analyze-weapon-stats', {
        body: { 
          imageData: imageBase64,
          fileName: file.name,
          contentType: file.type
        }
      });

    console.log('Respuesta de Edge Function:', { analysisData, analysisError });

    if (analysisError) {
      console.error('Error en análisis:', JSON.stringify(analysisError, null, 2));
      
      // Limpiar imagen temporal
      await supabase.storage
        .from('weapon-analysis-temp')
        .remove([fileName]);
      
      let status = 500;
      let friendlyError = 'Error analizando la imagen';
      let code: string | undefined;

      const contextResponse = (analysisError as { context?: Response }).context;
      if (contextResponse) {
        try {
          const responseClone = contextResponse.clone ? contextResponse.clone() : contextResponse;
          status = responseClone.status || status;
          const payload = await responseClone.json().catch(() => null);
          if (payload) {
            friendlyError = payload.error || friendlyError;
            code = payload.code;
          }
        } catch (ctxError) {
          console.error('Error leyendo respuesta de Edge Function:', ctxError);
        }
      }

      return NextResponse.json(
        { 
          error: friendlyError,
          code: code ?? 'ANALYSIS_ERROR',
          details: analysisError?.message || 'Error desconocido'
        },
        { status }
      );
    }

    // Limpiar imagen temporal después del análisis
    await supabase.storage
      .from('weapon-analysis-temp')
      .remove([fileName]);

    // Validar respuesta del análisis
    if (!analysisData.success || !analysisData.data) {
      const friendlyError = analysisData.error || 'No se pudieron extraer las estadísticas de la imagen';
      const statusCode = analysisData.code === 'NOT_STATS' ? 422 : 422;
      return NextResponse.json(
        { error: friendlyError, code: analysisData.code ?? 'ANALYSIS_ERROR' },
        { status: statusCode }
      );
    }

    const weaponStats = analysisData.data as WeaponStats;

    // Guardar estadísticas en la nueva tabla
    const { data: weaponStatsRecord, error: recordError } = await supabase
      .from('weapon_stats_records')
      .insert({
        user_id: user.id,
        weapon_name: weaponStats.nombreArma ?? null,
        stats: weaponStats,
        source_image_path: fileName
      })
      .select('id')
      .single();

    if (recordError || !weaponStatsRecord) {
      console.error('Error guardando estadísticas del arma:', recordError);
      return NextResponse.json(
        {
          error: 'No se pudieron almacenar las estadísticas generadas',
          code: 'STATS_PERSISTENCE_FAILED'
        },
        { status: 500 }
      );
    }

    const weaponStatsWithId: WeaponStatsRecordResponse = {
      ...weaponStats,
      recordId: weaponStatsRecord.id
    };

    return NextResponse.json({
      success: true,
      data: weaponStatsWithId
    });

  } catch (error) {
    console.error('Error en API analyze-weapon:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
