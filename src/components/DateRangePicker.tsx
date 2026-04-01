import { useState } from "react";
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, ChevronDown } from "lucide-react";
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

const PRESETS = [
  { label: "Hoje", range: () => [today(), today()] },
  { label: "Ontem", range: () => { const d = subDays(today(), 1); return [d, d]; } },
  { label: "7 dias atrás", range: () => [subDays(today(), 6), today()] },
  { label: "14 dias atrás", range: () => [subDays(today(), 13), today()] },
  { label: "Este mês", range: () => [startOfMonth(today()), endOfMonth(today())] },
  { label: "30 dias atrás", range: () => [subDays(today(), 29), today()] },
  { label: "Último mês", range: () => { const d = subMonths(today(), 1); return [startOfMonth(d), endOfMonth(d)]; } },
  { label: "Todo o período", range: () => [null, null] as [null, null] },
] as const;

export function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [activePreset, setActivePreset] = useState("Todo o período");

  const handlePreset = (label: string, range: () => [Date | null, Date | null]) => {
    const [s, e] = range();
    setActivePreset(label);
    if (!s || !e) {
      onChange("", "");
    } else {
      onChange(fmt(s), fmt(e));
    }
    setOpen(false);
  };

  const displayLabel = () => {
    if (!startDate && !endDate) return "Todo o período";
    const s = startDate ? format(new Date(startDate + "T12:00:00"), "dd/MM/yyyy") : "";
    const e = endDate ? format(new Date(endDate + "T12:00:00"), "dd/MM/yyyy") : "";
    if (s === e) return s;
    return `${s} — ${e}`;
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

  const selectedRange = () => {
    const dates: Date[] = [];
    if (startDate) dates.push(new Date(startDate + "T12:00:00"));
    if (endDate) dates.push(new Date(endDate + "T12:00:00"));
    return dates;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 gap-2 text-sm font-normal">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span>{displayLabel()}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 flex" align="end" sideOffset={8}>
        {/* Presets */}
        <div className="border-r border-border p-2 min-w-[180px]">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => handlePreset(p.label, p.range as () => [Date | null, Date | null])}
              className={cn(
                "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
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
  );
}
