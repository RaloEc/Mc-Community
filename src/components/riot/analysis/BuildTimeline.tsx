"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getItemImg } from "@/lib/riot/helpers";

interface BuildTimelineProps {
  timeline: any;
  participantId: number;
  gameVersion?: string;
}

export function BuildTimeline({
  timeline,
  participantId,
  gameVersion,
}: BuildTimelineProps) {
  const buildGroups = useMemo(() => {
    if (!timeline || !timeline.info || !timeline.info.frames) return [];

    const groups: Record<number, any[]> = {};

    timeline.info.frames.forEach((frame: any) => {
      frame.events.forEach((event: any) => {
        if (
          event.type === "ITEM_PURCHASED" &&
          event.participantId === participantId
        ) {
          const minute = Math.floor(event.timestamp / 60000);
          if (!groups[minute]) {
            groups[minute] = [];
          }
          groups[minute].push(event);
        }
      });
    });

    return Object.entries(groups).map(([minute, events]) => ({
      minute: parseInt(minute),
      events,
    }));
  }, [timeline, participantId]);

  const totalMinutes = timeline?.info?.frames?.length || 30;

  return (
    <Card className="bg-slate-900/30 border-slate-800">
      <CardHeader>
        <CardTitle className="text-lg text-white flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-green-500" />
          Ruta de Armado
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-40 flex items-center mt-4">
          {/* Timeline Line */}
          <div className="absolute left-0 right-0 h-1 bg-slate-800 rounded-full top-1/2 -translate-y-1/2" />

          {/* Item Groups */}
          <div className="relative w-full h-full">
            {buildGroups.map((group) => {
              const position = (group.minute / totalMinutes) * 100;

              return (
                <div
                  key={group.minute}
                  className="absolute top-1/2 -translate-y-1/2 flex flex-col gap-1 items-center"
                  style={{
                    left: `${position}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  {/* Time Label */}
                  <div className="absolute -top-8 text-[10px] text-slate-500 font-mono whitespace-nowrap">
                    {group.minute}m
                  </div>

                  {/* Stacked Items */}
                  <div className="flex flex-col gap-1">
                    {group.events.map((event, idx) => (
                      <TooltipProvider key={`${group.minute}-${idx}`}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="w-8 h-8 border border-slate-700 rounded bg-slate-900 relative hover:scale-110 transition-transform z-10 hover:z-20">
                              <Image
                                src={getItemImg(event.itemId, gameVersion)!}
                                alt={`Item ${event.itemId}`}
                                fill
                                sizes="32px"
                                className="object-cover rounded"
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="bg-slate-900 border-slate-700 text-white">
                            <p>Minuto {group.minute}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-2 font-mono">
          <span>0 min</span>
          <span>{totalMinutes} min</span>
        </div>
      </CardContent>
    </Card>
  );
}
