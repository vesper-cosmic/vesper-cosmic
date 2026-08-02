// 訂單製作狀態 — 顧客端訂單追蹤頁面顯示的四階段進度
export const ORDER_STATUSES = [
  "📋 訂單已發出",
  "✅ 訂單已接受",
  "🎨 貨品製作中",
  "🚚 貨品已寄出",
];

// 舊版 Notion 資料庫中的英文狀態（保留以相容既有訂單）
export const LEGACY_STATUSES = [
  "📋 New Order",
  "🔮 Chart Reading",
  "🎨 Designing",
  "🔨 Making",
  "📸 Photography",
  "📦 Ready to Ship",
  "🚚 Shipped",
  "✅ Complete",
];

// 後台顯示的所有可選狀態（新中文 + 舊英文）
export const ALL_ADMIN_STATUSES = [...ORDER_STATUSES, ...LEGACY_STATUSES];

// 舊英文狀態對應到新中文狀態（顧客端時間軸與追蹤碼顯示用）
export const LEGACY_STATUS_MAP = {
  "📋 New Order": "📋 訂單已發出",
  "🔮 Chart Reading": "🎨 貨品製作中",
  "🎨 Designing": "🎨 貨品製作中",
  "🔨 Making": "🎨 貨品製作中",
  "📸 Photography": "🎨 貨品製作中",
  "📦 Ready to Ship": "🎨 貨品製作中",
  "🚚 Shipped": "🚚 貨品已寄出",
  "✅ Complete": "🚚 貨品已寄出",
};

// 新中文狀態的順序索引
export const STATUS_ORDER = Object.fromEntries(
  ORDER_STATUSES.map((key, index) => [key, index])
);

// 顧客端顯示用的英文狀態（顧客面向為英語使用者）
export const ORDER_STATUS_EN = {
  "📋 訂單已發出": "Order Placed",
  "✅ 訂單已接受": "Order Confirmed",
  "🎨 貨品製作中": "In Production",
  "🚚 貨品已寄出": "Shipped",
};

// 顧客端時間軸英文描述
export const ORDER_STATUS_DESCRIPTION_EN = {
  "📋 訂單已發出": "We have received your order",
  "✅ 訂單已接受": "Your order has been confirmed and is being prepared",
  "🎨 貨品製作中": "Your item is being carefully crafted",
  "🚚 貨品已寄出": "Your item has shipped — please watch for delivery",
};

// 顧客端時間軸需要的中文狀態（若為舊英文狀態則轉換）
export function normalizedStatus(status) {
  if (!status) return "";
  return LEGACY_STATUS_MAP[status] || status;
}
