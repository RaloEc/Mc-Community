import { Mod } from '@/types';
import { ModCard } from './ModCard';

export function ModsList({ mods }: { mods: Mod[] }) {
  if (!mods || mods.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-muted-foreground">No se encontraron mods</h3>
        <p className="text-sm text-muted-foreground mt-2">Intenta con otros filtros o vuelve más tarde</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {mods.map((mod) => (
        <ModCard key={mod.id} mod={mod} />
      ))}
    </div>
  );
}
