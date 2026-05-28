import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { validateEmail, validatePassword } from "@/lib/auth-validation";
import { OAuthButtons } from "@/components/oauth-buttons";
import { Loader2 } from "lucide-react";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
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

    let error = validateEmail(email);
    if (error) {
      toast({ title: t("authError"), description: t(error.message as any), variant: "destructive" });
      return;
    }

    error = validatePassword(password);
    if (error) {
      toast({ title: t("authError"), description: t(error.message as any), variant: "destructive" });
      return;
    }

    signInMutation.mutate();
  };

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 flex-col justify-between bg-[hsl(210,29%,18%)] text-white relative overflow-hidden p-12">
        {/* Background decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[hsl(145,63%,42%)] opacity-10" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-[hsl(145,63%,42%)] opacity-10" />
        <div className="absolute top-1/2 right-8 w-40 h-40 rounded-full bg-[hsl(145,63%,42%)] opacity-5" />

        {/* Logo */}
        <div className="relative z-10">
          <a href="/" className="inline-flex items-center gap-2">
            <span className="font-serif text-2xl font-bold text-white">Sellzy</span>
          </a>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-6">
          <p className="text-xs font-medium tracking-widest uppercase text-[hsl(145,63%,52%)]">
            {t("welcomeBack")}
          </p>
          <h1 className="font-serif text-4xl xl:text-5xl font-bold leading-tight">
            {t("heroTitle")}
          </h1>
          <p className="text-white/60 text-base leading-relaxed max-w-sm">
            {t("heroSubtitle")}
          </p>

          {/* Decorative stat pills */}
          <div className="flex flex-wrap gap-3 pt-4">
            {[t("featureFreeSignup"), t("featureNoUpfrontFees"), t("featureVerifiedExperts")].map((label) => (
              <span
                key={label}
                className="text-xs px-3 py-1.5 rounded-full border border-white/20 text-white/70"
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div className="relative z-10 border-t border-white/10 pt-6">
          <p className="text-sm text-white/40 italic">
            "La marketplace de revente entre particuliers"
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-background">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 text-center">
          <a href="/" className="font-serif text-2xl font-bold text-foreground">Sellzy</a>
        </div>

        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="mb-8">
            <h2 className="font-serif text-3xl font-bold text-foreground">{t("signIn")}</h2>
            <p className="text-muted-foreground mt-1.5 text-sm">{t("welcomeBack")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">{t("emailLabel")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={signInMutation.isPending}
                className="h-11"
                data-testid="login-email"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">{t("passwordLabel")}</Label>
                <a
                  href="/forgot-password"
                  className="text-xs text-[hsl(145,63%,32%)] hover:text-[hsl(145,65%,28%)] font-medium transition-colors"
                >
                  {t("forgotPassword")}
                </a>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={signInMutation.isPending}
                className="h-11"
                data-testid="login-password"
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-11 text-sm font-medium bg-[hsl(var(--success))] hover:bg-[hsl(145,63%,36%)] text-white border-0"
              disabled={signInMutation.isPending}
              data-testid="login-submit"
            >
              {signInMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("signingIn")}
                </span>
              ) : t("signIn")}
            </Button>

            {/* Sign up link */}
            <p className="text-center text-sm text-muted-foreground">
              {t("noAccount")}{" "}
              <a href="/signup" className="text-[hsl(145,63%,32%)] hover:text-[hsl(145,65%,28%)] font-medium transition-colors">
                {t("signUp")}
              </a>
            </p>

            {/* Divider */}
            <div className="relative my-1">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-3 text-xs text-muted-foreground">{t("orContinueWith")}</span>
              </div>
            </div>

            <OAuthButtons disabled={true} />
          </form>
        </div>
      </div>
    </div>
  );
}
