"use client";

import { useState } from "react";
import { Button, Input, Select, SelectItem } from "@nextui-org/react";
import { X, Plus, Link as LinkIcon } from "lucide-react";
import {
  AccountPlatform,
  ConnectedAccountsData,
  PLATFORM_LABELS,
  PLATFORM_PLACEHOLDERS,
} from "@/hooks/useConnectedAccounts";
import { ConnectAccountModal } from "./ConnectAccountModal";

interface ConnectedAccountsFormProps {
  accounts: ConnectedAccountsData;
  onChange: (accounts: ConnectedAccountsData) => void;
}

const PLATFORMS: AccountPlatform[] = [
  "twitch",
  "discord",
  "league_of_legends",
  "valorant",
  "kick",
  "delta_force",
];

export const ConnectedAccountsForm = ({
  accounts,
  onChange,
}: ConnectedAccountsFormProps) => {
  const [expandedPlatforms, setExpandedPlatforms] = useState<
    Set<AccountPlatform>
  >(new Set());
  const [selectedPlatform, setSelectedPlatform] =
    useState<AccountPlatform | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddClick = () => {
    if (selectedPlatform) {
      setExpandedPlatforms((prev) => new Set(prev).add(selectedPlatform));
      setInputValue(accounts[selectedPlatform] || "");
    }
  };

  const handleSaveAccount = (platform: AccountPlatform) => {
    if (inputValue.trim()) {
      onChange({
        ...accounts,
        [platform]: inputValue.trim(),
      });
      setExpandedPlatforms((prev) => {
        const next = new Set(prev);
        next.delete(platform);
        return next;
      });
      setInputValue("");
      setSelectedPlatform(null);
    }
  };

  const handleRemoveAccount = (platform: AccountPlatform) => {
    const updated = { ...accounts };
    delete updated[platform];
    onChange(updated);
    setExpandedPlatforms((prev) => {
      const next = new Set(prev);
      next.delete(platform);
      return next;
    });
  };

  const handleCancel = () => {
    setExpandedPlatforms(new Set());
    setInputValue("");
    setSelectedPlatform(null);
  };

  const connectedPlatforms = Object.keys(accounts) as AccountPlatform[];
  const availablePlatforms = PLATFORMS.filter(
    (p) => !connectedPlatforms.includes(p)
  );

  return (
    <div className="space-y-4">
      {/* Cuentas conectadas */}
      {connectedPlatforms.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Cuentas conectadas:
          </p>
          <div className="space-y-2">
            {connectedPlatforms.map((platform) => (
              <div
                key={platform}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {PLATFORM_LABELS[platform]}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {accounts[platform]}
                  </p>
                </div>
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  onClick={() => handleRemoveAccount(platform)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulario para agregar cuenta */}
      {availablePlatforms.length > 0 && (
        <div className="space-y-3 p-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-900/30">
          {!selectedPlatform ? (
            <Button
              fullWidth
              variant="flat"
              color="primary"
              startContent={<Plus className="w-4 h-4" />}
              onPress={() => setSelectedPlatform(availablePlatforms[0])}
            >
              Agregar Cuenta
            </Button>
          ) : (
            <div className="space-y-3">
              <Select
                label="Plataforma"
                selectedKeys={selectedPlatform ? [selectedPlatform] : []}
                onChange={(e) => {
                  setSelectedPlatform(e.target.value as AccountPlatform);
                  setInputValue(
                    accounts[e.target.value as AccountPlatform] || ""
                  );
                }}
                size="sm"
              >
                {availablePlatforms.map((platform) => (
                  <SelectItem key={platform} value={platform}>
                    {PLATFORM_LABELS[platform]}
                  </SelectItem>
                ))}
              </Select>

              <Input
                label="Usuario"
                placeholder={
                  selectedPlatform
                    ? PLATFORM_PLACEHOLDERS[selectedPlatform]
                    : "Ingresa tu usuario"
                }
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                size="sm"
              />

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="light"
                  onPress={handleCancel}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  color="primary"
                  onPress={() => handleSaveAccount(selectedPlatform)}
                  disabled={!inputValue.trim()}
                  className="flex-1"
                >
                  Guardar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {availablePlatforms.length === 0 && connectedPlatforms.length > 0 && (
        <p className="text-sm text-gray-600 dark:text-gray-400 italic">
          Todas las plataformas están conectadas
        </p>
      )}

      {/* Botón para conectar cuentas OAuth */}
      <div className="pt-2">
        <Button
          fullWidth
          variant="bordered"
          color="primary"
          startContent={<LinkIcon className="w-4 h-4" />}
          onPress={() => setIsModalOpen(true)}
          className="border-dashed"
        >
          Conectar League of Legends
        </Button>
      </div>

      {/* Modal de conexión de cuentas */}
      <ConnectAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
