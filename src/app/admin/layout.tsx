// src/app/admin/layout.tsx
'use client'

import AdminProtection from '@/components/AdminProtection'
import AdminHelp from '@/components/admin/AdminHelp'
import { Suspense } from 'react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProtection loadingMessage="Cargando panel de administración...">
      <div className="p-4 md:p-6">
        <Suspense fallback={<div>Cargando herramientas de administración...</div>}>
          <AdminHelp />
        </Suspense>
        {children}
      </div>
    </AdminProtection>
  )
}