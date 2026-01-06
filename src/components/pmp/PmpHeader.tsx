import React from "react";
import { Bomb, CalendarRange } from "lucide-react";
import type { UrgencyInfo } from "@/types/pmp";

interface PmpHeaderProps {
  nomeObra: string;
  totalSemanas: number;
  urgencyInfo: UrgencyInfo;
}

export const PmpHeader = React.memo(function PmpHeader({
  nomeObra,
  totalSemanas,
  urgencyInfo,
}: PmpHeaderProps) {
  const {
    daysRemaining,
    urgencyBg,
    urgencyBorder,
    urgencyText,
    iconColor,
    statusLabel,
  } = urgencyInfo;

  return (
    <div className="flex flex-col md:flex-row justify-between items-end px-4 py-2 gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <CalendarRange className="h-6 w-6 text-primary" />
          PMP - Planejamento Mestre
        </h1>
        <p className="text-sm text-slate-500">
          {nomeObra} • {totalSemanas} semanas
        </p>
      </div>

      {daysRemaining !== null && (
        <div
          className={`flex items-center gap-3 px-5 py-3 rounded-lg border-2 ${urgencyBg} ${urgencyBorder} shadow-sm`}
        >
          <Bomb className={`h-6 w-6 ${iconColor}`} />
          <div>
            <span className={`text-[10px] font-black uppercase ${urgencyText}`}>
              {statusLabel}
            </span>
            <div className={`text-2xl font-black ${urgencyText}`}>
              {daysRemaining} DIAS
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
