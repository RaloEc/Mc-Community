'use client';

import AdminProtection from '@/components/AdminProtection';

function AnunciosPageContent() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Gestión de Anuncios</h1>
      <p>Aquí se podrán crear y gestionar anuncios globales para el foro.</p>
    </div>
  );
}

export default function AnunciosPage() {
  return (
    <AdminProtection>
      <AnunciosPageContent />
    </AdminProtection>
  );
}
