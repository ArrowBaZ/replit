import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const { t } = useI18n();
  const [, setLocation] = useLocation();

  const forgotPasswordMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/auth/forgot-password", { email });
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Success",
        description: t("resetEmailSent"),
        variant: "default",
      });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || t("authError");
      toast({
        title: t("authError"),
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || typeof email !== "string") {
      toast({
        title: t("authError"),
        description: t("emailRequired"),
        variant: "destructive",
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: t("authError"),
        description: t("invalidEmail"),
        variant: "destructive",
      });
      return;
    }

    forgotPasswordMutation.mutate();
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t("resetEmailSent")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("resetEmailSentDescription")}
            </p>
            <Button
              onClick={() => setLocation("/login")}
              className="w-full"
            >
              {t("backToLogin")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("forgotPassword")}</CardTitle>
          <CardDescription>{t("forgotPasswordDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("emailLabel")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={forgotPasswordMutation.isPending}
                data-testid="forgot-password-email"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={forgotPasswordMutation.isPending}
              data-testid="forgot-password-submit"
            >
              {forgotPasswordMutation.isPending ? "..." : t("sendResetLink")}
            </Button>

            <div className="text-center text-sm">
              <a href="/login" className="text-primary hover:underline font-medium">
                {t("backToLogin")}
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
