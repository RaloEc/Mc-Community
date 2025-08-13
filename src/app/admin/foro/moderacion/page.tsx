'use client';

import AdminProtection from '@/components/AdminProtection';

function ModeracionPageContent() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Gestión de Contenido y Moderación</h1>
      <p>Aquí se gestionarán los hilos y posts reportados.</p>
    </div>
  );
}

export default function ModeracionPage() {
  return (
    <AdminProtection>
      <ModeracionPageContent />
    </AdminProtection>
  );
}
