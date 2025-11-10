-- Crear trigger para invocar Edge Function cuando video cambia a 'processing'
-- Este trigger desacopla el cliente del servidor de conversión

-- 1. Habilitar la extensión pg_net (si no está habilitada)
create extension if not exists pg_net with schema extensions;

-- 2. Dar permisos al rol 'postgres' para usarla
grant usage on schema net to postgres;
grant execute on function net.http_post(text, jsonb, jsonb) to postgres;

-- 3. Crear la función del Trigger
-- Esta función se ejecutará CADA VEZ que el trigger se dispare
create or replace function public.trigger_video_conversion()
returns trigger
language plpgsql
security definer -- ¡Importante! Para usar secretos
as $$
declare
  v_response net.http_response;
begin
  -- Invoca la Edge Function 'video-converter' en segundo plano
  select net.http_post(
      -- URL de la Edge Function
      url:='https://qeeaptyhcqfaqdecsuqc.supabase.co/functions/v1/video-converter',
      headers:=jsonb_build_object(
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
          'Content-Type', 'application/json'
      ),
      body:=jsonb_build_object(
          'videoId', NEW.id,
          'originalPath', NEW.original_path,
          'userId', NEW.user_id
      )
  ) into v_response;

  -- Log para debugging
  raise notice '[trigger_video_conversion] Invocando Edge Function para videoId: %', NEW.id;

  return NEW;
end;
$$;

-- 4. Borrar cualquier trigger antiguo (por si acaso)
DROP TRIGGER IF EXISTS on_video_processing ON public.videos;

-- 5. Asignar el Trigger a la tabla 'videos'
create trigger on_video_processing
after update of status on public.videos
for each row
when (NEW.status = 'processing' and OLD.status <> 'processing') -- Se ejecuta solo en la transición
execute procedure public.trigger_video_conversion();

-- Comentario de documentación
comment on function public.trigger_video_conversion() is 'Trigger que invoca la Edge Function video-converter cuando un video cambia a status=processing';
