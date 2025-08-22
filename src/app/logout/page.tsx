'use client'

import { useEffect, useState } from 'react'
import { createClient, createNonPersistentClient, clearClientInstances } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LogoutPage() {
  const router = useRouter()
  const [message, setMessage] = useState('Cerrando sesión...')
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (log: string) => {
    console.log('[Logout]', log)
    setLogs(prev => [...prev, log])
  }

  useEffect(() => {
    // Referencias a los clientes para evitar crear múltiples instancias
    let nonPersistentClient: any = null;
    let supabaseClient: any = null;
    
    async function cerrarSesion() {
      try {
        addLog('Iniciando proceso de cierre de sesión')
        
        // Usar el cliente sin persistencia singleton
        addLog('1. Obteniendo cliente sin persistencia (singleton)')
        nonPersistentClient = createNonPersistentClient()
        
        // 1. Intentar cerrar sesión con Supabase usando cliente sin persistencia
        addLog('2. Ejecutando signOut con scope global')
        const { error } = await nonPersistentClient.auth.signOut({ scope: 'global' })
        
        // No necesitamos cerrar sesión en el cliente normal ya que scope:global limpia todo
        // y estamos usando un sistema singleton que comparte la misma instancia
        
        if (error) {
          console.error('Error al cerrar sesión:', error)
          setMessage('Error al cerrar sesión: ' + error.message)
          addLog(`Error en signOut: ${error.message}`)
        } else {
          addLog('signOut ejecutado correctamente')
        }
        
        // Limpiar instancias de cliente para forzar recreación
        clearClientInstances()
        addLog('Instancias de cliente limpiadas')

        // 2. Limpiar localStorage - todas las claves relacionadas con auth
        addLog('2. Limpiando localStorage')
        try {
          if (typeof window !== 'undefined') {
            // Claves específicas de Supabase
            const keysToRemove = [
              'supabase.auth.token',
              'supabase.auth.expires_at',
              'supabase.auth.refresh_token',
              'sb-localhost-auth-token',
              'sb:token',
              'sb-access-token',
              'sb-refresh-token',
              'auth_session_cache',
              'auth_user_cache',
              'supabase.auth.data',
              'supabase.auth.event',
              'supabase.auth.provider_token',
              'supabase.auth.callback_url',
              'supabase.auth.user',
              'supabase.auth.session'
            ]

            // Buscar cualquier clave que contenga 'auth', 'token', 'supabase'
            const allKeys = Object.keys(localStorage)
            const authRelatedKeys = allKeys.filter(key => 
              key.includes('auth') || 
              key.includes('token') || 
              key.includes('supabase') ||
              key.includes('sb-')
            )

            // Combinar y eliminar duplicados
            const uniqueKeys = Array.from(new Set([...keysToRemove, ...authRelatedKeys]))
            const allKeysToRemove = uniqueKeys
            
            addLog(`Encontradas ${allKeysToRemove.length} claves para eliminar`)
            allKeysToRemove.forEach(key => {
              try {
                localStorage.removeItem(key)
                addLog(`Eliminada clave: ${key}`)
              } catch (e) {
                addLog(`Error al eliminar clave ${key}: ${e}`)
              }
            })
          }
        } catch (e) {
          addLog(`Error al limpiar localStorage: ${e}`)
        }
        
        // 3. Limpiar cookies relacionadas con auth
        addLog('3. Limpiando cookies')
        try {
          document.cookie.split(';').forEach(cookie => {
            const cookieName = cookie.split('=')[0].trim()
            if (cookieName.includes('sb-') || 
                cookieName.includes('supabase') || 
                cookieName.includes('auth')) {
              document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
              addLog(`Eliminada cookie: ${cookieName}`)
            }
          })
        } catch (e) {
          addLog(`Error al limpiar cookies: ${e}`)
        }
        
        // 4. Limpiar IndexedDB (donde Supabase puede almacenar datos)
        addLog('4. Limpiando IndexedDB')
        try {
          if (typeof window !== 'undefined' && window.indexedDB) {
            // Intentar eliminar bases de datos de IndexedDB relacionadas con Supabase
            const dbNames = ['supabase', 'supa', 'sb-', 'auth'];
            
            // Eliminar bases de datos conocidas directamente
            dbNames.forEach(dbName => {
              try {
                // Intentar eliminar la base de datos directamente
                const deleteRequest = window.indexedDB.deleteDatabase(dbName);
                deleteRequest.onsuccess = () => addLog(`IndexedDB: eliminada base de datos ${dbName}`);
                deleteRequest.onerror = () => addLog(`IndexedDB: error al eliminar ${dbName}`);
              } catch (e) {
                addLog(`Error al eliminar IndexedDB ${dbName}: ${e}`);
              }
            });
            
            // Intentar eliminar bases de datos con prefijos específicos
            // Nota: No todos los navegadores soportan indexedDB.databases()
            if ('databases' in window.indexedDB) {
              try {
                // Usar then/catch en lugar de onsuccess/onerror para la Promise
                window.indexedDB.databases().then(
                  (databases) => {
                    databases.forEach(db => {
                      if (db.name) {
                        // Verificar si el nombre coincide con alguno de los patrones
                        const matchesPattern = dbNames.some(pattern => 
                          db.name!.includes(pattern)
                        );
                        
                        if (matchesPattern) {
                          try {
                            const deleteRequest = window.indexedDB.deleteDatabase(db.name);
                            deleteRequest.onsuccess = () => 
                              addLog(`IndexedDB: eliminada base de datos ${db.name}`);
                            deleteRequest.onerror = () => 
                              addLog(`IndexedDB: error al eliminar ${db.name}`);
                          } catch (e) {
                            addLog(`Error al eliminar IndexedDB ${db.name}: ${e}`);
                          }
                        }
                      }
                    });
                  },
                  (error) => {
                    addLog(`Error al listar bases de datos IndexedDB: ${error}`);
                  }
                );
              } catch (e) {
                addLog(`Error al usar indexedDB.databases(): ${e}`);
              }
            } else {
              addLog('Este navegador no soporta indexedDB.databases()');
            }
          }
        } catch (e) {
          addLog(`Error general en limpieza de IndexedDB: ${e}`)
        }
        
        // 5. Recargar la página completamente para limpiar cualquier estado en memoria
        setMessage('Sesión cerrada. Redirigiendo en 3 segundos...')
        addLog('Proceso de cierre completado')
        
        // Redirigir después de un retraso para ver los logs
        setTimeout(() => {
          addLog('Redirigiendo a /login')
          
          // Forzar recarga completa en lugar de navegación SPA
          if (typeof window !== 'undefined') {
            // Guardar logs en sessionStorage para mostrarlos después de la recarga
            try {
              sessionStorage.setItem('logout_logs', JSON.stringify(logs))
              sessionStorage.setItem('logout_timestamp', Date.now().toString())
            } catch (e) {
              console.error('Error al guardar logs en sessionStorage:', e)
            }
            
            // Redirigir con recarga completa y parámetro para evitar bucles
            window.location.href = '/login?fresh=true&nocache=' + Date.now()
          } else {
            // Fallback a navegación normal si window no está disponible
            router.push('/login')
            router.refresh()
          }
        }, 3000)
      } catch (error) {
        console.error('Error inesperado:', error)
        setMessage(`Error inesperado: ${error}`)
        addLog(`Error general: ${error}`)
      }
    }
    
    cerrarSesion()
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border p-6 shadow-md">
        <h1 className="text-center text-2xl font-bold">Cerrar Sesión</h1>
        <p className="text-center font-medium">{message}</p>
        
        <div className="mt-4 max-h-60 overflow-y-auto rounded bg-gray-100 p-3 text-sm">
          <h2 className="mb-2 font-semibold">Logs de depuración:</h2>
          {logs.map((log, i) => (
            <div key={i} className="mb-1">
              <span className="text-gray-500">[{i+1}]</span> {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
