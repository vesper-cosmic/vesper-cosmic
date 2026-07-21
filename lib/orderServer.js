import "server-only";

import { Client } from "@notionhq/client";
import { Resend } from "resend";
import { getProductById } from "@/data/products";

const ownerEmail = "vesper.cosmic.blueprint@gmail.com";
const storedOrders = globalThis.__vesperOrders || [];
globalThis.__vesperOrders = storedOrders;

export function validateOrderPayload(payload) {
  const errors = {};
  const product = getProductById(payload.productId);
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!product) errors.productId = "Product is invalid.";
  if (!String(payload.fullName || "").trim()) errors.fullName = "Full name is required.";
  if (!emailPattern.test(String(payload.email || ""))) errors.email = "Enter a valid email.";

  if (product?.requiresBirthData) {
    if (!String(payload.birthDate || "").trim()) errors.birthDate = "Date of birth is required.";
    if (!String(payload.birthTime || "").trim()) errors.birthTime = "Exact birth time is required.";
    if (!["Male", "Female"].includes(payload.biologicalGender)) {
      errors.biologicalGender = "Select biological gender.";
    }
    if (!["Yes", "No", "I don't know"].includes(payload.daylightSavingTime)) {
      errors.daylightSavingTime = "Select daylight saving time.";
    }
    if (!String(payload.birthLocation || "").trim()) {
      errors.birthLocation = "City and country of birth are required.";
    }
    if (product.formType === "C" && !String(payload.digitalCuriosityArea || "").trim()) {
      errors.digitalCuriosityArea = "Select the area you are most curious about.";
    }
    if (product.formType !== "C" && !String(payload.baziIntention || "").trim()) {
      errors.baziIntention = "Select what you are hoping to achieve.";
    }
  }

  if (product?.requiresShipping) {
    const address = payload.address || {};
    if (!String(address.addressLine1 || "").trim()) errors.addressLine1 = "Address line 1 is required.";
    if (!String(address.city || "").trim()) errors.city = "City is required.";
    if (!String(address.stateProvince || "").trim()) errors.stateProvince = "State or province is required.";
    if (!String(address.postalCode || "").trim()) errors.postalCode = "Postal code is required.";
    if (!String(address.country || "").trim()) errors.country = "Country is required.";
  }

  if (product?.requiresNailDetails) {
    if (!payload.mixedSet) {
      const measurements = payload.nailMeasurements || {};
      Object.entries(measurements).forEach(([key, value]) => {
        if (!String(value || "").trim()) {
          errors[key] = "Nail measurement is required, or choose Mixed Set.";
        }
      });
    }
    if (!String(payload.nailShape || "").trim()) errors.nailShape = "Nail shape is required.";
    if (!String(payload.nailLength || "").trim()) errors.nailLength = "Nail length is required.";
    if (!String(payload.stylePreference || "").trim()) {
      errors.stylePreference = "Style preference is required.";
    }
    if (Number(payload.inspirationPhotoSize || 0) > 5 * 1024 * 1024) {
      errors.inspirationPhoto = "Inspiration photo must be 5MB or smaller.";
    }
  }

  const order = {
    orderId: createOrderId(),
    status: "pending_payment",
    productId: product?.id || "",
    productSlug: product?.slug || "",
    productName: product?.name || "",
    productKind: product?.productKind || "",
    formType: product?.formType || "",
    price: product?.price || 0,
    currency: product?.currency || "USD",
    fulfillmentTime: product?.fulfillmentTime || "",
    requiresBirthData: Boolean(product?.requiresBirthData),
    requiresShipping: Boolean(product?.requiresShipping),
    requiresNailDetails: Boolean(product?.requiresNailDetails),
    fullName: String(payload.fullName || "").trim(),
    email: String(payload.email || "").trim().toLowerCase(),
    birthDate: String(payload.birthDate || "").trim(),
    birthTime: String(payload.birthTime || "").trim(),
    biologicalGender: String(payload.biologicalGender || "").trim(),
    daylightSavingTime: String(payload.daylightSavingTime || "").trim(),
    birthLocation: String(payload.birthLocation || "").trim(),
    baziIntention: String(payload.baziIntention || "").trim(),
    digitalCuriosityArea: String(payload.digitalCuriosityArea || "").trim(),
    specificIntentions: String(payload.specificIntentions || "").trim(),
    address: sanitizeAddress(payload.address),
    nailMeasurements: sanitizeObject(payload.nailMeasurements),
    mixedSet: Boolean(payload.mixedSet),
    nailShape: String(payload.nailShape || "").trim(),
    nailLength: String(payload.nailLength || "").trim(),
    stylePreference: String(payload.stylePreference || "").trim(),
    inspirationPhotoName: String(payload.inspirationPhotoName || "").trim(),
    inspirationPhotoSize: Number(payload.inspirationPhotoSize || 0),
    nailNotes: String(payload.nailNotes || "").trim(),
    trackingNumber: null,
    trackingStatus: "not_created",
    createdAt: new Date().toISOString(),
  };

  return { errors, order };
}

export function createPaypalUrl(price) {
  const paypalMe = process.env.PAYPAL_ME || "VesperCosmic";
  return `https://www.paypal.com/paypalme/${paypalMe}/${price}`;
}

export async function persistOrder(order) {
  storedOrders.push(order);
  console.log("Order stored temporarily:", JSON.stringify(order, null, 2));
  return order;
}

export async function createNotionOrder(order) {
  const notion = createNotionClient();
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!notion || !databaseId) {
    return { skipped: true, reason: "Missing Notion environment variables." };
  }

  const { dataSourceId, titlePropertyName } = await getNotionDataSourceContext(
    notion,
    databaseId
  );

  return notion.pages.create({
    parent: { data_source_id: dataSourceId },
    properties: notionOrderProperties(order, titlePropertyName),
  });
}

export async function sendOrderEmails(order, notionResult) {
  const customerResult = await safeSendEmail({
    to: order.email,
    subject: "Your Vesper Cosmic order is confirmed ✨",
    text: customerEmailText(order),
  });

  const ownerResult = await safeSendEmail({
    to: ownerEmail,
    subject: `🔮 New Order — ${order.productName} — ${order.fullName}`,
    text: ownerEmailText(order, notionResult),
  });

  return { customerResult, ownerResult };
}

export async function sendTrackingEmail(order) {
  return safeSendEmail({
    to: order.email,
    subject: "Your Vesper Cosmic tracking number",
    text: `Your tracking number is ${order.trackingNumber}. Carrier: ${
      order.carrier || "TBD"
    }.`,
  });
}

export async function sendTestEmail(to = ownerEmail) {
  return safeSendEmail({
    to,
    subject: "Vesper Cosmic email test",
    text: [
      "This is a test email from the Vesper Cosmic order system.",
      "",
      "If you received this, Resend is connected correctly.",
    ].join("\n"),
  });
}

export async function updateStoredTracking({ orderId, trackingNumber, carrier }) {
  const order = storedOrders.find((item) => item.orderId === orderId);

  if (!order) return null;

  order.trackingNumber = trackingNumber;
  order.carrier = carrier || null;
  order.trackingStatus = "tracking_added";
  order.updatedAt = new Date().toISOString();

  if (process.env.LOGISTICS_API_URL && order.trackingNumber) {
    await fetch(process.env.LOGISTICS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.LOGISTICS_API_KEY || ""}`,
      },
      body: JSON.stringify({
        orderId: order.orderId,
        email: order.email,
        trackingNumber: order.trackingNumber,
        carrier: order.carrier,
      }),
    });
  }

  await sendTrackingEmail(order);
  return order;
}

export async function setupNotionDatabase() {
  const notion = createNotionClient();
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!notion || !databaseId) {
    throw new Error("Missing NOTION_TOKEN or NOTION_DATABASE_ID.");
  }

  const { dataSourceId } = await getNotionDataSourceContext(notion, databaseId);

  const dataSourceResult = await notion.dataSources.update({
    data_source_id: dataSourceId,
    properties: notionDatabaseProperties(),
  });

  const viewResult = await tryCreateNotionViews(notion, databaseId);

  return { dataSourceResult, viewResult };
}

async function getNotionDataSourceContext(notion, databaseId) {
  const database = await notion.databases.retrieve({ database_id: databaseId });
  const dataSourceId = database.data_sources?.[0]?.id;

  if (!dataSourceId) {
    throw new Error("No Notion data source found for this database.");
  }

  const dataSource = await notion.dataSources.retrieve({
    data_source_id: dataSourceId,
  });
  const titlePropertyName =
    Object.entries(dataSource.properties || {}).find(
      ([, property]) => property.type === "title"
    )?.[0] || "Name";

  return { dataSourceId, titlePropertyName };
}

function notionOrderProperties(order, titlePropertyName) {
  const properties = {
    [titlePropertyName]: title(order.orderId),
    訂單日期: { date: { start: order.createdAt } },
    客人姓名: richText(order.fullName),
    "客人 Email": { email: order.email },
    商品名稱: select(order.productName),
    "金額 USD": { number: order.price },
    付款狀態: select("⏳ Pending"),
    製作狀態: select("📋 New Order"),
    出生日期: richText(order.birthDate),
    出生時間: richText(order.birthTime),
    出生城市: richText(order.birthLocation),
    夏令時間: richText(order.daylightSavingTime),
    指甲尺寸: richText(formatNailSizes(order)),
    收件地址: richText(formatAddress(order.address)),
    備註: richText(formatNotes(order)),
  };

  if (order.biologicalGender) properties.生理性別 = select(order.biologicalGender);
  if (order.baziIntention) properties.客人意圖 = select(order.baziIntention);
  if (order.nailShape) properties.指甲形狀 = select(order.nailShape);
  if (order.nailLength) properties.指甲長度 = select(order.nailLength);
  if (order.stylePreference) properties.風格偏好 = select(order.stylePreference);

  return properties;
}

function notionDatabaseProperties() {
  return {
    訂單日期: { date: {} },
    客人姓名: { rich_text: {} },
    "客人 Email": { email: {} },
    商品名稱: {
      select: {
        options: [
          option("Crystal Press-On Nails — Ready to Ship"),
          option("Crystal Energy Bottle — Ready to Ship"),
          option("BaZi Crystal Energy Bottle — Custom"),
          option("Custom BaZi Crystal Press-On Nails"),
          option("Eastern Astrology Report"),
          option("DIY BaZi Crystal Sachet Kit"),
          option("The Complete BaZi Energy Set"),
        ],
      },
    },
    "金額 USD": { number: { format: "dollar" } },
    付款狀態: {
      select: { options: [option("✅ Paid"), option("⏳ Pending"), option("❌ Unpaid")] },
    },
    製作狀態: {
      select: {
        options: [
          option("📋 New Order"),
          option("🔮 Chart Reading"),
          option("🎨 Designing"),
          option("🔨 Making"),
          option("📸 Photography"),
          option("📦 Ready to Ship"),
          option("🚚 Shipped"),
          option("✅ Complete"),
        ],
      },
    },
    出生日期: { rich_text: {} },
    出生時間: { rich_text: {} },
    出生城市: { rich_text: {} },
    生理性別: { select: { options: [option("Male"), option("Female")] } },
    夏令時間: { rich_text: {} },
    日主元素: {
      select: {
        options: [
          option("Wood"),
          option("Fire"),
          option("Earth"),
          option("Metal"),
          option("Water"),
        ],
      },
    },
    客人意圖: {
      select: {
        options: [
          option("Career & Wealth"),
          option("Love & Relationships"),
          option("Protection & Clarity"),
          option("General Energy Alignment"),
        ],
      },
    },
    指甲尺寸: { rich_text: {} },
    指甲形狀: {
      select: {
        options: [
          option("Square"),
          option("Squoval"),
          option("Oval"),
          option("Almond"),
          option("Coffin"),
        ],
      },
    },
    指甲長度: {
      select: { options: [option("Short"), option("Medium"), option("Long")] },
    },
    風格偏好: {
      select: {
        options: [option("Minimalist"), option("Detailed"), option("Maximalist")],
      },
    },
    收件地址: { rich_text: {} },
    備註: { rich_text: {} },
    追蹤號碼: { rich_text: {} },
    預計出貨日: { date: {} },
    售後跟進: { checkbox: {} },
  };
}

async function tryCreateNotionViews(notion, databaseId) {
  if (!notion.views?.create) {
    return { skipped: true, reason: "Installed Notion SDK does not expose views.create." };
  }

  const database = await notion.databases.retrieve({ database_id: databaseId });
  const dataSourceId = database.data_sources?.[0]?.id;

  if (!dataSourceId) {
    return {
      skipped: true,
      reason:
        "No data source ID returned for this database. Create views manually in Notion UI.",
    };
  }

  const common = { database_id: databaseId, data_source_id: dataSourceId };
  const created = [];

  for (const view of [
    { name: "All Orders", type: "table" },
    { name: "Production Board", type: "board" },
    { name: "This Week", type: "table" },
  ]) {
    try {
      created.push(await notion.views.create({ ...common, ...view }));
    } catch (error) {
      created.push({ name: view.name, error: error.message });
    }
  }

  return { created };
}

function createNotionClient() {
  if (!process.env.NOTION_TOKEN) return null;
  return new Client({ auth: process.env.NOTION_TOKEN });
}

async function safeSendEmail({ to, subject, text }) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log("Email placeholder:", { to, subject, text });
      return { skipped: true, reason: "Missing RESEND_API_KEY." };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const response = await resend.emails.send({
      from: `Vesper Cosmic <${
        process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"
      }>`,
      to,
      replyTo: process.env.RESEND_REPLY_TO || ownerEmail,
      subject,
      html: plainTextToHtml(text),
      text,
    });

    if (response.error) {
      console.error("Email failed:", response.error);
      return {
        success: false,
        error: response.error.message || String(response.error),
      };
    }

    return { success: true, id: response.data?.id };
  } catch (error) {
    console.error("Email failed:", error);
    return { success: false, error: error.message };
  }
}

function plainTextToHtml(text) {
  return `<div style="font-family:Arial,sans-serif;line-height:1.65;color:#1C2B48;white-space:pre-wrap">${escapeHtml(
    text
  )}</div>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function customerEmailText(order) {
  const deliveryText = order.requiresShipping
    ? `Your handcrafted item will be shipped within ${order.fulfillmentTime}.\nYou'll receive a tracking number once it ships.`
    : `Your personalized PDF report will be delivered to this email within 3–5 business days.`;

  return `Hi ${order.fullName},

Thank you for your order!

Order ID: ${order.orderId}
Product: ${order.productName}
Amount: $${order.price} USD

${deliveryText}

Please reply if any details need to be corrected.

I'm honored to be part of your journey.
— Vesper
${ownerEmail}`;
}

function ownerEmailText(order, notionResult) {
  return `New Vesper Cosmic order

Notion result:
${JSON.stringify(notionResult, null, 2)}

Order payload:
${JSON.stringify(order, null, 2)}`;
}

function createOrderId() {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replaceAll("-", "");
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `VC-${datePart}-${randomPart}`;
}

function sanitizeAddress(address = {}) {
  return {
    addressLine1: String(address.addressLine1 || "").trim(),
    addressLine2: String(address.addressLine2 || "").trim(),
    city: String(address.city || "").trim(),
    stateProvince: String(address.stateProvince || "").trim(),
    postalCode: String(address.postalCode || "").trim(),
    country: String(address.country || "").trim(),
  };
}

function sanitizeObject(value = {}) {
  return Object.fromEntries(
    Object.entries(value || {}).map(([key, item]) => [
      key,
      String(item || "").trim(),
    ])
  );
}

function formatAddress(address = {}) {
  return [
    address.addressLine1,
    address.addressLine2,
    address.city,
    address.stateProvince,
    address.postalCode,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");
}

function formatNailSizes(order) {
  if (!order.requiresNailDetails) return "";
  if (order.mixedSet) return "Mixed Set, sizes 10–18mm";
  return Object.entries(order.nailMeasurements)
    .map(([key, value]) => `${key}: ${value}mm`)
    .join(", ");
}

function formatNotes(order) {
  return [
    order.specificIntentions ? `Specific intentions: ${order.specificIntentions}` : "",
    order.nailNotes ? `Nail notes: ${order.nailNotes}` : "",
    order.inspirationPhotoName
      ? `Inspiration photo: ${order.inspirationPhotoName}`
      : "",
    order.digitalCuriosityArea
      ? `Digital curiosity area: ${order.digitalCuriosityArea}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function title(content) {
  return { title: [{ text: { content } }] };
}

function richText(content) {
  return { rich_text: [{ text: { content: content || "" } }] };
}

function select(name) {
  return { select: { name } };
}

function option(name) {
  return { name };
}
