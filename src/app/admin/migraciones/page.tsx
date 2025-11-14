"use client";

import AdminProtection from "@/components/AdminProtection";
import { MigrateGoogleAvatars } from "@/components/admin/MigrateGoogleAvatars";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function MigracionesPage() {
  return (
    <AdminProtection>
      <div className="min-h-screen bg-white dark:bg-black">
        <div className="container mx-auto py-8 px-4 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Migraciones</h1>
            <p className="text-muted-foreground">
              Herramientas para migrar datos y recursos
            </p>
          </div>

          <div className="space-y-6">
            {/* Migración de Avatares de Google */}
            <MigrateGoogleAvatars />

            {/* Próximas migraciones */}
            <Card className="opacity-50">
              <CardHeader>
                <CardTitle>Próximas Migraciones</CardTitle>
                <CardDescription>
                  Más herramientas de migración próximamente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Migración de imágenes de noticias</li>
                  <li>• Migración de banners de perfil</li>
                  <li>• Limpieza de archivos temporales</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminProtection>
  );
}
