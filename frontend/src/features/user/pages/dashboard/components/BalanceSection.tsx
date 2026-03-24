import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/app/providers/AuthProvider';
import { PhilippinePeso } from 'lucide-react';
import { useEffect, useState } from 'react';
import { userService, type WalletData } from '@/features/user/services/user.service';

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
        <PhilippinePeso className="size-[1em] shrink-0 relative font-semibold" />
      </span>
      <span>{whole}</span>
      <span className="text-muted-foreground">.{decimal}</span>
    </span>
  );
};

export function UserBalanceSection() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const fetchWallet = async () => {
      try {
        const data = await userService.getWallet(user.id);
        setWallet(data);
      } catch (err) {
        setError('Failed to load balance');
      } finally {
        setLoading(false);
      }
    };

    fetchWallet();
  }, [user?.id]);

  const formattedLastTopupDate = wallet?.last_topup_date
    ? new Date(wallet.last_topup_date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <div>
      <Card className="@container/card">
        <CardHeader className="flex flex-col gap-0">
          <CardDescription>Current Balance</CardDescription>
          <CardTitle className="text-3xl font-semi tabular-nums @[250px]/card:text-3xl">
            {loading ? (
              <span className="text-muted-foreground text-xl animate-pulse">Loading...</span>
            ) : error ? (
              <span className="text-red-500 text-sm">{error}</span>
            ) : (
              formatAmount(wallet?.balance ?? 0)
            )}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start text-sm">
          {wallet?.last_topup_amount != null ? (
            <>
              <div className="line-clamp-1 flex gap-1 font-medium">
                Last Top-up:
                <span className="text-muted-foreground">
                  {formatAmountSmallGap(wallet.last_topup_amount)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">{formattedLastTopupDate}</div>
            </>
          ) : (
            <div className="text-xs text-muted-foreground">No top-ups yet</div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}