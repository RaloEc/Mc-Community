'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
// createNonPersistentClient ya no existe después de la migración a @supabase/ssr

export default function TestSingletonPage() {
  const [testResults, setTestResults] = useState<string[]>([])

  useEffect(() => {
    // Función para probar el patrón singleton
    const testSingleton = () => {
      const results: string[] = []
      
      // Crear múltiples instancias del cliente normal
      const client1 = createClient()
      const client2 = createClient()
      const client3 = createClient()
      
      // Crear múltiples instancias del cliente sin persistencia
      // NOTA: createNonPersistentClient ya no existe después de la migración a @supabase/ssr
      // const nonPersistentClient1 = createNonPersistentClient()
      // const nonPersistentClient2 = createNonPersistentClient()
      
      // Verificar si son la misma instancia
      results.push(`Cliente normal: ¿client1 === client2? ${client1 === client2}`)
      results.push(`Cliente normal: ¿client2 === client3? ${client2 === client3}`)
      // results.push(`Cliente sin persistencia: ¿nonPersistentClient1 === nonPersistentClient2? ${nonPersistentClient1 === nonPersistentClient2}`)
      
      // Verificar si hay advertencias en la consola
      results.push('Revisa la consola del navegador para ver si hay advertencias de múltiples instancias de GoTrueClient')
      
      setTestResults(results)
    }
    
    testSingleton()
  }, [])
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Prueba de Patrón Singleton para Supabase</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Resultados:</h2>
        <ul className="list-disc pl-5">
          {testResults.map((result, index) => (
            <li key={index} className="mb-1">{result}</li>
          ))}
        </ul>
      </div>
      
      <div className="mt-6 p-4 bg-yellow-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Instrucciones:</h2>
        <p>1. Abre la consola del navegador (F12)</p>
        <p>2. Verifica si hay advertencias de "Multiple GoTrueClient instances detected"</p>
        <p>3. Si no hay advertencias, el patrón singleton está funcionando correctamente</p>
      </div>
    </div>
  )
}
