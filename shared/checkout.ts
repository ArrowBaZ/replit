export function safeInternalPath(value: string | null | undefined): string {
  if (!value) return "/";
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.includes("://")) {
    return "/";
  }
  return value;
}

export function eurosToCents(euros: number): number {
  if (!Number.isFinite(euros) || euros <= 0) {
    throw new Error("Invalid amount");
  }
  return Math.round(euros * 100);
}

export function listedUnitPrice(item: {
  approvedPrice?: string | null;
  salePrice?: string | null;
  maxPrice?: string | null;
  minPrice?: string | null;
}): number {
  const raw = item.approvedPrice || item.salePrice || item.maxPrice || item.minPrice || "0";
  const price = parseFloat(raw);
  return Number.isFinite(price) ? price : 0;
}

export type CartLineError = "not_found" | "not_listed" | "own_item" | "no_reseller" | "invalid_price";

export function cartLineError(
  item: {
    status: string;
    sellerId: string;
    marchantId: string | null;
    approvedPrice?: string | null;
    salePrice?: string | null;
    maxPrice?: string | null;
    minPrice?: string | null;
  } | undefined,
  buyerId: string,
): CartLineError | null {
  if (!item) return "not_found";
  if (item.status !== "listed") return "not_listed";
  if (item.sellerId === buyerId) return "own_item";
  if (!item.marchantId) return "no_reseller";
  if (listedUnitPrice(item) <= 0) return "invalid_price";
  return null;
}
