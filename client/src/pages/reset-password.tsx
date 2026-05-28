import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import { validatePasswordReset } from "@/lib/auth-validation";

export function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { toast } = useToast();
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const search = useSearch();

  const token = new URLSearchParams(search).get("token");

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/auth/reset-password", {
        token,
        newPassword,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: t("passwordResetSuccess"),
        variant: "default",
      });
      setLocation("/login");
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

    if (!token) {
      toast({
        title: t("authError"),
        description: t("invalidResetLink"),
        variant: "destructive",
      });
      return;
    }

    const validationError = validatePasswordReset(newPassword, confirmPassword);
    if (validationError) {
      toast({
        title: t("authError"),
        description: t(validationError.message as any),
        variant: "destructive",
      });
      return;
    }

    resetPasswordMutation.mutate();
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t("authError")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("invalidResetLink")}</p>
            <Button
              onClick={() => setLocation("/forgot-password")}
              className="w-full"
            >
              {t("requestNewLink")}
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
          <CardTitle>{t("resetPassword")}</CardTitle>
          <CardDescription>{t("resetPasswordDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t("newPassword")}</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={resetPasswordMutation.isPending}
                data-testid="reset-password-new"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("confirmPasswordLabel")}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={resetPasswordMutation.isPending}
                data-testid="reset-password-confirm"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={resetPasswordMutation.isPending}
              data-testid="reset-password-submit"
            >
              {resetPasswordMutation.isPending ? "..." : t("resetPasswordButton")}
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
