import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useQuery as useQueryProfile } from "@tanstack/react-query";
import { Percent, TrendingUp } from "lucide-react";
import type { FeeTier } from "@shared/schema";
import type { Profile } from "@shared/schema";
import { FeeBreakdownCard } from "@/components/fee-breakdown-card";

export default function FeeStructurePage() {
  const [priceInput, setPriceInput] = useState("");

  const { data: tiers = [], isLoading } = useQuery<FeeTier[]>({
    queryKey: ["/api/fee-tiers"],
  });

  const { data: profile } = useQueryProfile<Profile>({
    queryKey: ["/api/profile"],
  });

  const priceNum = parseFloat(priceInput);

  const { data: matchedTier, isLoading: tierLoading } = useQuery<FeeTier | null>({
    queryKey: [`/api/fee-tiers/for-price?amount=${priceNum}`],
    enabled: priceNum > 0,
  });

  const role = profile?.role || "seller";

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-[hsl(var(--success))]/10 flex items-center justify-center">
          <Percent className="h-5 w-5 text-[hsl(var(--success))]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" data-testid="heading-fee-structure">Fee Structure</h1>
          <p className="text-sm text-muted-foreground">
            {role === "seller"
              ? "Understand how earnings are split when your items sell"
              : "See the fee tiers that apply to your reselling work"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Earnings Calculator
          </CardTitle>
          <p className="text-sm text-muted-foreground">Enter an item price to see the projected earnings split</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 max-w-xs">
            <span className="text-sm font-medium text-muted-foreground">€</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 250.00"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              data-testid="input-price-calculator"
            />
          </div>
          {tierLoading && priceNum > 0 && (
            <Skeleton className="h-32 w-full rounded-lg" />
          )}
          {!tierLoading && priceNum > 0 && matchedTier === null && (
            <p className="text-sm text-muted-foreground" data-testid="text-no-tier">
              No active fee tier covers this price range.
            </p>
          )}
          {!tierLoading && priceNum > 0 && matchedTier && (
            <FeeBreakdownCard price={priceNum} tier={matchedTier} />
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-3">All Active Fee Tiers</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
          </div>
        ) : tiers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Percent className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No fee tiers available</p>
              <p className="text-sm mt-1">An admin needs to configure fee tiers first.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3" data-testid="list-tiers">
            {tiers.map((tier) => {
              const sellerPct = parseFloat(tier.sellerPercent as string);
              const resellerPct = parseFloat(tier.resellerPercent as string);
              const platformPct = parseFloat(tier.platformPercent as string);
              return (
                <Card key={tier.id} data-testid={`card-tier-${tier.id}`}>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{tier.label}</span>
                          {tier.currencyNote && (
                            <Badge variant="outline" className="text-xs">{tier.currencyNote}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {tier.minPrice ? `From €${parseFloat(tier.minPrice as string).toLocaleString("fr-CH")}` : "From €0"}
                          {tier.maxPrice ? ` to €${parseFloat(tier.maxPrice as string).toLocaleString("fr-CH")}` : " and above"}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Seller</p>
                          <p className="font-bold text-emerald-600 dark:text-emerald-400" data-testid={`text-tier-seller-${tier.id}`}>{sellerPct.toFixed(1)}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Reseller</p>
                          <p className="font-bold text-blue-600 dark:text-blue-400" data-testid={`text-tier-reseller-${tier.id}`}>{resellerPct.toFixed(1)}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Platform</p>
                          <p className="font-bold text-purple-600 dark:text-purple-400" data-testid={`text-tier-platform-${tier.id}`}>{platformPct.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

