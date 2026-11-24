import { useQuery } from "@tanstack/react-query";
import { Link, useSearch } from "wouter";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";

interface SessionResponse {
  status: string;
  stripeStatus: string;
  amount: string;
  currency: string;
  items: Array<{ itemId: number; title: string; unitAmount: string }>;
}

export default function CheckoutSuccessPage() {
  const { t } = useTranslation();
  const search = useSearch();
  const sessionId = new URLSearchParams(search).get("session_id") || "";

  const { data, isLoading, isError } = useQuery<SessionResponse>({
    queryKey: ["/api/checkout/sessions", sessionId],
    enabled: !!sessionId,
    queryFn: async () => {
      const res = await fetch(`/api/checkout/sessions/${encodeURIComponent(sessionId)}`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    refetchInterval: (query) => (query.state.data?.status === "paid" ? false : 2000),
  });

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <Card>
        <CardContent className="p-8 space-y-4 text-center">
          {isLoading && <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />}
          {!sessionId || isError ? (
            <p className="text-sm text-muted-foreground">{t("paymentPending")}</p>
          ) : data?.status === "paid" ? (
            <>
              <CheckCircle className="h-10 w-10 mx-auto text-emerald-600" />
              <h1 className="text-2xl font-semibold">{t("orderConfirmed")}</h1>
              <p className="text-sm text-muted-foreground">{t("receiptSent")}</p>
              <p className="text-lg font-medium" data-testid="text-paid-amount">€{data.amount}</p>
              <ul className="text-sm text-left space-y-1">
                {data.items?.map((item) => (
                  <li key={item.itemId} className="flex justify-between gap-3">
                    <span>{item.title}</span>
                    <span>€{item.unitAmount}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
              <p className="text-sm">{t("paymentPending")}</p>
            </>
          )}
          <Link href="/shop">
            <Button variant="outline" data-testid="link-back-shop">{t("backToShop")}</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
