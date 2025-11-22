"use client";

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  Card,
  CardBody,
} from "@nextui-org/react";
import { Plus, ExternalLink } from "lucide-react";
import Image from "next/image";

interface ConnectAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AccountOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  action: () => void;
  available: boolean;
}

export const ConnectAccountModal = ({
  isOpen,
  onClose,
}: ConnectAccountModalProps) => {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectRiot = () => {
    setIsConnecting(true);
    // Redirigir al flujo OAuth de Riot
    window.location.href = "/api/riot/login";
  };

  const accountOptions: AccountOption[] = [
    {
      id: "league_of_legends",
      name: "League of Legends",
      description:
        "Conecta tu cuenta de Riot Games para mostrar tus estadísticas",
      icon: "/images/lol-icon.png",
      color: "#C89B3C",
      action: handleConnectRiot,
      available: true,
    },
    {
      id: "twitch",
      name: "Twitch",
      description: "Próximamente disponible",
      icon: "/images/twitch-icon.png",
      color: "#9146FF",
      action: () => {},
      available: false,
    },
    {
      id: "discord",
      name: "Discord",
      description: "Próximamente disponible",
      icon: "/images/discord-icon.png",
      color: "#5865F2",
      action: () => {},
      available: false,
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
      backdrop="blur"
      classNames={{
        backdrop: "backdrop-blur-sm bg-black/10",
        base: "bg-white dark:bg-black amoled:bg-black border border-gray-200 dark:border-slate-800",
        header: "border-b border-gray-200 dark:border-slate-800",
        body: "py-6",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Conectar Cuenta
          </h2>
          <p className="text-sm font-normal text-gray-600 dark:text-gray-400">
            Selecciona la plataforma que deseas conectar
          </p>
        </ModalHeader>
        <ModalBody>
          <div className="grid grid-cols-1 gap-3">
            {accountOptions.map((option) => (
              <Card
                key={option.id}
                isPressable={option.available}
                isDisabled={!option.available}
                className={`
                  bg-white dark:bg-slate-900 amoled:bg-slate-950
                  border border-gray-200 dark:border-slate-700
                  ${
                    option.available
                      ? "hover:border-blue-500 dark:hover:border-blue-400 cursor-pointer hover:shadow-lg transition-all"
                      : "opacity-50 cursor-not-allowed"
                  }
                `}
                onPress={option.available ? option.action : undefined}
              >
                <CardBody className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Icono de la plataforma */}
                    <div
                      className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: `${option.color}20`,
                      }}
                    >
                      <div className="w-10 h-10 relative">
                        {option.id === "league_of_legends" ? (
                          <svg
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-full h-full"
                            style={{ color: option.color }}
                          >
                            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm-1 3v14l-6-7 6-7zm2 0l6 7-6 7V5z" />
                          </svg>
                        ) : (
                          <div
                            className="w-full h-full rounded-full"
                            style={{ backgroundColor: option.color }}
                          />
                        )}
                      </div>
                    </div>

                    {/* Información */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                        {option.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {option.description}
                      </p>
                    </div>

                    {/* Botón de acción */}
                    {option.available && (
                      <ExternalLink className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          {/* Nota informativa */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-400">
              <strong>Nota:</strong> Al conectar tu cuenta, serás redirigido a
              la página oficial de la plataforma para autorizar el acceso.
            </p>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
