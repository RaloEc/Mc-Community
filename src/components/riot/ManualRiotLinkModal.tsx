"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Loader2,
  LinkIcon,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

interface ManualRiotLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void | Promise<void>;
}

interface SearchResult {
  puuid: string;
  gameName: string;
  tagLine: string;
  profileIconId: number;
  summonerLevel: number;
  tier: string | null;
  rank: string | null;
  leaguePoints: number;
  wins: number;
  losses: number;
}

interface AccountPreview {
  puuid: string;
  gameName: string;
  tagLine: string;
  summonerLevel?: number;
  profileIconId?: number;
  soloTier?: string;
  soloRank?: string;
}

const REGIONS = [
  { value: "la1", label: "LAN (Latinoamérica Norte)" },
  { value: "la2", label: "LAS (Latinoamérica Sur)" },
  { value: "na1", label: "NA (Norteamérica)" },
  { value: "br1", label: "BR (Brasil)" },
  { value: "euw1", label: "EUW (Europa Oeste)" },
  { value: "eun1", label: "EUNE (Europa Este)" },
  { value: "kr", label: "KR (Corea)" },
  { value: "jp1", label: "JP (Japón)" },
];

const ROUTING_REGIONS: Record<string, string> = {
  la1: "americas",
  la2: "americas",
  na1: "americas",
  br1: "americas",
  euw1: "europe",
  eun1: "europe",
  kr: "asia",
  jp1: "asia",
};

export function ManualRiotLinkModal({
  isOpen,
  onClose,
  onSuccess,
}: ManualRiotLinkModalProps) {
  const [gameName, setGameName] = useState("");
  const [tagLine, setTagLine] = useState("");
  const [region, setRegion] = useState("la1");
  const [isSearching, setIsSearching] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const routingRegion = ROUTING_REGIONS[region] || "americas";

  const handleSearch = async () => {
    if (!gameName.trim() || !tagLine.trim()) {
      setError("Ingresa el nombre y tag de la cuenta");
      return;
    }

    setIsSearching(true);
    setError(null);
    setSearchResult(null);

    try {
      const response = await fetch(
        `/api/riot/account/search?gameName=${encodeURIComponent(
          gameName
        )}&tagLine=${encodeURIComponent(
          tagLine
        )}&region=${routingRegion}&platformRegion=${region}`
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al buscar la cuenta");
        return;
      }

      setSearchResult(data);
    } catch (err) {
      console.error("[ManualRiotLinkModal] Error en búsqueda:", err);
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleLink = async () => {
    if (!searchResult) return;

    setIsLinking(true);
    setError(null);

    try {
      const response = await fetch("/api/riot/account/link-manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          puuid: searchResult.puuid,
          gameName: searchResult.gameName,
          tagLine: searchResult.tagLine,
          region,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al vincular la cuenta");
        return;
      }

      toast.success("¡Cuenta vinculada exitosamente!");

      // Cerrar modal primero
      handleClose();

      // Luego llamar al callback para invalidar caché y refetch
      // Usar await para asegurar que complete antes de continuar
      if (onSuccess) {
        await onSuccess();
      }
    } catch (err) {
      console.error("[ManualRiotLinkModal] Error al vincular:", err);
      setError("Error de conexión. Intenta de nuevo.");
      setIsLinking(false);
    }
  };

  const handleClose = () => {
    setGameName("");
    setTagLine("");
    setRegion("la1");
    setSearchResult(null);
    setError(null);
    onClose();
  };

  const getProfileIconUrl = (iconId: number) => {
    return `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${iconId}.jpg`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-blue-500" />
            Vincular Cuenta de Riot
          </DialogTitle>
          <DialogDescription>
            Busca tu cuenta de League of Legends por nombre e ID.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Inputs de búsqueda */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="gameName">Nombre</Label>
              <Input
                id="gameName"
                placeholder="Invocador"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                disabled={isSearching || isLinking}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagLine">Tag</Label>
              <Input
                id="tagLine"
                placeholder="LAN"
                value={tagLine}
                onChange={(e) => setTagLine(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                disabled={isSearching || isLinking}
              />
            </div>
          </div>

          {/* Selector de región */}
          <div className="space-y-2">
            <Label>Región</Label>
            <Select
              value={region}
              onValueChange={setRegion}
              disabled={isSearching || isLinking}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona región" />
              </SelectTrigger>
              <SelectContent>
                {REGIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botón de búsqueda */}
          <Button
            onClick={handleSearch}
            disabled={
              isSearching || isLinking || !gameName.trim() || !tagLine.trim()
            }
            className="w-full"
            variant="secondary"
          >
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Buscar Cuenta
              </>
            )}
          </Button>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Resultado de búsqueda */}
          {searchResult && (
            <div className="p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-blue-500/30">
                  <img
                    src={getProfileIconUrl(searchResult.profileIconId)}
                    alt="Ícono de perfil"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        getProfileIconUrl(29);
                    }}
                  />
                  {/* Badge de nivel */}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-slate-900 border border-blue-500/50 rounded px-1.5 py-0.5 text-xs font-bold text-white">
                    {searchResult.summonerLevel}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white text-lg">
                    {searchResult.gameName}
                    <span className="text-slate-400">
                      #{searchResult.tagLine}
                    </span>
                  </p>
                  <p className="text-xs text-slate-400">
                    {REGIONS.find((r) => r.value === region)?.label}
                  </p>
                  {/* Mostrar rango si existe */}
                  {searchResult.tier && searchResult.rank ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-medium text-amber-400">
                        {searchResult.tier} {searchResult.rank}
                      </span>
                      <span className="text-xs text-slate-400">
                        {searchResult.leaguePoints} LP
                      </span>
                      <span className="text-xs text-slate-500">
                        ({searchResult.wins}W {searchResult.losses}L)
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 mt-1">Sin rango</p>
                  )}
                </div>
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
              </div>

              <Button
                onClick={handleLink}
                disabled={isLinking}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isLinking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Vinculando...
                  </>
                ) : (
                  <>
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Vincular esta Cuenta
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
