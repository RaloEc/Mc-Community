// Supabase Edge Function para analizar estadísticas de armas con Gemini AI

import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.2.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Inicializar el cliente de Google Gemini
const apiKey = Deno.env.get('GEMINI_API_KEY');
console.log('GEMINI_API_KEY configurada:', !!apiKey);

if (!apiKey) {
  console.error('ERROR: GEMINI_API_KEY no está configurada');
}

const genAI = new GoogleGenerativeAI(apiKey || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// Tipos de datos
type WeaponStats = {
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
};

class AnalysisError extends Error {
  friendlyMessage: string;
  code: string;

  constructor(friendlyMessage: string, code = 'ANALYSIS_ERROR', technicalMessage?: string) {
    super(technicalMessage ?? friendlyMessage);
    this.name = 'AnalysisError';
    this.friendlyMessage = friendlyMessage;
    this.code = code;
  }
}

// Función para analizar la imagen con Gemini
async function analyzeWeaponImage(imageData: string, mimeType: string): Promise<WeaponStats> {
  try {
    console.log('Iniciando análisis de imagen con Gemini...');
    
    const prompt = `Analiza esta imagen. Devuelve exclusivamente un objeto JSON válido y nada más.

Si la imagen muestra claramente estadísticas de un arma, responde exactamente en el siguiente formato (sin comentarios):
{
  "tipo": "stats",
  "datos": {
    "dano": number,
    "alcance": number,
    "control": number,
    "manejo": number,
    "estabilidad": number,
    "precision": number,
    "perforacionBlindaje": number,
    "cadenciaDisparo": number,
    "capacidad": number,
    "velocidadBoca": number,
    "sonidoDisparo": number
  },
  "nombreArma": string | null
}

Si la imagen NO contiene estadísticas de arma o los datos no pueden extraerse con confianza, responde exactamente en este formato:
{
  "tipo": "descripcion",
  "descripcionComica": "Frase breve, original y graciosa en español que deje claro que esto no son las estadísticas que esperaba ver, y que pida que le envíen una imagen con las estadísticas correctas. El tono debe ser ingenioso y ligeramente sarcástico, como si dijera: '¿Qué tiene que ver esto con las estadísticas del arma?'"
}



La descripción debe ser original para cada imagen.`;

    // Convertir base64 a un formato que Gemini pueda entender
    const imagePart = {
      inlineData: {
        data: imageData,
        mimeType: mimeType
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    console.log('Respuesta de Gemini:', text);
    
    // Extraer el JSON de la respuesta
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No se pudo extraer JSON de la respuesta');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    console.log('Respuesta interpretada:', parsed);

    if (parsed?.tipo === 'descripcion') {
      const descripcion = typeof parsed.descripcionComica === 'string'
        ? parsed.descripcionComica.trim()
        : '';
      if (descripcion.length > 0) {
        throw new AnalysisError(
          descripcion,
          'NOT_STATS',
          'La respuesta indicó que no hay estadísticas disponibles.'
        );
      }
      throw new AnalysisError(
        'Gemini no encontró estadísticas reconocibles en la imagen.',
        'NOT_STATS',
        'La respuesta de Gemini no incluyó una descripción.'
      );
    }

    const statsSource = parsed?.datos ?? parsed;

    // Validar y normalizar los datos
    const normalized: WeaponStats = {
      dano: Number(statsSource?.dano) || 0,
      alcance: Number(statsSource?.alcance) || 0,
      control: Number(statsSource?.control) || 0,
      manejo: Number(statsSource?.manejo) || 0,
      estabilidad: Number(statsSource?.estabilidad) || 0,
      precision: Number(statsSource?.precision) || 0,
      perforacionBlindaje: Number(statsSource?.perforacionBlindaje) || 0,
      cadenciaDisparo: Number(statsSource?.cadenciaDisparo) || 0,
      capacidad: Number(statsSource?.capacidad) || 0,
      velocidadBoca: Number(statsSource?.velocidadBoca) || 0,
      sonidoDisparo: Number(statsSource?.sonidoDisparo) || 0,
      nombreArma: typeof (parsed?.nombreArma ?? statsSource?.nombreArma) === 'string'
        ? (parsed?.nombreArma ?? statsSource?.nombreArma)
        : ''
    };

    const numericFields: Array<keyof WeaponStats> = [
      'dano',
      'alcance',
      'control',
      'manejo',
      'estabilidad',
      'precision',
      'perforacionBlindaje',
      'cadenciaDisparo',
      'capacidad',
      'velocidadBoca',
      'sonidoDisparo',
    ];

    const meaningfulValues = numericFields.filter((field) => {
      const value = normalized[field];
      return typeof value === 'number' && value > 0;
    });

    const hasWeaponName = normalized.nombreArma && normalized.nombreArma.trim().length > 0;

    if (meaningfulValues.length === 0 && !hasWeaponName) {
      throw new AnalysisError(
        'Gemini no encontró estadísticas reconocibles en la imagen.',
        'NOT_STATS',
        'Los valores numéricos resultaron nulos o irrelevantes.'
      );
    }

    return normalized;
  } catch (error) {
    console.error('Error en analyzeWeaponImage:', error);
    if (error instanceof AnalysisError) {
      throw error;
    }
    throw new Error(
      `Error al analizar la imagen: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// Manejador principal de la función
export default async function handler(req: Request) {
  // Manejar solicitudes OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verificar que sea una solicitud POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método no permitido' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parsear el cuerpo de la solicitud
    const requestData = await req.json();
    
    // Verificar que tenemos los datos de la imagen
    if (!requestData.imageData) {
      return new Response(
        JSON.stringify({ error: 'Se requiere imageData' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtener el tipo de contenido (contentType)
    const contentType = requestData.contentType || 'image/jpeg';
    
    // Analizar la imagen
    console.log('Procesando imagen...');
    let stats: WeaponStats;
    try {
      stats = await analyzeWeaponImage(requestData.imageData, contentType);
    } catch (error) {
      if (error instanceof AnalysisError) {
        return new Response(
          JSON.stringify({ success: false, error: error.friendlyMessage, code: error.code }),
          { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw error;
    }
    
    // Devolver los resultados
    return new Response(
      JSON.stringify({ success: true, data: stats }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error en la función de análisis:', error);
    
    const friendlyMessage = error instanceof AnalysisError
      ? error.friendlyMessage
      : 'Error en el análisis de la imagen';
    const code = error instanceof AnalysisError ? error.code : 'ANALYSIS_ERROR';
    const details = error instanceof Error ? error.message : 'Error desconocido';

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: friendlyMessage,
        code,
        details,
      }),
      { status: error instanceof AnalysisError ? 422 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Iniciar el servidor
serve(handler);
