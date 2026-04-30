import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending_approval: {
    label: "Pending Review",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  negotiating: {
    label: "Negotiating",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  approved: {
    label: "Accepted",
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  declined: {
    label: "Rejected",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
  returned: {
    label: "Rejected",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
  listed: {
    label: "Listed",
    className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  },
  sold: {
    label: "Sold",
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  unsold: {
    label: "Unsold",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  },
  donated: {
    label: "Donated",
    className: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
  },
};

interface ItemStatusBadgeProps {
  status: string;
  isNegotiating?: boolean;
  className?: string;
  testId?: string;
}

export function ItemStatusBadge({ status, isNegotiating, className, testId }: ItemStatusBadgeProps) {
  const resolvedStatus = isNegotiating && status === "pending_approval" ? "negotiating" : status;
  const config = STATUS_CONFIG[resolvedStatus] ?? {
    label: resolvedStatus.replace(/_/g, " "),
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  };

  return (
    <Badge
      variant="secondary"
      className={`shrink-0 ${config.className} ${className ?? ""}`}
      data-testid={testId}
    >
      {config.label}
    </Badge>
  );
}
