import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfQuarter,
  endOfQuarter,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ViewMode } from "@/types/calendar";

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: ViewMode;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

function getLabel(date: Date, viewMode: ViewMode): string {
  switch (viewMode) {
    case "day":
      return format(date, "dd 'de' MMMM, yyyy", { locale: ptBR });
    case "week": {
      const ws = startOfWeek(date, { locale: ptBR });
      const we = endOfWeek(date, { locale: ptBR });
      return `${format(ws, "dd MMM", { locale: ptBR })} – ${format(we, "dd MMM yyyy", { locale: ptBR })}`;
    }
    case "month":
      return format(date, "MMMM yyyy", { locale: ptBR });
    case "quarter": {
      const qs = startOfQuarter(date);
      const qe = endOfQuarter(date);
      const qNum = Math.ceil((qs.getMonth() + 1) / 3);
      return `${qNum}º Trimestre ${format(qs, "yyyy")}`;
    }
    case "semester": {
      const semNum = date.getMonth() < 6 ? 1 : 2;
      return `${semNum}º Semestre ${format(date, "yyyy")}`;
    }
    case "year":
      return format(date, "yyyy");
  }
}

export function CalendarHeader({ currentDate, viewMode, onPrev, onNext, onToday }: CalendarHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" size="sm" onClick={onToday} className="text-sm font-medium">
        Hoje
      </Button>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPrev}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <h2 className="text-xl font-bold capitalize">{getLabel(currentDate, viewMode)}</h2>
    </div>
  );
}
