import { TrsansactionsTabFilter } from './TabFilter';

export function NavigationSection() {
  return (
    <div className="grid w-full gap-4 grid-rows-4 lg:grid-rows-1 lg:grid-flow-col justify-between">
      <TrsansactionsTabFilter />
      <div>asdbasdhjh</div>
      {/* Note: Grid rows only work visually if you have enough items or 
        explicit grid-flow-col on large screens */}
    </div>
  );
}
