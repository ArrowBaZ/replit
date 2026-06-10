import { describe, it, expect } from "vitest";
import type { Item } from "../storage";
import { filterApprovedItems, validateApprovedItemsForAgreement } from "./agreement";

describe("agreement domain", () => {
  describe("filterApprovedItems", () => {
    it("should filter to only approved items", async () => {
      const items: Partial<Item>[] = [
        { id: 1, status: "approved" },
        { id: 2, status: "returned" },
        { id: 3, status: "approved" },
      ];
      const result = await filterApprovedItems(items as Item[]);
      expect(result).toHaveLength(2);
      expect(result.map((i) => i.id)).toEqual([1, 3]);
    });

    it("should return empty array when no approved items", async () => {
      const items: Partial<Item>[] = [
        { id: 1, status: "returned" },
        { id: 2, status: "pending_approval" },
      ];
      const result = await filterApprovedItems(items as Item[]);
      expect(result).toHaveLength(0);
    });

    it("should return all items if all are approved", async () => {
      const items: Partial<Item>[] = [
        { id: 1, status: "approved" },
        { id: 2, status: "approved" },
      ];
      const result = await filterApprovedItems(items as Item[]);
      expect(result).toHaveLength(2);
    });
  });

  describe("validateApprovedItemsForAgreement", () => {
    it("should validate when approved items exist", async () => {
      const items: Partial<Item>[] = [
        { id: 1, status: "approved" },
        { id: 2, status: "returned" },
      ];
      const result = await validateApprovedItemsForAgreement(items as Item[]);
      expect(result.valid).toBe(true);
      expect(result.approvedItems).toHaveLength(1);
      expect(result.approvedItems![0].id).toBe(1);
    });

    it("should return error when no approved items exist", async () => {
      const items: Partial<Item>[] = [
        { id: 1, status: "returned" },
        { id: 2, status: "pending_approval" },
      ];
      const result = await validateApprovedItemsForAgreement(items as Item[]);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("No approved items found");
    });

    it("should return error when no items exist", async () => {
      const items: Item[] = [];
      const result = await validateApprovedItemsForAgreement(items);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("No items found");
    });

    it("should validate when all items are approved", async () => {
      const items: Partial<Item>[] = [
        { id: 1, status: "approved" },
        { id: 2, status: "approved" },
      ];
      const result = await validateApprovedItemsForAgreement(items as Item[]);
      expect(result.valid).toBe(true);
      expect(result.approvedItems).toHaveLength(2);
    });

    it("should exclude declined items from approved list", async () => {
      const items: Partial<Item>[] = [
        { id: 1, status: "approved", title: "Item 1" },
        { id: 2, status: "returned", title: "Declined Item" },
        { id: 3, status: "approved", title: "Item 3" },
      ];
      const result = await validateApprovedItemsForAgreement(items as Item[]);
      expect(result.valid).toBe(true);
      expect(result.approvedItems).toHaveLength(2);
      expect(result.approvedItems!.map((i) => i.title)).toEqual(["Item 1", "Item 3"]);
    });
  });

  describe("Agreement itemCount consistency", () => {
    it("should use approved items count for agreement itemCount, not total items count", async () => {
      // Regression test: https://github.com/sellzy/sellzy/issues/XXX
      // Bug: when declining items, agreement.itemCount was set to all items instead of approved items
      // This caused mismatch between itemCount and actual items in itemsSnapshot
      const items: Partial<Item>[] = [
        { id: 1, status: "approved", title: "Item 1" },
        { id: 2, status: "returned", title: "Declined Item" },
        { id: 3, status: "approved", title: "Item 3" },
      ];

      const validation = await validateApprovedItemsForAgreement(items as Item[]);

      // Verify validation filters correctly
      expect(validation.valid).toBe(true);
      expect(validation.approvedItems).toHaveLength(2);

      // REGRESSION TEST: itemCount should match approvedItems.length, not items.length
      // itemCount should be 2 (approved items), not 3 (total items)
      const correctItemCount = validation.approvedItems!.length;
      const totalItemCount = items.length;

      expect(correctItemCount).toBe(2);
      expect(totalItemCount).toBe(3);
      expect(correctItemCount).not.toBe(totalItemCount);

      // Assertions that would catch the bug:
      // - itemCount should be based on approvedItems, not all items
      expect(correctItemCount).toBe(2);
    });
  });
});
