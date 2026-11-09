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

// 付款狀態
// 顧客按「已付款」只會變成「待確認付款」；需由管理員在 PayPal 核對後才標記「已付款」。
export const PAYMENT_PENDING = "⏳ 待付款";
export const PAYMENT_REVIEW = "🔍 待確認付款";
export const PAYMENT_PAID = "✅ 已付款";
export const PAYMENT_STATUSES = [PAYMENT_PENDING, PAYMENT_REVIEW, PAYMENT_PAID];

// 付款狀態的顧客端英文顯示
export const PAYMENT_STATUS_EN = {
  [PAYMENT_PAID]: "Paid",
  [PAYMENT_PENDING]: "Awaiting Payment",
  [PAYMENT_REVIEW]: "Payment Under Review",
};

// 顧客端時間軸需要的中文狀態（若為舊英文狀態則轉換）
export function normalizedStatus(status) {
  if (!status) return "";
  return LEGACY_STATUS_MAP[status] || status;
}

// 顧客端顯示的英文狀態 — 絕不把 Notion 裡的中文值直接顯示給顧客
export function customerStatusLabel(productionStatus, paymentStatus, orderStatus) {
  return (
    ORDER_STATUS_CUSTOMER_EN[orderStatus] ||
    ORDER_STATUS_EN[normalizedStatus(productionStatus)] ||
    PAYMENT_STATUS_EN[paymentStatus] ||
    "Processing"
  );
}

// ── 後台「訂單狀態」（管理員用的單一主狀態，存在 Notion「訂單狀態」欄位）──
// 付款狀態與製作狀態會跟著它自動同步，顧客端與分潤計算仍讀那兩欄。
export const OS_NEW = "🆕 新訂單";
export const OS_PAYMENT_NOTICE = "📨 已發付款通知"; // 已收到訂單，通知顧客付款
export const OS_REVIEW = "🔍 核帳中"; // 顧客回報已付款，等你核對 PayPal
export const OS_PAID = "💰 已付款"; // 你已在 PayPal 核對到款項
export const OS_VERIFIED_NOTICE = "📨 已發核帳通知"; // 已通知顧客：確認收到款項
export const OS_SHIPPED = "🚚 已出貨";
export const OS_COMPLETED = "✅ 已完成";
export const OS_ISSUE = "⚠️ 異常中";
export const OS_CANCELLED = "❌ 已取消";

export const ADMIN_ORDER_STATUSES = [
  OS_NEW,
  OS_PAYMENT_NOTICE,
  OS_REVIEW,
  OS_PAID,
  OS_VERIFIED_NOTICE,
  OS_SHIPPED,
  OS_COMPLETED,
  OS_ISSUE,
  OS_CANCELLED,
];

// 每個狀態建議的下一步（後台卡片上的快捷按鈕）
export const ADMIN_NEXT_STEPS = {
  [OS_NEW]: [OS_PAYMENT_NOTICE, OS_PAID, OS_CANCELLED],
  [OS_PAYMENT_NOTICE]: [OS_REVIEW, OS_PAID, OS_CANCELLED],
  [OS_REVIEW]: [OS_PAID, OS_ISSUE],
  [OS_PAID]: [OS_VERIFIED_NOTICE, OS_SHIPPED, OS_ISSUE],
  [OS_VERIFIED_NOTICE]: [OS_SHIPPED, OS_ISSUE],
  [OS_SHIPPED]: [OS_COMPLETED, OS_ISSUE],
  [OS_COMPLETED]: [],
  [OS_ISSUE]: [OS_PAID, OS_SHIPPED, OS_CANCELLED],
  [OS_CANCELLED]: [],
};

// 切到這個狀態時可寄給顧客的信（沒有的代表不寄信）
export const ADMIN_STATUS_EMAIL = {
  [OS_PAYMENT_NOTICE]: "付款通知信（含金額與 PayPal 付款連結）",
  [OS_VERIFIED_NOTICE]: "核帳通知信（告知已確認收到款項）",
  [OS_SHIPPED]: "出貨通知信（含追蹤碼）",
  [OS_CANCELLED]: "訂單取消通知信",
};

// 這些狀態會連動付款狀態
export const ADMIN_STATUS_PAYMENT = {
  [OS_NEW]: PAYMENT_PENDING,
  [OS_PAYMENT_NOTICE]: PAYMENT_PENDING,
  [OS_REVIEW]: PAYMENT_REVIEW,
  [OS_PAID]: PAYMENT_PAID,
  [OS_VERIFIED_NOTICE]: PAYMENT_PAID,
  [OS_SHIPPED]: PAYMENT_PAID,
  [OS_COMPLETED]: PAYMENT_PAID,
};

/** 舊訂單沒有「訂單狀態」時，從付款／製作狀態推算。 */
export function adminOrderStatus(order) {
  if (order?.orderStatus && ADMIN_ORDER_STATUSES.includes(order.orderStatus)) {
    return order.orderStatus;
  }
  if (order?.productionStatus === "✅ Complete") return OS_COMPLETED;
  if (normalizedStatus(order?.productionStatus) === "🚚 貨品已寄出") return OS_SHIPPED;
  if (order?.paymentStatus === PAYMENT_PAID) return OS_PAID;
  if (order?.paymentStatus === PAYMENT_REVIEW) return OS_REVIEW;
  return OS_NEW;
}

// 顧客端只會看到這兩個特殊狀態的英文
export const ORDER_STATUS_CUSTOMER_EN = {
  [OS_CANCELLED]: "Cancelled",
  [OS_COMPLETED]: "Completed",
};
