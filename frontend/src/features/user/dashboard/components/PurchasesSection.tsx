import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MOCK_PURCHASE_HISTORY } from '../../user-constants/mockPurchases';

const userID: string = '6f92021a-1015-4999-b14a-d68377778b4d';

//format without peso
// const formatAmount = (val: number) => {
//   const [whole, decimal] = new Intl.NumberFormat('en-US', {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   })
//     .format(val)
//     .split('.');

//   return (
//     <span className="inline-flex items-baseline gap-0">
//       <span>-{whole}</span>
//       <span className="text-muted-foreground text-[0.8em]">.{decimal}</span>
//     </span>
//   );
// };

export function UserPurchasesSection() {
  // 1. Find the specific user data
  const userData = MOCK_PURCHASE_HISTORY.find((u) => u.id === userID);

  // Helper for formatting date to: " 2, Feb 2026"
  const formatDate = (date: Date) => {
    return date
      .toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
      .replace(',', '');
  };

  return (
    <div className='flex flex-col h-full'>
      <Card className="@container/card">
        <CardHeader className='pb-2'>
          <CardTitle className="flex flex-row justify-between text-2xl font-semibold">
            Purchases
            <Button variant="ghost" className="bg-transparent text-muted-foreground">
              See All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* 2. Map through the purchases array */}
          {userData?.purchases.map((purchase, index) => (
            <Card
              key={index}
              className="flex flex-row justify-between border-none shadow-none bg-muted/30"
            >
              <div className="flex flex-row items-center gap-2">
                {/* Image Placeholder */}
                <div className="size-12 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                  <img
                    src={purchase.foodimage}
                    alt={purchase.foodname}
                    className="object-cover size-full"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-base font-medium leading-none">{purchase.foodname}</span>
                  <span className="text-xs text-muted-foreground">{purchase.stallname}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                {/* Using your formatAmount logic */}
                <span className="text-lg font-semibold tabular-nums">
                  - {purchase.amountspent}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-tight">
                  {formatDate(purchase.date)}
                </span>
              </div>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
