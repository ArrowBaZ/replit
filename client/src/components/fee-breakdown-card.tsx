import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator } from "lucide-react";
import type { FeeTier } from "@shared/schema";

function formatMoney(v: number) {
  return v.toLocaleString("fr-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function FeeBreakdownCard({ price, tier }: { price: number; tier: FeeTier | null | undefined }) {
  if (!tier || price <= 0) return null;

  const sellerPct = parseFloat(tier.sellerPercent as string);
  const resellerPct = parseFloat(tier.resellerPercent as string);
  const platformPct = parseFloat(tier.platformPercent as string);
  const sellerAmt = (price * sellerPct) / 100;
  const resellerAmt = (price * resellerPct) / 100;
  const platformAmt = price - sellerAmt - resellerAmt;

  return (
    <Card className="border-2 border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="h-4 w-4 text-[hsl(var(--success))]" />
          Projected Earnings for €{formatMoney(price)}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Applied tier: <span className="font-medium">{tier.label}</span>
          {tier.currencyNote && <span className="ml-1">({tier.currencyNote})</span>}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20" data-testid="breakdown-seller">
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-1">Seller</p>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">€{formatMoney(sellerAmt)}</p>
            <p className="text-xs text-muted-foreground">{sellerPct.toFixed(1)}%</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20" data-testid="breakdown-reseller">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Reseller</p>
            <p className="text-xl font-bold text-blue-700 dark:text-blue-400">€{formatMoney(resellerAmt)}</p>
            <p className="text-xs text-muted-foreground">{resellerPct.toFixed(1)}%</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20" data-testid="breakdown-platform">
            <p className="text-xs font-medium text-purple-700 dark:text-purple-400 mb-1">Platform</p>
            <p className="text-xl font-bold text-purple-700 dark:text-purple-400">€{formatMoney(platformAmt)}</p>
            <p className="text-xs text-muted-foreground">{platformPct.toFixed(1)}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
