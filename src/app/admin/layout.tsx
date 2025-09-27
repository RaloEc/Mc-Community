// src/app/admin/layout.tsx
'use client'

import AdminProtection from '@/components/AdminProtection'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProtection loadingMessage="Cargando panel de administración...">
      <div className="p-4 md:p-6">
        {children}
      </div>
    </AdminProtection>
  )
}