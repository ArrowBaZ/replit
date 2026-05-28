import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface OAuthButtonsProps {
  disabled?: boolean;
  onGoogleClick?: () => void;
  onMicrosoftClick?: () => void;
}

export function OAuthButtons({ disabled = true, onGoogleClick, onMicrosoftClick }: OAuthButtonsProps) {
  const { t } = useTranslation();

  return (
    <div className="pt-4 space-y-2 border-t">
      <p className="text-xs text-center text-muted-foreground mb-3">
        {t("oauthComingSoon")}
      </p>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={disabled || !onGoogleClick}
        onClick={onGoogleClick}
      >
        {t("continueWithGoogle")}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={disabled || !onMicrosoftClick}
        onClick={onMicrosoftClick}
      >
        {t("continueWithMicrosoft")}
      </Button>
    </div>
  );
}
