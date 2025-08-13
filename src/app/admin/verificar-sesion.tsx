'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function VerificarSesion() {
  const [sesionInfo, setSesionInfo] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function verificarSesion() {
      try {
        // Verificar si hay una sesión activa
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          setError(`Error al obtener sesión: ${sessionError.message}`)
          return
        }
        
        // Intentar obtener el usuario actual
        const { data: userData, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
          setError(`Error al obtener usuario: ${userError.message}`)
        }
        
        setSesionInfo({
          session: sessionData.session,
          user: userData.user
        })
      } catch (e: any) {
        setError(`Error general: ${e.message}`)
      } finally {
        setCargando(false)
      }
    }
    
    verificarSesion()
  }, [])
  
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        setError(`Error al cerrar sesión: ${error.message}`)
      } else {
        window.location.href = '/login'
      }
    } catch (e: any) {
      setError(`Error al cerrar sesión: ${e.message}`)
    }
  }
  
  const handleRefreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      if (error) {
        setError(`Error al refrescar sesión: ${error.message}`)
      } else {
        setSesionInfo({
          session: data.session,
          user: data.user
        })
      }
    } catch (e: any) {
      setError(`Error al refrescar sesión: ${e.message}`)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Verificador de Sesión</h1>
      
      {cargando ? (
        <p>Cargando información de sesión...</p>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p><strong>Error:</strong> {error}</p>
        </div>
      ) : (
        <div>
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <p><strong>Estado de sesión:</strong> {sesionInfo?.session ? 'Activa' : 'No hay sesión activa'}</p>
            {sesionInfo?.user && (
              <p><strong>Usuario:</strong> {sesionInfo.user.email}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Información detallada:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(sesionInfo, null, 2)}
            </pre>
          </div>
          
          <div className="mt-4 space-x-2">
            <button 
              onClick={handleRefreshSession}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Refrescar Sesión
            </button>
            <button 
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
