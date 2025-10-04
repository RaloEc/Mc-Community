// src/app/admin/layout.tsx
'use client'

import { useEffect } from 'react'
import AdminProtection from '@/components/AdminProtection'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    console.log('[AdminLayout] Montado - Iniciando verificación de admin')
  }, [])

  return (
    <AdminProtection loadingMessage="Cargando panel de administración...">
      <div className="p-4 md:p-6">
        {children}
      </div>
    </AdminProtection>
  )
}