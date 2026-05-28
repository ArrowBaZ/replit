import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";

export function VerifyEmailPage() {
  const [code, setCode] = useState("");
  const { toast } = useToast();
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  const verifyMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/auth/verify-email", { code });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: t("emailVerified"),
        variant: "default",
      });
      setLocation("/");
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

  const sendCodeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/auth/send-verification-code");
    },
    onSuccess: (data: any) => {
      toast({
        title: "Success",
        description: "Verification code sent to your email",
        variant: "default",
      });
      // In development, show the code in the toast for testing
      if (data.code) {
        toast({
          title: "[DEV] Code",
          description: `Code: ${data.code}`,
          variant: "default",
        });
      }
    },
    onError: () => {
      toast({
        title: t("authError"),
        description: "Failed to send verification code",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!code || code.trim().length === 0) {
      toast({
        title: t("authError"),
        description: t("verificationCode") + " is required",
        variant: "destructive",
      });
      return;
    }

    if (code.length !== 6 || !/^\d+$/.test(code)) {
      toast({
        title: t("authError"),
        description: "Verification code must be 6 digits",
        variant: "destructive",
      });
      return;
    }

    verifyMutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("verifyEmail")}</CardTitle>
          <CardDescription>{t("verifyEmailDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">{t("verificationCode")}</Label>
              <Input
                id="code"
                type="text"
                placeholder={t("enterCode")}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                disabled={verifyMutation.isPending || sendCodeMutation.isPending}
                data-testid="verify-email-code"
                className="text-center text-2xl tracking-widest"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={verifyMutation.isPending}
              data-testid="verify-email-submit"
            >
              {verifyMutation.isPending ? "..." : t("verifyButton")}
            </Button>

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => sendCodeMutation.mutate()}
                disabled={sendCodeMutation.isPending}
                className="text-primary hover:underline font-medium"
              >
                {sendCodeMutation.isPending ? "..." : t("sendNewCode")}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
