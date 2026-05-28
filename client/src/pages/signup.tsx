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
import { validateEmail, validatePassword, validatePasswordConfirmation } from "@/lib/auth-validation";
import { OAuthButtons } from "@/components/oauth-buttons";
import { ProfileTypeSelector, type ProfileType } from "@/components/profile-type-selector";
import { ChevronDown, ChevronUp } from "lucide-react";

export function SignupPage() {
  const [profileType, setProfileType] = useState<ProfileType | null>(null);
  const [showLegalFields, setShowLegalFields] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [siretNumber, setSiretNumber] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [dviNumber, setDviNumber] = useState("");
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
        profileType,
        siretNumber: profileType === "marchand" ? siretNumber || undefined : undefined,
        vatNumber: profileType === "marchand" ? vatNumber || undefined : undefined,
        dviNumber: profileType === "marchand" ? dviNumber || undefined : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/verify-email");
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

    if (!profileType) {
      toast({
        title: t("authError"),
        description: "Please select a profile type",
        variant: "destructive",
      });
      return;
    }

    let error = validateEmail(email);
    if (error) {
      toast({
        title: t("authError"),
        description: t(error.message as any),
        variant: "destructive",
      });
      return;
    }

    error = validatePassword(password);
    if (error) {
      toast({
        title: t("authError"),
        description: t(error.message as any),
        variant: "destructive",
      });
      return;
    }

    error = validatePasswordConfirmation(password, confirmPassword);
    if (error) {
      toast({
        title: t("authError"),
        description: t(error.message as any),
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
        <CardContent className="space-y-6">
          {/* Profile Type Selector */}
          <ProfileTypeSelector onSelect={setProfileType} selected={profileType} />

          {/* Form - shown when profile type is selected */}
          {profileType && (
            <form onSubmit={handleSubmit} className="space-y-4 border-t pt-6">
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

              {/* Marchand Legal Fields */}
              {profileType === "marchand" && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowLegalFields(!showLegalFields)}
                    className="flex items-center justify-between w-full hover:opacity-80 transition-opacity"
                  >
                    <span className="text-sm font-medium">Optional: Business Information</span>
                    {showLegalFields ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {showLegalFields && (
                    <div className="space-y-3 pt-2 border-t border-slate-200">
                      <div className="space-y-2">
                        <Label htmlFor="siretNumber">SIRET Number</Label>
                        <Input
                          id="siretNumber"
                          placeholder="(Optional)"
                          value={siretNumber}
                          onChange={(e) => setSiretNumber(e.target.value)}
                          disabled={signUpMutation.isPending}
                          data-testid="signup-siretNumber"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="vatNumber">VAT Number</Label>
                        <Input
                          id="vatNumber"
                          placeholder="(Optional)"
                          value={vatNumber}
                          onChange={(e) => setVatNumber(e.target.value)}
                          disabled={signUpMutation.isPending}
                          data-testid="signup-vatNumber"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dviNumber">DVI Number</Label>
                        <Input
                          id="dviNumber"
                          placeholder="(Optional)"
                          value={dviNumber}
                          onChange={(e) => setDviNumber(e.target.value)}
                          disabled={signUpMutation.isPending}
                          data-testid="signup-dviNumber"
                        />
                      </div>

                      <p className="text-xs text-muted-foreground pt-2">
                        You can provide these details now or upload documents later to complete your profile verification.
                      </p>
                    </div>
                  )}
                </div>
              )}

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

              <OAuthButtons disabled={true} />
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
