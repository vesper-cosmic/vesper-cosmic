import "server-only";

import { findNotionOrder, saveOrderCostSnapshot } from "@/lib/orderServer";
import { getAllProducts, restoreProductInventory } from "@/lib/productServer";
import { getInventory, orderHasConsumption, recordMovement } from "@/lib/inventoryServer";
import { materialUsageForItems, snapshotOrderCost } from "@/lib/cost";
import { roundMoney } from "@/lib/inventory";
import { OS_COMPLETED, OS_SHIPPED, adminOrderStatus } from "@/lib/orderStatus";

/**
 * When an order ships: take the raw materials its products' recipes call for
 * out of stock (耗用 movements, at today's average cost) and save the cost on
 * the order, so later price changes never rewrite this order's profit.
 *
 * Safe to call more than once for the same order — it does nothing the second
 * time. It never throws and never blocks shipping; the result says what
 * happened. Stock can go negative if materials weren't registered yet; the
 * inventory page flags that.
 *
 * @returns {Promise<{ done: boolean, reason?: string, usage?: Array, costTWD?: number }>}
 */
export async function consumeMaterialsForOrder(orderId) {
  try {
    const found = await findNotionOrder(orderId);
    if (found?.skipped) return { done: false, reason: "Could not load the order." };
    if (!found?.found) return { done: false, reason: "Order not found." };
    const order = found.order;
    if (order.costSnapshot || (await orderHasConsumption(orderId))) {
      return { done: false, reason: "已經扣過原料了。" };
    }

    const inventory = await getInventory();
    if (inventory.skipped) return { done: false, reason: inventory.reason };
    const { products } = await getAllProducts();
    const productsById = Object.fromEntries((products || []).map((p) => [p.id, p]));
    const materialById = Object.fromEntries(inventory.materials.map((m) => [m.id, m]));
    const costById = Object.fromEntries(inventory.materials.map((m) => [m.id, m.recipeUnitCostTWD]));

    const items = (order.items || []).map((item) => ({ productId: item.productId, quantity: item.quantity }));
    const usage = materialUsageForItems(items, productsById);
    const used = [];
    for (const [materialId, quantity] of usage) {
      const material = materialById[materialId];
      if (!material) continue; // a recipe points at a material that no longer exists
      const costTWD = roundMoney(quantity * material.recipeUnitCostTWD);
      // Stock of a bulk material is in packs: one product uses 1/unitsPerPack of a pack.
      const stockQty = quantity / (material.unitsPerPack || 1);
      await recordMovement({
        type: "耗用",
        targetType: "原料",
        targetId: materialId,
        targetName: material.name,
        quantity: -stockQty,
        amountTWD: costTWD,
        orderId,
        note: "出貨依配方扣料",
      });
      used.push({ materialId, name: material.name, quantity, costTWD });
    }

    const snapshot = snapshotOrderCost(items, productsById, costById);
    await saveOrderCostSnapshot(orderId, { productCostTWD: snapshot.totalTWD, lines: snapshot.lines });
    return { done: true, usage: used, costTWD: snapshot.totalTWD };
  } catch (error) {
    console.error("consumeMaterialsForOrder failed:", orderId, error.message);
    return { done: false, reason: error.message || "Could not deduct materials." };
  }
}

/**
 * A cancelled order puts its finished goods back in stock — unless it had
 * already shipped (those goods left the building).
 * `before` is the order as it was before the status change.
 */
export async function restoreStockForCancelledOrder(before) {
  try {
    const status = adminOrderStatus(before);
    if (status === OS_SHIPPED || status === OS_COMPLETED || before?.trackingNumber) {
      return { done: false, reason: "已出貨，不回補庫存。" };
    }
    const items = (before?.items || []).map((item) => ({ productId: item.productId, quantity: item.quantity }));
    const result = await restoreProductInventory(items, { orderId: before.orderId });
    return { done: !result.skipped, updated: result.updated || [], reason: result.reason };
  } catch (error) {
    console.error("restoreStockForCancelledOrder failed:", error.message);
    return { done: false, reason: error.message };
  }
}
