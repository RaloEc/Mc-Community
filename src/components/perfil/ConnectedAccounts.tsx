'use client'

import { useState } from 'react'
import { Twitch, MessageCircle, Gamepad2, Zap, Radio, ChevronDown } from 'lucide-react'
import { ConnectedAccountsData, AccountPlatform } from '@/hooks/useConnectedAccounts'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ConnectedAccountsProps {
  accounts: ConnectedAccountsData
  isOwnProfile?: boolean
  userColor?: string
}

const getPlatformIcon = (platform: AccountPlatform) => {
  const iconProps = { className: 'w-5 h-5' }
  
  switch (platform) {
    case 'twitch':
      return <Twitch {...iconProps} />
    case 'discord':
      return <MessageCircle {...iconProps} />
    case 'league_of_legends':
      return <Gamepad2 {...iconProps} />
    case 'valorant':
      return <Zap {...iconProps} />
    case 'kick':
      return <Radio {...iconProps} />
    case 'delta_force':
      return <Gamepad2 {...iconProps} />
    default:
      return null
  }
}

const getPlatformLabel = (platform: AccountPlatform): string => {
  const labels: Record<AccountPlatform, string> = {
    twitch: 'Twitch',
    discord: 'Discord',
    league_of_legends: 'League of Legends',
    valorant: 'Valorant',
    kick: 'Kick',
    delta_force: 'Delta Force'
  }
  return labels[platform]
}

const getPlatformColor = (platform: AccountPlatform): string => {
  const colors: Record<AccountPlatform, string> = {
    twitch: '#9146FF',
    discord: '#5865F2',
    league_of_legends: '#0A8BD9',
    valorant: '#FA4454',
    kick: '#00D084',
    delta_force: '#FF6B35'
  }
  return colors[platform]
}

const AccountCard = ({ platform, username }: { platform: string; username: string }) => (
  <div
    className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all hover:shadow-md"
    style={{
      borderColor: `${getPlatformColor(platform as AccountPlatform)}40`,
      backgroundColor: `${getPlatformColor(platform as AccountPlatform)}10`
    }}
  >
    <div style={{ color: getPlatformColor(platform as AccountPlatform) }}>
      {getPlatformIcon(platform as AccountPlatform)}
    </div>
    <div className="flex flex-col">
      <span className="text-xs font-medium text-muted-foreground">
        {getPlatformLabel(platform as AccountPlatform)}
      </span>
      <span className="text-sm font-semibold text-foreground">
        {username}
      </span>
    </div>
  </div>
)

export const ConnectedAccounts = ({ 
  accounts, 
  isOwnProfile = false, 
  userColor 
}: ConnectedAccountsProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Parsear accounts si es string JSON
  let parsedAccounts: ConnectedAccountsData = {};
  if (accounts) {
    if (typeof accounts === 'string') {
      try {
        parsedAccounts = JSON.parse(accounts);
      } catch (e) {
        console.error('[ConnectedAccounts] Error parsing accounts:', e);
        parsedAccounts = {};
      }
    } else if (typeof accounts === 'object') {
      parsedAccounts = accounts;
    }
  }

  const accountsArray = Object.entries(parsedAccounts || {})
  const hasAccounts = accountsArray.length > 0
  const hasMoreThanTwo = accountsArray.length > 2

  if (!hasAccounts && !isOwnProfile) {
    return null
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Cuentas Conectadas
      </h3>

      {hasAccounts ? (
        <>
          {/* Desktop: mostrar todas */}
          <div className="hidden md:flex flex-wrap gap-2">
            {accountsArray.map(([platform, username]) => (
              <AccountCard key={platform} platform={platform} username={username} />
            ))}
          </div>

          {/* Mobile: Avatar Group con desplegable */}
          <div className="md:hidden">
            <div className="flex items-center gap-3">
              {/* Avatar Group */}
              <div className="flex items-center -space-x-2">
                {accountsArray.map(([platform, username]) => (
                  <Avatar key={platform} className="h-8 w-8 border-2 border-background dark:border-gray-950">
                    <AvatarFallback
                      style={{
                        backgroundColor: getPlatformColor(platform as AccountPlatform),
                      }}
                      className="flex items-center justify-center text-white"
                    >
                      <div style={{ color: 'white' }}>
                        {getPlatformIcon(platform as AccountPlatform)}
                      </div>
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              
              {/* Dropdown trigger */}
              <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity">
                    <span className="text-xs font-medium text-muted-foreground">
                      {accountsArray.length} plataforma{accountsArray.length !== 1 ? 's' : ''}
                    </span>
                    <ChevronDown 
                      className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                        isDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {accountsArray.map(([p, u]) => (
                    <DropdownMenuItem key={p} disabled>
                      <div className="flex items-center gap-2 w-full">
                        <div style={{ color: getPlatformColor(p as AccountPlatform) }}>
                          {getPlatformIcon(p as AccountPlatform)}
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-xs font-medium text-muted-foreground">
                            {getPlatformLabel(p as AccountPlatform)}
                          </span>
                          <span className="text-sm font-semibold text-foreground truncate">
                            {u}
                          </span>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </>
      ) : isOwnProfile ? (
        <p className="text-xs text-muted-foreground italic">
          No tienes cuentas conectadas. ¡Agrega una!
        </p>
      ) : null}
    </div>
  )
}
