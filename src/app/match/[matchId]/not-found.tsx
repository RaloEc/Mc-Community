import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 p-4 text-center">
      <div className="bg-slate-900/50 p-6 rounded-full">
        <FileQuestion className="w-16 h-16 text-slate-500" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Partida no encontrada</h1>
        <p className="text-slate-400 max-w-md">
          No pudimos encontrar la partida que buscas. Es posible que el ID sea
          incorrecto o que la partida no haya sido sincronizada aún.
        </p>
      </div>
      <Button asChild variant="outline" className="gap-2">
        <Link href="/perfil">
          <ArrowLeft className="w-4 h-4" />
          Volver al perfil
        </Link>
      </Button>
    </div>
  );
}
