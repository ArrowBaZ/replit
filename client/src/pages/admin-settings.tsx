import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Settings } from "lucide-react";

export default function AdminSettingsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [minPrice, setMinPrice] = useState("");

  const { data: settings, isLoading } = useQuery<{ minPrice: number }>({
    queryKey: ["/api/admin/settings/min-price"],
  });

  const updateMinPrice = useMutation({
    mutationFn: async (value: number) => {
      const res = await apiRequest("POST", "/api/admin/settings/min-price", { minPrice: value });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings/min-price"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/min-price"] });
      toast({ title: t("settingsUpdated") || "Settings updated", description: t("minPriceUpdated") || "Minimum price has been updated." });
      setMinPrice("");
    },
    onError: (err: any) => {
      toast({ title: t("error"), description: err.message || t("failedUpdateSettings") || "Failed to update settings", variant: "destructive" });
    },
  });

  const handleUpdateMinPrice = () => {
    const value = parseFloat(minPrice);
    if (isNaN(value) || value < 0) {
      toast({ title: t("error"), description: t("validNumberRequired") || "Please enter a valid number", variant: "destructive" });
      return;
    }
    updateMinPrice.mutate(value);
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-40 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button size="icon" variant="ghost" onClick={() => setLocation("/admin")} data-testid="button-back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="page-title">
            <Settings className="h-5 w-5" />
            {t("adminSettings") || "Admin Settings"}
          </h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("minItemPrice") || "Minimum Item Price"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              {t("minPriceDescription") || "Set the global minimum price for items. Sellers will not be able to create items below this price."}
            </p>
            <p className="text-sm font-medium mb-4">
              {t("currentMinPrice") || "Current minimum price"}: <span className="text-lg text-primary">€{settings?.minPrice?.toFixed(2) || "80.00"}</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="min-price">{t("newMinPrice") || "New Minimum Price (EUR)"}</Label>
            <div className="flex gap-2">
              <Input
                id="min-price"
                type="number"
                min="0"
                step="0.01"
                placeholder={settings?.minPrice?.toFixed(2) || "80.00"}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                data-testid="input-min-price"
              />
              <Button
                onClick={handleUpdateMinPrice}
                disabled={!minPrice || updateMinPrice.isPending}
                data-testid="button-update-min-price"
              >
                {updateMinPrice.isPending ? t("updating") || "Updating..." : t("update")}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("minPriceHint") || "Enter 0 for no minimum, or any value in EUR"}
            </p>
          </div>

          <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>{t("note")}</strong>: {t("minPriceNote") || "This minimum price will be enforced when sellers create items. Items below this price cannot be listed."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
