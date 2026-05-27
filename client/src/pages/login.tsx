import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const signInMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/auth/signin", { email, password });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || t("invalidCredentials");
      toast({
        title: t("authError"),
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: t("authError"),
        description: "Email and password are required",
        variant: "destructive",
      });
      return;
    }
    signInMutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("signIn")}</CardTitle>
          <CardDescription>{t("welcomeBack")}</CardDescription>
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
                disabled={signInMutation.isPending}
                data-testid="login-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("passwordLabel")}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={signInMutation.isPending}
                data-testid="login-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={signInMutation.isPending}
              data-testid="login-submit"
            >
              {signInMutation.isPending ? "..." : t("signIn")}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">{t("noAccount")} </span>
              <a href="/signup" className="text-primary hover:underline font-medium">
                {t("signUp")}
              </a>
            </div>

            {/* OAuth providers — enable when credentials are configured
            <div className="pt-2 space-y-2 border-t">
              <Button variant="outline" className="w-full" disabled>
                Continue with Google
              </Button>
              <Button variant="outline" className="w-full" disabled>
                Continue with Microsoft
              </Button>
            </div>
            */}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
