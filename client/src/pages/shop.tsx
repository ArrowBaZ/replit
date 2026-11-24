import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Item } from "@shared/schema";
import { Loader2, Shirt } from "lucide-react";

export default function ShopPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: items, isLoading } = useQuery<Item[]>({ queryKey: ["/api/shop/items"] });

  const addToCart = useMutation({
    mutationFn: async (itemId: number) => {
      await apiRequest("POST", "/api/cart", { itemId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({ title: t("itemAddedToCart") });
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

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{t("shop")}</h1>
        <p className="text-sm text-muted-foreground">{t("shopSubtitle")}</p>
      </div>
      {!items || items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">{t("noListedItems")}</CardContent>
        </Card>
      ) : (
        items.map((item) => {
          const price = item.approvedPrice || item.maxPrice || item.minPrice;
          const ownItem = item.sellerId === user?.id;
          return (
            <Card key={item.id} data-testid={`shop-item-${item.id}`}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {item.photos?.[0] ? (
                    <img src={item.photos[0]} alt="" className="h-14 w-14 rounded-md object-cover border" />
                  ) : (
                    <div className="h-14 w-14 rounded-md bg-muted flex items-center justify-center">
                      <Shirt className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{item.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {item.brand && <span className="text-xs text-muted-foreground">{item.brand}</span>}
                      <Badge variant="outline">{t("statusListed")}</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-medium">€{price}</span>
                  <Button
                    size="sm"
                    disabled={ownItem || addToCart.isPending}
                    onClick={() => addToCart.mutate(item.id)}
                    data-testid={`button-add-cart-${item.id}`}
                  >
                    {t("addToCart")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
