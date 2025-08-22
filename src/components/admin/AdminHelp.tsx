import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion'
import ClearCacheButton from '../ClearCacheButton'
import { AlertTriangle } from 'lucide-react'

export default function AdminHelp() {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Herramientas de administración
        </CardTitle>
        <CardDescription>
          Soluciones para problemas comunes del panel de administración
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="cache">
            <AccordionTrigger>Problemas de inicio de sesión o permisos</AccordionTrigger>
            <AccordionContent>
              <p className="mb-4">
                Si experimentas problemas con el inicio de sesión, permisos de administrador, o el panel muestra "Cargando..." indefinidamente, 
                puedes intentar limpiar la caché del navegador.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <ClearCacheButton 
                  variant="destructive" 
                  size="default"
                  redirectTo="/login"
                />
                <ClearCacheButton 
                  variant="outline" 
                  size="default"
                  className="text-gray-500"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                El primer botón limpia la caché y redirige al login. El segundo solo limpia la caché y recarga la página actual.
              </p>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="errors">
            <AccordionTrigger>Errores 403 o problemas de carga</AccordionTrigger>
            <AccordionContent>
              <p className="mb-2">
                Si recibes errores 403 (Forbidden) al cargar datos, verifica que:
              </p>
              <ul className="list-disc pl-5 mb-4 space-y-1">
                <li>Tu sesión de administrador esté activa</li>
                <li>Las solicitudes incluyan el parámetro <code>admin=true</code></li>
                <li>No haya conflictos de caché (usa el botón de limpieza)</li>
              </ul>
              <p className="text-sm text-gray-500">
                Si el problema persiste después de limpiar la caché, cierra completamente el navegador y vuelve a iniciar sesión.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}
