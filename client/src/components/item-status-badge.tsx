import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

const STATUS_CONFIG_STYLES: Record<string, { className: string }> = {
  pending_approval: {
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  negotiating: {
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  approved: {
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  declined: {
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
  returned: {
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
  listed: {
    className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  },
  sold: {
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  unsold: {
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  },
  donated: {
    className: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
  },
};

const STATUS_LABEL_KEYS: Record<string, string> = {
  pending_approval: "itemStatusPendingReview",
  negotiating: "itemStatusNegotiating",
  approved: "itemStatusAccepted",
  declined: "itemStatusRejected",
  returned: "itemStatusRejected",
  listed: "itemStatusListed",
  sold: "itemStatusSold",
  unsold: "itemStatusUnsold",
  donated: "itemStatusDonated",
};

interface ItemStatusBadgeProps {
  status: string;
  isNegotiating?: boolean;
  className?: string;
  testId?: string;
}

export function ItemStatusBadge({ status, isNegotiating, className, testId }: ItemStatusBadgeProps) {
  const { t } = useTranslation();
  const resolvedStatus = isNegotiating && status === "pending_approval" ? "negotiating" : status;
  const styles = STATUS_CONFIG_STYLES[resolvedStatus] ?? {
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  };
  const labelKey = STATUS_LABEL_KEYS[resolvedStatus];
  const label = labelKey ? t(labelKey) : resolvedStatus.replace(/_/g, " ");

  return (
    <Badge
      variant="secondary"
      className={`shrink-0 ${styles.className} ${className ?? ""}`}
      data-testid={testId}
    >
      {label}
    </Badge>
  );
}
