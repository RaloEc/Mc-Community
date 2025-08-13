'use client';

import AdminProtection from '@/components/AdminProtection';

function ConfiguracionPageContent() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Configuración del Foro</h1>
      <p>Aquí se gestionarán las herramientas de administración como palabras prohibidas, registro de actividad y respaldos.</p>
    </div>
  );
}

export default function ConfiguracionPage() {
  return (
    <AdminProtection>
      <ConfiguracionPageContent />
    </AdminProtection>
  );
}
