import type { Item } from "@shared/schema";

export async function filterApprovedItems(items: Item[]): Promise<Item[]> {
  return items.filter((item) => item.status === "approved");
}

export async function validateApprovedItemsForAgreement(
  items: Item[]
): Promise<{ valid: boolean; error?: string; approvedItems?: Item[] }> {
  if (items.length === 0) {
    return { valid: false, error: "No items found for this request" };
  }

  const approvedItems = await filterApprovedItems(items);

  if (approvedItems.length === 0) {
    return { valid: false, error: "No approved items found for agreement. Please approve items or resolve declined ones." };
  }

  return { valid: true, approvedItems };
}
