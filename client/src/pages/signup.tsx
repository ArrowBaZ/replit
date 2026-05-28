import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { validateEmail, validatePassword, validatePasswordConfirmation } from "@/lib/auth-validation";
import { OAuthButtons } from "@/components/oauth-buttons";
import { ProfileTypeSelector, type ProfileType } from "@/components/profile-type-selector";
import { ChevronDown, ChevronUp, Loader2, ArrowLeft } from "lucide-react";

export function SignupPage() {
  const [step, setStep] = useState<1 | 2>(1);
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
  const { t } = useTranslation();
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
      toast({ title: t("authError"), description: message, variant: "destructive" });
    },
  });

  const handleProfileSelect = (type: ProfileType) => {
    setProfileType(type);
  };

  const handleContinue = () => {
    if (!profileType) {
      toast({ title: t("authError"), description: "Please select a profile type", variant: "destructive" });
      return;
    }
    setStep(2);
  };

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

    error = validatePasswordConfirmation(password, confirmPassword);
    if (error) {
      toast({ title: t("authError"), description: t(error.message as any), variant: "destructive" });
      return;
    }

    signUpMutation.mutate();
  };

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 flex-col justify-between bg-[hsl(210,29%,18%)] text-white relative overflow-hidden p-12">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[hsl(145,63%,42%)] opacity-10" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-[hsl(145,63%,42%)] opacity-10" />
        <div className="absolute top-1/2 right-8 w-40 h-40 rounded-full bg-[hsl(145,63%,42%)] opacity-5" />

        <div className="relative z-10">
          <a href="/" className="inline-flex items-center gap-2">
            <span className="font-serif text-2xl font-bold text-white">Sellzy</span>
          </a>
        </div>

        <div className="relative z-10 space-y-6">
          <p className="text-xs font-medium tracking-widest uppercase text-[hsl(145,63%,52%)]">
            {t("joinSellzy")}
          </p>
          <h1 className="font-serif text-4xl xl:text-5xl font-bold leading-tight">
            {t("heroTitle")}
          </h1>
          <p className="text-white/60 text-base leading-relaxed max-w-sm">
            {t("heroSubtitle")}
          </p>

          <div className="space-y-3 pt-4">
            {[
              { step: "01", label: t("stepCreateAccount"), active: step >= 1 },
              { step: "02", label: t("stepSubmitItems"), active: step >= 2 },
              { step: "03", label: t("stepGetPaid"), active: false },
            ].map(({ step: s, label, active }) => (
              <div key={s} className="flex items-center gap-4">
                <span className={`font-serif text-lg font-bold w-8 shrink-0 transition-colors ${active ? "text-[hsl(145,63%,52%)]" : "text-white/25"}`}>{s}</span>
                <span className={`text-sm transition-colors ${active ? "text-white/80" : "text-white/30"}`}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 border-t border-white/10 pt-6">
          <p className="text-sm text-white/40 italic">
            "La marketplace de revente entre particuliers"
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-background overflow-y-auto">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 text-center">
          <a href="/" className="font-serif text-2xl font-bold text-foreground">Sellzy</a>
        </div>

        <div className="w-full max-w-md py-8">

          {/* Step 1: Role selection */}
          {step === 1 && (
            <div className="space-y-8">
              {/* Header */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <StepDots current={1} total={2} />
                </div>
                <h2 className="font-serif text-3xl font-bold text-foreground">{t("signUp")}</h2>
                <p className="text-muted-foreground mt-1.5 text-sm">{t("profileTypeQuestion")}</p>
              </div>

              {/* Role cards */}
              <ProfileTypeSelector onSelect={handleProfileSelect} selected={profileType} />

              {/* Continue */}
              <Button
                type="button"
                onClick={handleContinue}
                className="w-full h-11 text-sm font-medium bg-[hsl(var(--success))] hover:bg-[hsl(145,63%,36%)] text-white border-0"
                disabled={!profileType}
                data-testid="signup-continue"
              >
                {t("continueButton")}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                {t("alreadyHaveAccount")}{" "}
                <a href="/login" className="text-[hsl(145,63%,32%)] hover:text-[hsl(145,65%,28%)] font-medium transition-colors">
                  {t("signIn")}
                </a>
              </p>
            </div>
          )}

          {/* Step 2: Details form */}
          {step === 2 && (
            <div>
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <StepDots current={2} total={2} />
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-3xl font-bold text-foreground">{t("yourDetails")}</h2>
                    <p className="text-muted-foreground mt-1.5 text-sm">{t("fillInYourInfo")}</p>
                  </div>
                  {/* Selected role badge + back */}
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="shrink-0 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1 border border-border rounded-full px-3 py-1.5"
                    data-testid="signup-back"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    {t(profileType === "seller" ? "sellerOption" : "marchandOption")}
                  </button>
                </div>
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
                    disabled={signUpMutation.isPending}
                    className="h-11"
                    data-testid="signup-email"
                  />
                </div>

                {/* Name row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className="text-sm font-medium">{t("firstName")}</Label>
                    <Input
                      id="firstName"
                      placeholder="Jean"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={signUpMutation.isPending}
                      className="h-11"
                      data-testid="signup-firstName"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-sm font-medium">{t("lastName")}</Label>
                    <Input
                      id="lastName"
                      placeholder="Dupont"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={signUpMutation.isPending}
                      className="h-11"
                      data-testid="signup-lastName"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium">{t("passwordLabel")}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={signUpMutation.isPending}
                    className="h-11"
                    data-testid="signup-password"
                  />
                </div>

                {/* Confirm password */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">{t("confirmPasswordLabel")}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={signUpMutation.isPending}
                    className="h-11"
                    data-testid="signup-confirmPassword"
                  />
                </div>

                {/* Marchand business info */}
                {profileType === "marchand" && (
                  <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowLegalFields(!showLegalFields)}
                      className="flex items-center justify-between w-full px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                    >
                      <span className="text-sm font-medium">Informations légales (optionnel)</span>
                      {showLegalFields
                        ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      }
                    </button>

                    {showLegalFields && (
                      <div className="px-4 pb-4 space-y-3 border-t border-border pt-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="siretNumber" className="text-sm font-medium">Numéro SIRET</Label>
                          <Input
                            id="siretNumber"
                            placeholder="(Optionnel)"
                            value={siretNumber}
                            onChange={(e) => setSiretNumber(e.target.value)}
                            disabled={signUpMutation.isPending}
                            className="h-11"
                            data-testid="signup-siretNumber"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="vatNumber" className="text-sm font-medium">Numéro TVA</Label>
                          <Input
                            id="vatNumber"
                            placeholder="(Optionnel)"
                            value={vatNumber}
                            onChange={(e) => setVatNumber(e.target.value)}
                            disabled={signUpMutation.isPending}
                            className="h-11"
                            data-testid="signup-vatNumber"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="dviNumber" className="text-sm font-medium">Numéro DVI</Label>
                          <Input
                            id="dviNumber"
                            placeholder="(Optionnel)"
                            value={dviNumber}
                            onChange={(e) => setDviNumber(e.target.value)}
                            disabled={signUpMutation.isPending}
                            className="h-11"
                            data-testid="signup-dviNumber"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Vous pouvez fournir ces informations maintenant ou uploader des documents plus tard.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full h-11 text-sm font-medium bg-[hsl(var(--success))] hover:bg-[hsl(145,63%,36%)] text-white border-0"
                  disabled={signUpMutation.isPending}
                  data-testid="signup-submit"
                >
                  {signUpMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Création...
                    </span>
                  ) : t("createAccount")}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  {t("alreadyHaveAccount")}{" "}
                  <a href="/login" className="text-[hsl(145,63%,32%)] hover:text-[hsl(145,65%,28%)] font-medium transition-colors">
                    {t("signIn")}
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
          )}
        </div>
      </div>
    </div>
  );
}

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all ${
            i + 1 === current
              ? "w-6 bg-[hsl(145,63%,42%)]"
              : i + 1 < current
              ? "w-3 bg-[hsl(145,63%,42%)]/50"
              : "w-3 bg-border"
          }`}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">
        {current} / {total}
      </span>
    </div>
  );
}
