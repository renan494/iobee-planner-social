import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AnalystFilterProps {
  analysts: string[];
  selected: string;
  onChange: (value: string) => void;
}

export function AnalystFilter({ analysts, selected, onChange }: AnalystFilterProps) {
  return (
    <Select value={selected} onValueChange={onChange}>
      <SelectTrigger className="w-[200px] bg-card">
        <SelectValue placeholder="Filtrar por analista" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos os analistas</SelectItem>
        {analysts.filter(a => a && a.trim() !== "").map((a) => (
          <SelectItem key={a} value={a}>
            {a}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
