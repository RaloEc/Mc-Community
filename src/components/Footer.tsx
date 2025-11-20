"use client";

export function Footer() {
  return (
    <footer className="mt-16 py-8 border-t border-slate-200 dark:border-slate-800 amoled:border-slate-800 bg-white dark:bg-black amoled:bg-black">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="space-y-4">
          {/* Disclaimer Legal de Riot Games */}
          <div className="text-xs text-slate-500 dark:text-slate-400 amoled:text-slate-400 leading-relaxed">
            <p className="mb-2 font-semibold text-slate-600 dark:text-slate-300 amoled:text-slate-300">
              Legal Jibber Jabber
            </p>
            <p>
              BitArena no está afiliado a Riot Games, Inc. League of Legends,
              Valorant, Teamfight Tactics, Legends of Runeterra y todos los
              activos relacionados son propiedad intelectual de Riot Games, Inc.
              y están protegidos por derechos de autor. BitArena es un proyecto
              comunitario independiente que utiliza datos públicos de las APIs
              de Riot Games de conformidad con sus Términos de Servicio.
            </p>
            <p className="mt-2">
              Riot Games es una marca registrada de Riot Games, Inc. Todos los
              derechos reservados.
            </p>
          </div>

          {/* Separador */}
          <div className="border-t border-slate-200 dark:border-slate-800 amoled:border-slate-800 pt-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 amoled:text-slate-400 text-center">
              © 2024 BitArena. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
