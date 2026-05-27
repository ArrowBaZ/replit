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

export function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const signUpMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/auth/register", {
        email,
        password,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !confirmPassword) {
      toast({
        title: t("authError"),
        description: "Email and password are required",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: t("authError"),
        description: t("passwordMinLength"),
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: t("authError"),
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    signUpMutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("signUp")}</CardTitle>
          <CardDescription>{t("createAccount")}</CardDescription>
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
                disabled={signUpMutation.isPending}
                data-testid="signup-email"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t("firstName")}</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={signUpMutation.isPending}
                  data-testid="signup-firstName"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t("lastName")}</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={signUpMutation.isPending}
                  data-testid="signup-lastName"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("passwordLabel")}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={signUpMutation.isPending}
                data-testid="signup-password"
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
                disabled={signUpMutation.isPending}
                data-testid="signup-confirmPassword"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={signUpMutation.isPending}
              data-testid="signup-submit"
            >
              {signUpMutation.isPending ? "..." : t("createAccount")}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">{t("alreadyHaveAccount")} </span>
              <a href="/login" className="text-primary hover:underline font-medium">
                {t("signIn")}
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
