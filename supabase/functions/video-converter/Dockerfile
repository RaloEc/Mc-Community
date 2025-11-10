# 1. Usar una imagen Deno nativa, no el Edge Runtime
FROM denoland/deno:1.37.0

# 2. Instalar FFmpeg
USER root
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 3. Exponer el puerto (el servidor Deno se ejecutará aquí)
EXPOSE 8080

# 4. Copiar el código de la función
WORKDIR /app
COPY . .

# 5. Comando para ejecutar el servidor Deno
# --allow-all da todos los permisos (run, net, env, read, write)
# que necesitamos para FFmpeg y Supabase
CMD ["deno", "run", "--allow-all", "index.ts"]
