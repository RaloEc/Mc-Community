"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface LegalModalProps {
  trigger?: ReactNode;
}

export const LegalModal: React.FC<LegalModalProps> = ({ trigger }) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            Aviso legal
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Aviso legal
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                KoreStats no está afiliado a Riot Games, Inc. League of Legends,
                Valorant, Teamfight Tactics, Legends of Runeterra y todos los
                activos relacionados son propiedad intelectual de Riot Games,
                Inc. y están protegidos por derechos de autor.
              </p>
              <p>
                KoreStats es un proyecto comunitario independiente que utiliza
                datos públicos de las APIs de Riot Games de conformidad con sus
                Términos de Servicio.
              </p>
              <p>
                Riot Games es una marca registrada de Riot Games, Inc. Todos los
                derechos reservados.
              </p>
              <p>© 2024 KoreStats. Todos los derechos reservados.</p>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
