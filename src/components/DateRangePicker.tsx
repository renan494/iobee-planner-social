import { useState } from "react";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
}

const today = () => new Date();
const fmt = (d: Date) => format(d, "yyyy-MM-dd");
const fmtDisplay = (d: Date) => format(d, "dd 'de' MMM. yyyy", { locale: ptBR });
const fmtShort = (d: Date) => format(d, "dd MMM.", { locale: ptBR });

type PresetFn = () => [Date, Date] | [null, null];

const PRESETS: { label: string; range: PresetFn }[] = [
  { label: "Hoje", range: () => [today(), today()] },
  { label: "Ontem", range: () => { const d = subDays(today(), 1); return [d, d]; } },
  { label: "7 dias atrás", range: () => [subDays(today(), 6), today()] },
  { label: "14 dias atrás", range: () => [subDays(today(), 13), today()] },
  { label: "Este mês", range: () => [startOfMonth(today()), endOfMonth(today())] },
  { label: "30 dias atrás", range: () => [subDays(today(), 29), today()] },
  { label: "Último mês", range: () => { const d = subMonths(today(), 1); return [startOfMonth(d), endOfMonth(d)]; } },
  { label: "Todo o período", range: () => [null, null] },
];

export function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [activePreset, setActivePreset] = useState("Todo o período");

  const handlePreset = (label: string, range: PresetFn) => {
    const [s, e] = range();
    setActivePreset(label);
    if (!s || !e) {
      onChange("", "");
    } else {
      onChange(fmt(s), fmt(e));
    }
    setOpen(false);
  };

  const displayRange = () => {
    if (!startDate && !endDate) return null;
    const s = new Date(startDate + "T12:00:00");
    const e = new Date(endDate + "T12:00:00");
    if (startDate === endDate) return fmtDisplay(s);
    return `${fmtShort(s)} a ${fmtDisplay(e)}`;
  };

  // Navigate range by shifting same duration forward/back
  const shiftRange = (dir: -1 | 1) => {
    if (!startDate || !endDate) return;
    const s = new Date(startDate + "T12:00:00");
    const e = new Date(endDate + "T12:00:00");
    const days = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const shift = days * dir;
    onChange(fmt(subDays(s, -shift)), fmt(subDays(e, -shift)));
    setActivePreset("Personalizado");
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (!date) return;
    const d = fmt(date);
    if (!startDate || (startDate && endDate)) {
      onChange(d, "");
      setActivePreset("Personalizado");
    } else {
      if (d < startDate) {
        onChange(d, startDate);
      } else {
        onChange(startDate, d);
      }
      setActivePreset("Personalizado");
    }
  };

  const rangeText = displayRange();

  return (
    <div className="flex items-center gap-1.5">
      {/* Preset label */}
      <span className="text-sm text-muted-foreground hidden sm:inline">{activePreset}</span>

      {/* Main button */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-9 gap-1.5 text-sm font-normal px-3">
            <span>{rangeText || "Todo o período"}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 flex" align="end" sideOffset={8}>
          {/* Presets sidebar */}
          <div className="border-r border-border py-2 min-w-[170px]">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => handlePreset(p.label, p.range)}
                className={cn(
                  "w-full px-4 py-2 text-left text-sm transition-colors",
                  activePreset === p.label
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground hover:bg-muted"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          {/* Calendar */}
          <div className="p-3">
            <Calendar
              mode="single"
              selected={startDate ? new Date(startDate + "T12:00:00") : undefined}
              onSelect={handleCalendarSelect}
              locale={ptBR}
              numberOfMonths={2}
              className="pointer-events-auto"
              modifiers={{
                range_start: startDate ? new Date(startDate + "T12:00:00") : new Date(0),
                range_end: endDate ? new Date(endDate + "T12:00:00") : new Date(0),
              }}
              modifiersClassNames={{
                range_start: "bg-primary text-primary-foreground rounded-full",
                range_end: "bg-primary text-primary-foreground rounded-full",
              }}
            />
          </div>
        </PopoverContent>
      </Popover>

      {/* Nav arrows */}
      {startDate && endDate && (
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => shiftRange(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => shiftRange(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
