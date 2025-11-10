// supabase/functions/video-converter/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// CAMBIO 1: Importar 'uuid' desde esm.sh en lugar de deno.land/std
import { v4 as uuidv4 } from "https://esm.sh/uuid@9";

// Función para ejecutar comandos de shell (FFmpeg)
async function runCommand(cmd: string[]): Promise<void> {
  console.log(`[FFmpeg] Ejecutando: ${cmd.join(" ")}`);
  const p = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    stdout: "piped",
    stderr: "piped",
  });
  const { code, stdout, stderr } = await p.output();

  if (code !== 0) {
    const errorOutput = new TextDecoder().decode(stderr);
    console.error(`[FFmpeg] Error: ${errorOutput}`);
    throw new Error(`FFmpeg failed: ${errorOutput}`);
  }
  console.log("[FFmpeg] Conversión exitosa.");
}

// Usar Deno.serve para un servidor nativo de Deno
Deno.serve({ port: 8080 }, async (req) => {
  // Manejar CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  const { videoId, originalPath, userId } = await req.json();
  console.log(`[video-converter] Solicitud recibida para videoId: ${videoId}`);

  if (!videoId || !originalPath || !userId) {
    return new Response(JSON.stringify({ error: "Missing parameters" }), {
      status: 400,
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const tempDir = await Deno.makeTempDir();
  // CAMBIO 2: Llamar a 'uuidv4()' en lugar de 'v4.generate()'
  const tempInputPath = `${tempDir}/${uuidv4()}`;
  const tempOutputPath = `${tempDir}/output.webm`;

  try {
    // 1. Descargar el video original de 'video-uploads'
    console.log(`[video-converter] Descargando video desde: ${originalPath}`);
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from("video-uploads")
      .download(originalPath);

    if (downloadError) throw downloadError;
    await Deno.writeFile(
      tempInputPath,
      new Uint8Array(await fileData.arrayBuffer())
    );
    console.log(
      `[video-converter] Video descargado exitosamente a: ${tempInputPath}`
    );

    // 2. Ejecutar FFmpeg
    const ffmpegCmd = [
      "ffmpeg",
      "-i",
      tempInputPath,
      "-c:v",
      "libvpx-vp9",
      "-b:v",
      "1M",
      "-an",
      "-vf",
      "scale=720:-1",
      "-f",
      "webm",
      tempOutputPath,
    ];

    await runCommand(ffmpegCmd);

    // 3. Subir el .webm convertido a 'videos'
    const outputFileName = `${userId}/${videoId}.webm`;
    const outputData = await Deno.readFile(tempOutputPath);

    console.log(
      `[video-converter] Subiendo video convertido a: ${outputFileName}`
    );
    const { error: uploadError } = await supabaseAdmin.storage
      .from("videos")
      .upload(outputFileName, outputData, {
        contentType: "video/webm",
        cacheControl: "3600",
      });

    if (uploadError) throw uploadError;

    // 4. Obtener la URL pública del archivo
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from("videos").getPublicUrl(outputFileName);
    console.log(`[video-converter] URL pública: ${publicUrl}`);

    // 5. Actualizar la tabla 'videos'
    const { error: dbError } = await supabaseAdmin
      .from("videos")
      .update({ status: "completed", public_url: publicUrl })
      .eq("id", videoId);

    if (dbError) throw dbError;
    console.log(`[video-converter] DB actualizada a 'completed'`);

    // 6. (Opcional) Borrar el archivo original
    await supabaseAdmin.storage.from("video-uploads").remove([originalPath]);

    // 7. Limpiar archivos temporales
    await Deno.remove(tempDir, { recursive: true });

    return new Response(JSON.stringify({ success: true, url: publicUrl }), {
      status: 200,
    });
  } catch (error) {
    console.error(
      `[video-converter] Error procesando ${videoId}:`,
      error.message
    );
    // Marcar como fallido en la DB
    await supabaseAdmin
      .from("videos")
      .update({ status: "failed" })
      .eq("id", videoId);

    await Deno.remove(tempDir, { recursive: true }).catch(() => {}); // Intenta limpiar

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
});
