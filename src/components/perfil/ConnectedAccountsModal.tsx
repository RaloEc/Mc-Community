'use client'

import { useState, useEffect } from 'react'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
} from '@nextui-org/react'
import { X } from 'lucide-react'
import { 
  AccountPlatform, 
  ConnectedAccountsData, 
  PLATFORM_LABELS,
  PLATFORM_PLACEHOLDERS 
} from '@/hooks/useConnectedAccounts'
import { useConnectedAccounts } from '@/hooks/useConnectedAccounts'

interface ConnectedAccountsModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  onSave?: () => void
}

const PLATFORMS: AccountPlatform[] = [
  'twitch',
  'discord',
  'league_of_legends',
  'valorant',
  'kick',
  'delta_force'
]

export const ConnectedAccountsModal = ({
  isOpen,
  onClose,
  userId,
  onSave
}: ConnectedAccountsModalProps) => {
  const { accounts, loading, addOrUpdateAccount, removeAccount, fetchAccounts } = useConnectedAccounts(userId)
  const [localAccounts, setLocalAccounts] = useState<ConnectedAccountsData>(accounts)
  const [isSaving, setIsSaving] = useState(false)

  // Sincronizar cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      fetchAccounts()
    }
  }, [isOpen, fetchAccounts])

  // Actualizar localAccounts cuando accounts cambia
  useEffect(() => {
    setLocalAccounts(accounts)
  }, [accounts])

  const handleInputChange = (platform: AccountPlatform, value: string) => {
    setLocalAccounts(prev => ({
      ...prev,
      [platform]: value || undefined
    }))
  }

  const handleRemoveAccount = async (platform: AccountPlatform) => {
    const success = await removeAccount(platform)
    if (success) {
      setLocalAccounts(prev => {
        const updated = { ...prev }
        delete updated[platform]
        return updated
      })
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      // Detectar cambios y guardar
      const platformsToUpdate = PLATFORMS.filter(platform => {
        const oldValue = accounts[platform]
        const newValue = localAccounts[platform]
        return oldValue !== newValue
      })

      for (const platform of platformsToUpdate) {
        const newValue = localAccounts[platform]
        if (newValue) {
          await addOrUpdateAccount(platform, newValue)
        } else if (accounts[platform]) {
          await removeAccount(platform)
        }
      }

      onSave?.()
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
      backdrop="blur"
      classNames={{
        base: "bg-white dark:bg-black amoled:bg-black",
        header: "border-b border-gray-200 dark:border-gray-800 amoled:border-gray-800",
        body: "bg-white dark:bg-black amoled:bg-black",
        footer: "bg-white dark:bg-black amoled:bg-black border-t border-gray-200 dark:border-gray-800 amoled:border-gray-800",
        backdrop: "backdrop-blur-sm bg-black/10",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 amoled:text-gray-100">
            Cuentas Conectadas
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 amoled:text-gray-400 font-normal">
            Agrega tus cuentas de redes sociales y plataformas de juegos
          </p>
        </ModalHeader>

        <ModalBody className="overflow-y-auto max-h-[50vh]">
          <div className="space-y-4">
            {PLATFORMS.map(platform => (
              <div key={platform} className="flex items-end gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 amoled:border-gray-700 bg-gray-50 dark:bg-gray-900/50 amoled:bg-gray-900/50">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block text-gray-800 dark:text-gray-200 amoled:text-gray-200">
                    {PLATFORM_LABELS[platform] || platform}
                  </label>
                  <Input
                    placeholder={PLATFORM_PLACEHOLDERS[platform]}
                    value={localAccounts[platform] || ''}
                    onChange={(e) => handleInputChange(platform, e.target.value)}
                    disabled={loading || isSaving}
                    size="sm"
                    className="text-sm"
                  />
                </div>
                
                {localAccounts[platform] && (
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    onClick={() => handleRemoveAccount(platform)}
                    disabled={loading || isSaving}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            color="danger"
            variant="light"
            onPress={onClose}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            color="primary"
            onPress={handleSave}
            disabled={isSaving || loading}
            isLoading={isSaving}
          >
            Guardar Cambios
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
