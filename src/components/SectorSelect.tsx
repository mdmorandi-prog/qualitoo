import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSectors } from "@/hooks/useSectors";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  includeAll?: boolean;
  allLabel?: string;
  allValue?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Unified sector dropdown backed by public.sectors.
 * Legacy free-text values automatically appear as options if not present in the table.
 */
export const SectorSelect = ({
  value, onChange, placeholder = "Selecione um setor",
  includeAll = false, allLabel = "Todos os setores", allValue = "__all__",
  disabled, className,
}: Props) => {
  const { sectors, loading } = useSectors(true);

  const options = sectors.map(s => s.name);
  // Preserve legacy value if it doesn't exist in the current sector list
  if (value && value !== allValue && !options.includes(value)) {
    options.push(value);
  }

  return (
    <Select value={value || undefined} onValueChange={onChange} disabled={disabled || loading}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={loading ? "Carregando..." : placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {includeAll && <SelectItem value={allValue}>{allLabel}</SelectItem>}
        {options.map(name => (
          <SelectItem key={name} value={name}>{name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
