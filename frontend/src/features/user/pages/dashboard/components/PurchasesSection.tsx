// src/features/user/pages/dashboard/components/PurchasesSection.tsx

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PurchaseItem } from '../services/dashboard.service';

interface UserPurchasesSectionProps {
  items: PurchaseItem[];
  loading: boolean;
  error: string | null;
}

const formatDate = (isoString: string): string => {
  return new Date(isoString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatAmount = (val: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};

export function UserPurchasesSection({ items, loading, error }: UserPurchasesSectionProps) {
  return (
    <div className="flex flex-col h-full">
      <Card className="@container/card">
        <CardHeader className="pb-2">
          <CardTitle className="flex flex-row justify-between text-2xl font-semibold">
            Purchases
            <Button variant="ghost" className="bg-transparent text-muted-foreground">
              See All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm animate-pulse">
              <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              Loading…
            </div>
          ) : error ? (
            <p className="text-red-500 text-sm">{error}</p>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground text-sm">No recent purchases.</p>
          ) : (
            items.map((item) => (
              <Card
                key={item.sale_item_id}
                className="flex flex-row justify-between border-none shadow-none bg-muted/30"
              >
                <div className="flex flex-row items-center gap-2 p-3">
                  {/* Product image */}
                  <div className="size-12 rounded-md bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.product_name}
                        className="object-cover size-full"
                      />
                    ) : (
                      <span className="text-muted-foreground text-xs text-center leading-tight px-1">
                        No image
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <span className="text-base font-medium leading-none">{item.product_name}</span>
                    <span className="text-xs text-muted-foreground">{item.stall_name}</span>
                    <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-center gap-1 p-3">
                  <span className="text-lg font-semibold tabular-nums">
                    - ₱{formatAmount(item.extended_price)}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-tight">
                    {formatDate(item.purchased_at)}
                  </span>
                </div>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { MOCK_PURCHASE_HISTORY } from '../../../user-constants/mockPurchases';

// const userID: string = '6f92021a-1015-4999-b14a-d68377778b4d';

// //format without peso
// // const formatAmount = (val: number) => {
// //   const [whole, decimal] = new Intl.NumberFormat('en-US', {
// //     minimumFractionDigits: 2,
// //     maximumFractionDigits: 2,
// //   })
// //     .format(val)
// //     .split('.');

// //   return (
// //     <span className="inline-flex items-baseline gap-0">
// //       <span>-{whole}</span>
// //       <span className="text-muted-foreground text-[0.8em]">.{decimal}</span>
// //     </span>
// //   );
// // };

// export function UserPurchasesSection() {
//   // 1. Find the specific user data
//   const userData = MOCK_PURCHASE_HISTORY.find((u) => u.id === userID);

//   // Helper for formatting date to: " 2, Feb 2026"
//   const formatDate = (date: Date) => {
//     return date
//       .toLocaleDateString('en-GB', {
//         day: 'numeric',
//         month: 'short',
//         year: 'numeric',
//       })
//       .replace(',', '');
//   };

//   return (
//     <div className="flex flex-col h-full">
//       <Card className="@container/card">
//         <CardHeader className="pb-2">
//           <CardTitle className="flex flex-row justify-between text-2xl font-semibold">
//             Purchases
//             <Button variant="ghost" className="bg-transparent text-muted-foreground">
//               See All
//             </Button>
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="flex flex-col gap-4">
//           {/* 2. Map through the purchases array */}
//           {userData?.purchases.map((purchase, index) => (
//             <Card
//               key={index}
//               className="flex flex-row justify-between border-none shadow-none bg-muted/30"
//             >
//               <div className="flex flex-row items-center gap-2">
//                 {/* Image Placeholder */}
//                 <div className="size-12 rounded-md bg-muted flex items-center justify-center overflow-hidden">
//                   <img
//                     src={purchase.foodimage}
//                     alt={purchase.foodname}
//                     className="object-cover size-full"
//                   />
//                 </div>

//                 <div className="flex flex-col gap-1">
//                   <span className="text-base font-medium leading-none">{purchase.foodname}</span>
//                   <span className="text-xs text-muted-foreground">{purchase.stallname}</span>
//                 </div>
//               </div>

//               <div className="flex flex-col items-end gap-1">
//                 {/* Using your formatAmount logic */}
//                 <span className="text-lg font-semibold tabular-nums">- {purchase.amountspent}</span>
//                 <span className="text-[10px] text-muted-foreground uppercase tracking-tight">
//                   {formatDate(purchase.date)}
//                 </span>
//               </div>
//             </Card>
//           ))}
//         </CardContent>
//       </Card>
//     </div>
//   );
// }
