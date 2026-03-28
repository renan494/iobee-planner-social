import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { type ViewMode, VIEW_LABELS } from "@/types/calendar";

interface ViewModeSwitcherProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

const modes: ViewMode[] = ["day", "week", "month", "quarter", "year"];

export function ViewModeSwitcher({ value, onChange }: ViewModeSwitcherProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as ViewMode)}
      className="rounded-lg border bg-card p-0.5"
    >
      {modes.map((m) => (
        <ToggleGroupItem
          key={m}
          value={m}
          size="sm"
          className="px-3 text-xs font-semibold data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          {VIEW_LABELS[m]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
