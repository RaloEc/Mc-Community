import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import Jimp from "npm:jimp@0.22.10";
// Forzar redespliegue v1.1
const LOG_PREFIX = "[weapon-analyzer]";
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
  nombreArma?: string | null;
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
  console.log(`${LOG_PREFIX} Descargando imagen desde Storage`, {
    bucket,
    path,
  });
  const { data, error } = await supabase.storage.from(bucket).download(path);

  if (error) {
    console.error(`${LOG_PREFIX} Error al descargar imagen`, {
      bucket,
      path,
      error,
    });
    throw new Error(`Failed to download image: ${error.message}`);
  }

  const buffer = await data.arrayBuffer();
  console.log(`${LOG_PREFIX} Imagen descargada correctamente`, {
    size: buffer.byteLength,
  });
  return new Uint8Array(buffer);
}

function imageToBase64(imageData: Uint8Array): string {
  console.log(`${LOG_PREFIX} Convirtiendo imagen a Base64`);
  let binary = "";
  for (let i = 0; i < imageData.byteLength; i++) {
    binary += String.fromCharCode(imageData[i]);
  }
  const base64 = btoa(binary);
  console.log(`${LOG_PREFIX} Conversión a Base64 completada`, {
    length: base64.length,
  });
  return base64;
}

async function analyzeWithGemini(
  imageBase64: string,
  mimeType: string,
  imageWidth: number,
  imageHeight: number
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

  console.log(`${LOG_PREFIX} Preparando request a Gemini`, {
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

  console.log(`${LOG_PREFIX} Gemini respondió`, {
    status: response.status,
  });

  if (!response.ok) {
    let errorData: unknown = {};
    try {
      errorData = await response.json();
    } catch (parseError) {
      console.error(
        `${LOG_PREFIX} No se pudo parsear error de Gemini`,
        { error: parseError }
      );
    }
    console.error(`${LOG_PREFIX} Error desde Gemini`, { errorData });
    throw new Error(`Gemini API error: ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];

  if (candidate?.finishReason === "MAX_TOKENS") {
    console.error(`${LOG_PREFIX} Gemini alcanzó MAX_TOKENS`, {
      usageMetadata: data.usageMetadata,
    });
    throw new Error(
      "Gemini alcanzó el límite de tokens. Intenta con una imagen más clara o pequeña."
    );
  }

  const content = candidate?.content?.parts?.[0]?.text;

  if (!content) {
    console.error(`${LOG_PREFIX} Gemini no devolvió contenido`, {
      candidate,
      usageMetadata: data.usageMetadata,
    });
    throw new Error("No content in Gemini response");
  }

  console.log(`${LOG_PREFIX} Respuesta de Gemini (raw):`, content);

  const startIndex = content.indexOf("{");
  const endIndex = content.lastIndexOf("}");

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    console.error(`${LOG_PREFIX} No se pudo extraer JSON`, {
      content,
      startIndex,
      endIndex,
    });
    throw new Error(
      `No se pudo extraer JSON de la respuesta de Gemini: ${content}`
    );
  }

  const jsonString = content.substring(startIndex, endIndex + 1);

  let result: AnalysisResult;
  try {
    const parsed = JSON.parse(jsonString) as Record<string, unknown>;
    result = {
      type:
        (parsed.type as AnalysisResult["type"]) ||
        (parsed.tipo as AnalysisResult["type"]),
      datos: parsed.datos as WeaponStats | undefined,
      stats: parsed.stats as WeaponStats | undefined,
      descripcion: parsed.descripcion as string | undefined,
      descripcionComica: parsed.descripcionComica as string | undefined,
      nombreArma: parsed.nombreArma as string | null | undefined,
    };

    console.log(`${LOG_PREFIX} JSON parseado y normalizado`, {
      original: parsed,
      normalizado: result,
    });
  } catch (error) {
    console.error(`${LOG_PREFIX} Error al parsear JSON extraído`, {
      error,
      jsonString,
    });
    throw new Error(`El JSON extraído no es válido: ${jsonString}`);
  }

  console.log(`${LOG_PREFIX} Resultado parseado desde Gemini`, {
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

  console.log(`${LOG_PREFIX} Estado del job actualizado`, {
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
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    parsedBody = (await req.json()) as JobRequest;
    const { jobId } = parsedBody;
    currentJobId = jobId;

    if (!jobId) {
      return new Response("jobId is required", { status: 400 });
    }

    console.log(`${LOG_PREFIX} Iniciando procesamiento de job`, {
      jobId,
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log(`${LOG_PREFIX} Actualizando estado a processing`, {
      jobId,
    });
    await updateJobStatus(supabase, jobId, "processing");

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

    console.log(`${LOG_PREFIX} Job cargado`, job);

    const imageData = await downloadImage(
      supabase,
      job.bucket,
      job.storage_path
    );

    const image = await Jimp.read(imageData.buffer);
    const imageWidth = image.bitmap.width;
    const imageHeight = image.bitmap.height;
    console.log(
      `${LOG_PREFIX} Dimensiones de imagen obtenidas dinámicamente`,
      {
        width: imageWidth,
        height: imageHeight,
      }
    );

    const fileExtension =
      job.storage_path.split(".").pop()?.toLowerCase() || "png";
    const mimeTypeMap: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
    };
    const mimeType = mimeTypeMap[fileExtension] || "image/png";
    console.log(`${LOG_PREFIX} MIME detectado`, {
      fileExtension,
      mimeType,
    });

    const imageBase64 = imageToBase64(imageData);

    const analysisResult = await analyzeWithGemini(
      imageBase64,
      mimeType,
      imageWidth,
      imageHeight
    );

    console.log(`${LOG_PREFIX} Verificando tipo de resultado`, {
      jobId,
      tipo: analysisResult.type,
      tipoExacto: JSON.stringify(analysisResult.type),
      esStats: analysisResult.type === "stats",
      tieneStats: Boolean(analysisResult.stats),
      tieneDatos: Boolean(analysisResult.datos),
    });

    if (analysisResult.type === "stats") {
      const normalizedResult: AnalysisResult = {
        type: "stats",
        stats: analysisResult.datos || analysisResult.stats,
        nombreArma: analysisResult.nombreArma,
      };

      await updateJobStatus(
        supabase,
        jobId,
        "completed",
        normalizedResult
      );
      console.log(`${LOG_PREFIX} Job completado con éxito`, {
        jobId,
        stats: normalizedResult.stats,
      });
    } else {
      const descripcion =
        analysisResult.descripcion ||
        analysisResult.descripcionComica ||
        "No se pudieron extraer estadísticas";
      await updateJobStatus(supabase, jobId, "failed", null, descripcion);
      console.warn(
        `${LOG_PREFIX} Job marcado como failed por Gemini`,
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
    console.error(`${LOG_PREFIX} Error inesperado`, {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
    });

    try {
      if (!currentJobId) {
        currentJobId = parsedBody?.jobId ?? null;
      }

      if (!currentJobId) {
        throw new Error(
          "No se pudo determinar el jobId para registrar el error"
        );
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
        undefined,
        error instanceof Error ? error.message : "Unknown error"
      );
      console.warn(
        `${LOG_PREFIX} Job marcado como failed tras excepción`,
        {
          jobId: currentJobId,
          error: error instanceof Error ? error.message : "Unknown error",
        }
      );
    } catch (updateError) {
      console.error(
        `${LOG_PREFIX} No se pudo actualizar job tras error`,
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
