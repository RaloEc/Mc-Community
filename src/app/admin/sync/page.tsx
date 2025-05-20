'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Download, RefreshCw } from 'lucide-react';

export default function SyncPage() {
  return (
    <div className="container py-8">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sincronización de Mods</h1>
          <p className="text-muted-foreground mt-2">
            Sincroniza mods desde diferentes fuentes a tu base de datos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="mr-2 h-5 w-5 text-blue-500" />
                Modrinth
              </CardTitle>
              <CardDescription>
                Sincroniza mods desde la plataforma Modrinth
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Modrinth es una plataforma de código abierto para mods de Minecraft que ofrece una amplia selección de mods de alta calidad.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link href="/admin/sync/modrinth">
                  Sincronizar Mods de Modrinth
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="opacity-60">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="mr-2 h-5 w-5 text-orange-500" />
                CurseForge
              </CardTitle>
              <CardDescription>
                Sincroniza mods desde la plataforma CurseForge
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                CurseForge es una de las plataformas más grandes para mods de Minecraft con miles de mods disponibles.
              </p>
              <p className="text-xs text-muted-foreground mt-2 italic">
                (Próximamente)
              </p>
            </CardContent>
            <CardFooter>
              <Button disabled>
                Sincronizar Mods de CurseForge
              </Button>
            </CardFooter>
          </Card>

          <Card className="opacity-60">
            <CardHeader>
              <CardTitle className="flex items-center">
                <RefreshCw className="mr-2 h-5 w-5 text-green-500" />
                Sincronización Masiva
              </CardTitle>
              <CardDescription>
                Sincroniza mods populares de todas las fuentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Actualiza automáticamente todos los mods en tu base de datos desde sus respectivas fuentes.
              </p>
              <p className="text-xs text-muted-foreground mt-2 italic">
                (Próximamente)
              </p>
            </CardContent>
            <CardFooter>
              <Button disabled>
                Sincronización Masiva
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
