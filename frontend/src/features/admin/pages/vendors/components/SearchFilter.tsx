import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export function SearchFilter() {
  return (
    <div className="relative w-full max-w-sm">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Search className="h-4 w-4 text-muted-foreground" />
      </div>

      <Input type="text" id="searchFilter" placeholder="Search Transaction" className="pl-10" />
    </div>
  );
}
