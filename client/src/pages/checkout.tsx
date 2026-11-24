import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ShoppingCart, Trash2 } from "lucide-react";
import { useEffect } from "react";

interface CartResponse {
  lines: Array<{
    itemId: number;
    title: string;
    brand: string | null;
    status: string;
    unitAmount: string;
    photo: string | null;
    purchasable: boolean;
  }>;
  total: string;
  currency: string;
}

export function GuestCheckoutRedirect() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation("/login?redirect=/checkout");
  }, [setLocation]);
  return null;
}

export default function CheckoutPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data, isLoading } = useQuery<CartResponse>({ queryKey: ["/api/cart"] });

  const removeItem = useMutation({
    mutationFn: async (itemId: number) => {
      await apiRequest("DELETE", `/api/cart/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  const pay = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/checkout/sessions");
      return res.json() as Promise<{ url: string }>;
    },
    onSuccess: (body) => {
      window.location.href = body.url;
    },
    onError: (error: Error) => {
      toast({ title: t("checkoutFailed"), description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const lines = data?.lines || [];

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("checkout")}</h1>
        <p className="text-sm text-muted-foreground">{t("cartSummary")}</p>
      </div>

      {lines.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <ShoppingCart className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-sm">{t("cartEmpty")}</p>
            <Button variant="outline" onClick={() => { window.location.href = "/shop"; }} data-testid="link-shop">
              {t("shop")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {lines.map((line) => (
              <Card key={line.itemId} data-testid={`cart-line-${line.itemId}`}>
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{line.title}</p>
                    {line.brand && <p className="text-xs text-muted-foreground">{line.brand}</p>}
                    {!line.purchasable && (
                      <p className="text-xs text-destructive mt-1">{t("itemNotPurchasable")}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-medium">€{line.unitAmount}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeItem.mutate(line.itemId)}
                      data-testid={`button-remove-${line.itemId}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex items-center justify-between border-t pt-4">
            <div>
              <p className="text-sm text-muted-foreground">{t("total")}</p>
              <p className="text-xl font-semibold" data-testid="text-cart-total">€{data?.total}</p>
            </div>
            <Button
              className="bg-[hsl(var(--success))] text-white"
              disabled={pay.isPending || lines.some((line) => !line.purchasable)}
              onClick={() => pay.mutate()}
              data-testid="button-pay"
            >
              {pay.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t("payNow")}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
