import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

export function ExportSelectedData() {
  return (
    <Button variant="outline" className='text-black gap-2 p-3'>
      <Upload />
      <span>Export</span>
    </Button>
  );
}
