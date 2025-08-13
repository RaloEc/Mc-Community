'use client';

import AdminProtection from '@/components/AdminProtection';

function MediosPageContent() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Moderación de Medios</h1>
      <p>Aquí se podrán revisar, aprobar o eliminar imágenes y archivos subidos por los usuarios.</p>
    </div>
  );
}

export default function MediosPage() {
  return (
    <AdminProtection>
      <MediosPageContent />
    </AdminProtection>
  );
}
