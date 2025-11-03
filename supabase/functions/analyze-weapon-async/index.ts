import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const geminiApiKey = Deno.env.get("GEMINI_API_KEY") || "";
const geminiModel = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";
const geminiApiVersion = Deno.env.get("GEMINI_API_VERSION") || "v1beta";
const geminiApiBaseUrl =
  Deno.env.get("GEMINI_API_BASE_URL") ||
  "https://generativelanguage.googleapis.com";

interface JobRequest {
  jobId: string;
}

interface WeaponStats {
  damage?: number;
  range?: number;
  control?: number;
  handling?: number;
  stability?: number;
  accuracy?: number;
  armorPenetration?: number;
  fireRate?: number;
  capacity?: number;
  muzzleVelocity?: number;
  soundRange?: number;
}

interface AnalysisResult {
  type: "stats" | "descripcion";
  datos?: WeaponStats;
  stats?: WeaponStats;
  descripcion?: string;
  descripcionComica?: string;
  nombreArma?: string | null;
}

async function downloadImage(
  supabase: ReturnType<typeof createClient>,
  bucket: string,
  path: string
): Promise<Uint8Array> {
  console.log("[analyze-weapon-async] Descargando imagen desde Storage", {
    bucket,
    path,
  });
  const { data, error } = await supabase.storage.from(bucket).download(path);

  if (error) {
    console.error("[analyze-weapon-async] Error al descargar imagen", {
      bucket,
      path,
      error,
    });
    throw new Error(`Failed to download image: ${error.message}`);
  }

  const buffer = await data.arrayBuffer();
  console.log("[analyze-weapon-async] Imagen descargada correctamente", {
    size: buffer.byteLength,
  });
  return new Uint8Array(buffer);
}

function imageToBase64(imageData: Uint8Array): string {
  console.log("[analyze-weapon-async] Convirtiendo imagen a Base64");
  let binary = "";
  for (let i = 0; i < imageData.byteLength; i++) {
    binary += String.fromCharCode(imageData[i]);
  }
  const base64 = btoa(binary);
  console.log("[analyze-weapon-async] Conversión a Base64 completada", {
    length: base64.length,
  });
  return base64;
}

async function analyzeWithGemini(
  imageBase64: string,
  mimeType: string
): Promise<AnalysisResult> {
  const prompt = `Analiza la imagen y devuelve SOLO un objeto JSON válido.

Responde con uno de estos formatos estrictos:

1) Cuando identifiques estadísticas completas de un arma:
{
  "tipo": "stats",
  "datos": {
    "dano": number,
    "alcance": number,
    "control": number,
    "manejo": number,
    "estabilidad": number,
    "precision": number,
    "perforacionBlindaje": number | null,
    "cadenciaDisparo": number | null,
    "capacidad": number | null,
    "velocidadBoca": number | null,
    "sonidoDisparo": number | null
  },
  "nombreArma": string | null
}

2) Cuando NO puedas extraer estadísticas confiables:
{
  "tipo": "descripcion",
  "descripcionComica": "Oración breve y graciosa en español explicando que no encuentras estadísticas y solicitando otra imagen"
}

No incluyas comentarios, explicaciones ni texto adicional.`;

  console.log("[analyze-weapon-async] Preparando request a Gemini", {
    mimeType,
    payloadSize: imageBase64.length,
    version: geminiApiVersion,
    model: geminiModel,
  });

  const response = await fetch(
    `${geminiApiBaseUrl}/${geminiApiVersion}/models/${geminiModel}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": geminiApiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
              {
                inlineData: {
                  mimeType,
                  data: imageBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  console.log("[analyze-weapon-async] Gemini respondió", {
    status: response.status,
  });

  if (!response.ok) {
    let errorData = {};
    try {
      errorData = await response.json();
    } catch (e) {
      console.error("[analyze-weapon-async] No se pudo parsear error de Gemini", { e });
    }
    console.error("[analyze-weapon-async] Error desde Gemini", { errorData });
    throw new Error(`Gemini API error: ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  
  // Verificar si Gemini alcanzó el límite de tokens
  if (candidate?.finishReason === "MAX_TOKENS") {
    console.error("[analyze-weapon-async] Gemini alcanzó MAX_TOKENS", {
      finishReason: candidate.finishReason,
      usageMetadata: data.usageMetadata,
    });
    throw new Error("Gemini alcanzó el límite de tokens. Intenta con una imagen más clara o pequeña.");
  }
  
  const content = candidate?.content?.parts?.[0]?.text;

  if (!content) {
    console.error("[analyze-weapon-async] Gemini no devolvió contenido", {
      candidate,
      usageMetadata: data.usageMetadata,
    });
    throw new Error("No content in Gemini response");
  }

  console.log("[analyze-weapon-async] Respuesta de Gemini (raw):", content);

  // --- EXTRACCIÓN DEFENSIVA DE JSON ---
  // Busca la primera llave "{" y la última "}"
  const startIndex = content.indexOf("{");
  const endIndex = content.lastIndexOf("}");

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    console.error("[analyze-weapon-async] No se pudo extraer JSON", {
      content,
      startIndex,
      endIndex,
    });
    throw new Error(
      `No se pudo extraer JSON de la respuesta de Gemini: ${content}`
    );
  }

  // Extrae la subcadena que es el JSON
  const jsonString = content.substring(startIndex, endIndex + 1);

  let result: AnalysisResult;
  try {
    const parsed = JSON.parse(jsonString) as any;
    
    // Normalizar: Gemini devuelve "tipo" pero nuestra interfaz espera "type"
    result = {
      type: parsed.type || parsed.tipo,
      datos: parsed.datos,
      stats: parsed.stats,
      descripcion: parsed.descripcion,
      descripcionComica: parsed.descripcionComica,
      nombreArma: parsed.nombreArma,
    } as AnalysisResult;
    
    console.log("[analyze-weapon-async] JSON parseado y normalizado", {
      original: parsed,
      normalizado: result,
    });
  } catch (e) {
    console.error("[analyze-weapon-async] Error al parsear JSON extraído", {
      error: e,
      jsonString,
    });
    throw new Error(`El JSON extraído no es válido: ${jsonString}`);
  }
  // --- FIN DE EXTRACCIÓN DEFENSIVA ---

  console.log("[analyze-weapon-async] Resultado parseado desde Gemini", {
    result,
  });
  return result;
}

async function updateJobStatus(
  supabase: ReturnType<typeof createClient>,
  jobId: string,
  status: string,
  result?: AnalysisResult | null,
  errorMessage?: string
): Promise<void> {
  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (result) {
    updateData.result = result;
  }

  if (errorMessage) {
    updateData.error_message = errorMessage;
  }

  const { error } = await supabase
    .from("weapon_analysis_jobs")
    .update(updateData)
    .eq("id", jobId);

  if (error) {
    throw new Error(`Failed to update job: ${error.message}`);
  }

  console.log("[analyze-weapon-async] Estado del job actualizado", {
    jobId,
    status,
    hasResult: Boolean(result),
    hasError: Boolean(errorMessage),
  });
}

serve(async (req: Request) => {
  let parsedBody: JobRequest | null = null;
  let currentJobId: string | null = null;
  try {
    // Only accept POST requests
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    // Parse request body
    parsedBody = (await req.json()) as JobRequest;
    const { jobId } = parsedBody;
    currentJobId = jobId;

    if (!jobId) {
      return new Response("jobId is required", { status: 400 });
    }

    console.log("[analyze-weapon-async] Iniciando procesamiento de job", {
      jobId,
    });

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Update job status to processing
    console.log("[analyze-weapon-async] Actualizando estado a processing", {
      jobId,
    });
    await updateJobStatus(supabase, jobId, "processing");

    // Fetch job details
    const { data: job, error: fetchError } = await supabase
      .from("weapon_analysis_jobs")
      .select("id, user_id, storage_path, bucket")
      .eq("id", jobId)
      .single();

    if (fetchError || !job) {
      throw new Error(
        `Failed to fetch job: ${fetchError?.message || "Job not found"}`
      );
    }

    console.log("[analyze-weapon-async] Job cargado", job);

    // Download image from storage
    const imageData = await downloadImage(
      supabase,
      job.bucket,
      job.storage_path
    );

    // Determine MIME type from file extension
    const fileExtension =
      job.storage_path.split(".").pop()?.toLowerCase() || "png";
    const mimeTypeMap: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
    };
    const mimeType = mimeTypeMap[fileExtension] || "image/png";
    console.log("[analyze-weapon-async] MIME detectado", {
      fileExtension,
      mimeType,
    });

    // Convert image to base64
    const imageBase64 = imageToBase64(imageData);

    // Analyze with Gemini
    const analysisResult = await analyzeWithGemini(imageBase64, mimeType);

    // Update job with result
    console.log("[analyze-weapon-async] Verificando tipo de resultado", {
      jobId,
      tipo: analysisResult.type,
      tipoExacto: JSON.stringify(analysisResult.type),
      esStats: analysisResult.type === "stats",
      tieneStats: Boolean(analysisResult.stats),
      tieneDatos: Boolean(analysisResult.datos),
    });

    if (analysisResult.type === "stats") {
      // Normalizar: si viene "datos", convertir a "stats" para compatibilidad
      const normalizedResult: AnalysisResult = {
        type: "stats",
        stats: analysisResult.datos || analysisResult.stats,
        nombreArma: analysisResult.nombreArma,
      };
      await updateJobStatus(supabase, jobId, "completed", normalizedResult);
      console.log("[analyze-weapon-async] Job completado con éxito", { jobId, stats: normalizedResult.stats });
    } else {
      // Analysis returned a description (no stats found)
      // Busca el campo de descripción (puede ser "descripcion" o "descripcionComica")
      const descripcion = (analysisResult as any).descripcion || (analysisResult as any).descripcionComica || "No se pudieron extraer estadísticas";
      await updateJobStatus(
        supabase,
        jobId,
        "failed",
        null,
        descripcion
      );
      console.warn(
        "[analyze-weapon-async] Job marcado como failed por Gemini",
        {
          jobId,
          descripcion,
          tipoRecibido: analysisResult.type,
        }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[analyze-weapon-async] Error inesperado", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
    });

    // Try to update job with error status
    try {
      if (!currentJobId) {
        currentJobId = parsedBody?.jobId || null;
      }

      if (!currentJobId) {
        throw new Error("No se pudo determinar el jobId para registrar el error");
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      await updateJobStatus(
        supabase,
        currentJobId,
        "failed",
        null,
        error instanceof Error ? error.message : "Unknown error"
      );
      console.warn(
        "[analyze-weapon-async] Job marcado como failed tras excepción",
        {
          jobId: currentJobId,
          error: error instanceof Error ? error.message : "Unknown error",
        }
      );
    } catch (updateError) {
      console.error(
        "[analyze-weapon-async] No se pudo actualizar job tras error",
        {
          updateError,
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
