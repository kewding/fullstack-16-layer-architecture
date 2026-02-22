import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PhilippinePeso } from 'lucide-react';

//again make sure to separate and adjust
const amount: number = 1250.0;
const topupAmount: number = 500.0;

//format with peso
const formatAmount = (val: number) => {
  const [whole, decimal] = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(val)
    .split('.');

  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="self-center">
        <PhilippinePeso className="size-[1em] shrink-0 font-semibold" />
      </span>
      <span>{whole}</span>
      <span className="text-muted-foreground text-2xl">.{decimal}</span>
    </span>
  );
};

//smaller gap
const formatAmountSmallGap = (val: number) => {
  const [whole, decimal] = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(val)
    .split('.');

  return (
    <span className="inline-flex items-baseline gap-0">
      <span className="self-center">
        {' '}
        <PhilippinePeso className="size-[1em] shrink-0 relative font-semibold" />
      </span>
      <span>{whole}</span>
      <span className="text-muted-foreground">.{decimal}</span>
    </span>
  );
};

const now = new Date();

//formatting date to: "2, Feb 2026"
const localFormattedDate = now.toLocaleDateString('en-GB', {
  day: 'numeric', // "Day"
  month: 'short', // "Month"
  year: 'numeric', // "Year"
});

export function UserBalanceSection() {
  return (
    <div>
      <Card className="@container/card">
        <CardHeader className="flex flex-col gap-0">
          <div className="">
            <CardDescription>Current Balance</CardDescription>
            <CardTitle className="text-3xl font-semi tabular-nums @[250px]/card:text-3xl">
              {formatAmount(amount)}
            </CardTitle>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start text-sm">
          <div className="line-clamp-1 flex gap-1 font-medium">
            Last Top-up:
            <span className="text-muted-foreground">{formatAmountSmallGap(topupAmount)}</span>
          </div>
          <div className="text-xs text-muted-foreground">{localFormattedDate}</div>{' '}
          {/* make sure to edit this */}
        </CardFooter>
      </Card>
    </div>
  );
}
