'use client'

import { useState } from 'react'
import ConsultaServidor from '@/components/servidores/ConsultaServidor'
import FormularioServidor from '@/components/servidores/FormularioServidor'
import { Separator } from '@/components/ui/separator'

interface ServerDataForForm {
  ip: string | null;
  name?: string;
  description?: string;
  version?: string;
  type?: string;
  imageUrl?: string;
}

export default function AgregarServidorPage() {
  const [serverData, setServerData] = useState<ServerDataForForm>({ ip: null });

  const handleServerDataFetched = (data: ServerDataForForm) => {
    setServerData(data);
  };

  const handleServerSaved = () => {
    // Podrías querer limpiar el formulario o redirigir al usuario, o mostrar un mensaje.
    setServerData({ ip: null }); // Limpia los datos para permitir una nueva consulta/guardado
    // Quizás también quieras recargar la lista de servidores en la página principal de servidores.
    alert('Servidor gestionado con éxito. Puedes agregar otro o volver al listado.');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2 text-center">Agregar Nuevo Servidor al Directorio</h1>
      <p className="text-muted-foreground text-center mb-8">
        Consulta la información de un servidor de Minecraft y agrégalo al directorio público.
      </p>

      <div className="flex flex-col md:flex-row md:gap-8">
        {/* Contenedor para ConsultaServidor */}
        <div className="w-full mb-8 md:mb-0 md:basis-1/3 lg:basis-1/4">
          <ConsultaServidor 
            onServerDataFetched={handleServerDataFetched} 
            className="shadow-lg dark:bg-card h-full"
          />
        </div>
        
        <Separator orientation="vertical" className="hidden md:block mx-4" /> {/* Ajustado mx-4 para el separador si el gap principal no lo cubre bien */} 
        
        {/* Contenedor para FormularioServidor */}
        <div className="w-full md:basis-2/3 lg:basis-3/4">
          <FormularioServidor 
            serverIpForForm={serverData.ip}
            initialName={serverData.name}
            initialDescription={serverData.description}
            // initialType y initialImageUrl se pueden añadir si ConsultaServidor los provee
            onServerSaved={handleServerSaved}
            className="shadow-lg dark:bg-card h-full"
          />
        </div>
      </div>
    </div>
  );
}
