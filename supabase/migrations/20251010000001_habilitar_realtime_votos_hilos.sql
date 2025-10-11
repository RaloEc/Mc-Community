-- Habilitar Realtime para la tabla de votos de hilos
ALTER PUBLICATION supabase_realtime ADD TABLE public.foro_votos_hilos;

-- Comentario
COMMENT ON TABLE public.foro_votos_hilos IS 'Almacena los votos de los usuarios en hilos del foro - Realtime habilitado para sincronización instantánea';
