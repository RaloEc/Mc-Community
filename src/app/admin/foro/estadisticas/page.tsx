'use client';

import AdminProtection from '@/components/AdminProtection';

function EstadisticasPageContent() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Estadísticas Avanzadas</h1>
      <p>Aquí se mostrarán las estadísticas de actividad, tráfico y tendencias del foro.</p>
    </div>
  );
}

export default function EstadisticasPage() {
  return (
    <AdminProtection>
      <EstadisticasPageContent />
    </AdminProtection>
  );
}
