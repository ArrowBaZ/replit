import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function CheckoutCancelPage() {
  const { t } = useTranslation();
  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <Card>
        <CardContent className="p-8 space-y-4 text-center">
          <XCircle className="h-10 w-10 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-semibold">{t("paymentCancelled")}</h1>
          <p className="text-sm text-muted-foreground">{t("paymentCancelledHelp")}</p>
          <Link href="/checkout">
            <Button data-testid="link-back-cart">{t("backToCart")}</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
