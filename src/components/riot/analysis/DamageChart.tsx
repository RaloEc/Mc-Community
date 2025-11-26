"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crosshair } from "lucide-react";

interface DamageChartProps {
  participants: any[];
  teamId: number; // 100 or 200
}

export function DamageChart({ participants, teamId }: DamageChartProps) {
  const data = participants
    .filter((p) => p.teamId === teamId)
    .map((p) => ({
      name: p.championName,
      value: p.totalDamageDealtToChampions,
      summonerName: p.summonerName,
    }))
    .sort((a, b) => b.value - a.value);

  const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-slate-700 p-2 rounded shadow-xl text-xs text-white">
          <p className="font-bold mb-1">{data.name}</p>
          <p className="text-slate-300">{data.summonerName}</p>
          <p className="text-red-400 font-mono">
            {data.value.toLocaleString()} Daño
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-slate-900/30 border-slate-800">
      <CardHeader>
        <CardTitle className="text-lg text-white flex items-center gap-2">
          <Crosshair className="w-5 h-5 text-red-500" />
          Distribución de Daño
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full h-[300px] min-w-0">
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={200}
            minHeight={200}
          >
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value, entry: any) => (
                  <span className="text-slate-300 text-xs ml-1">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
