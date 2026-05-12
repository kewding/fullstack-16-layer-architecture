import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface SearchFilterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchFilter({
  value,
  onChange,
  placeholder = 'Search by name…',
}: SearchFilterProps) {
  return (
    <div className="relative w-full sm:w-[280px]">
      <Search
        className="
        absolute left-3 top-1/2
        size-4 -translate-y-1/2
        text-muted-foreground
        pointer-events-none
      "
      />

      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
        h-11 pl-9 bg-white
        border-[hsl(var(--border))]
      "
      />
    </div>
  );
}
