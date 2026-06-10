import { Check, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ProfileStatusBadgeProps {
  status: "approved" | "pending";
  size?: "sm" | "md";
}

export function ProfileStatusBadge({ status, size = "md" }: ProfileStatusBadgeProps) {
  const { t } = useTranslation();
  const isApproved = status === "approved";
  const sizeClasses = size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm";

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full font-medium transition-colors ${sizeClasses} ${
        isApproved
          ? "bg-green-100 text-green-700"
          : "bg-yellow-100 text-yellow-700"
      }`}
    >
      {isApproved ? (
        <Check className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
      ) : (
        <Clock className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
      )}
      <span>{isApproved ? t("profileStatusApproved") : t("profileStatusPendingValidation")}</span>
    </div>
  );
}
