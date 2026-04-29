import { SidebarTrigger } from '@/components/ui/sidebar';

export function SiteHeader() {
  return (
    <header className="h-10 w-full shrink-0">
        <SidebarTrigger className="h-8 w-8" />
    </header>
  );
}
