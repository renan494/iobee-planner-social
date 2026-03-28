import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ClientFilterProps {
  clients: string[];
  selected: string;
  onChange: (value: string) => void;
}

export function ClientFilter({ clients, selected, onChange }: ClientFilterProps) {
  return (
    <Select value={selected} onValueChange={onChange}>
      <SelectTrigger className="w-[220px] bg-card">
        <SelectValue placeholder="Filtrar por cliente" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos os clientes</SelectItem>
        {clients.map((c) => (
          <SelectItem key={c} value={c}>
            {c}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
