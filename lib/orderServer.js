import "server-only";

import { Client } from "@notionhq/client";
import { Resend } from "resend";
import { getProductById } from "@/lib/productServer";
import { maxFortuneSelections } from "@/lib/formOptions";

const ownerEmail = "vesper.cosmic.blueprint@gmail.com";
const storeName = "Vesper Cosmos";
const storedOrders = globalThis.__vesperOrders || [];
globalThis.__vesperOrders = storedOrders;

export async function validateOrderPayload(payload) {
  const errors = {};
  const product = await getProductById(payload.productId);
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!product) errors.productId = "Product is invalid.";
  if (!String(payload.fullName || "").trim()) errors.fullName = "Full name is required.";
  if (!emailPattern.test(String(payload.email || ""))) errors.email = "Enter a valid email.";

  if (product?.intentionType === "single") {
    const readyIntentions = Array.isArray(payload.readyIntentions)
      ? payload.readyIntentions
      : [];
    if (readyIntentions.length === 0) {
      errors.readyIntentions = "Check at least one focus area for this piece.";
    } else if (readyIntentions.length > maxFortuneSelections) {
      errors.readyIntentions = `Please select up to ${maxFortuneSelections} areas to keep your energy focused.`;
    } else {
      const invalid = readyIntentions.filter(
        (item) => !product.availableIntentions?.includes(item)
      );
      if (invalid.length > 0) {
        errors.readyIntentions = "Selected intention is invalid.";
      }
    }
  }

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
    if (product.formType === "C") {
      const areas = Array.isArray(payload.digitalCuriosityAreas)
        ? payload.digitalCuriosityAreas
        : [];
      if (areas.length === 0) {
        errors.digitalCuriosityAreas = "Check at least one area you are curious about.";
      } else if (areas.length > maxFortuneSelections) {
        errors.digitalCuriosityAreas = `Please select up to ${maxFortuneSelections} areas to keep your energy focused.`;
      }
    }
    if (product.formType !== "C") {
      const intentions = Array.isArray(payload.baziIntentions)
        ? payload.baziIntentions
        : [];
      if (intentions.length === 0) {
        errors.baziIntentions = "Check at least one area you are hoping to work on.";
      } else if (intentions.length > maxFortuneSelections) {
        errors.baziIntentions = `Please select up to ${maxFortuneSelections} areas to keep your energy focused.`;
      }
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
    memberEmail:
      String(payload.memberEmail || "").trim().toLowerCase() || null,
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
    baziIntentions: sanitizeStringArray(payload.baziIntentions),
    digitalCuriosityAreas: sanitizeStringArray(payload.digitalCuriosityAreas),
    readyIntentions: sanitizeStringArray(payload.readyIntentions),
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

export async function validateMultiCheckoutPayload(payload) {
  const errors = {};
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const items = Array.isArray(payload.items) ? payload.items : [];

  if (items.length === 0) {
    errors.items = "Cart is empty.";
  }

  if (!String(payload.fullName || "").trim()) {
    errors.fullName = "Full name is required.";
  }
  if (!emailPattern.test(String(payload.email || ""))) {
    errors.email = "Enter a valid email.";
  }

  if (String(payload.shipping?.country || "")) {
    const address = payload.shipping || {};
    if (!String(address.fullName || "").trim()) errors.addressFullName = "Receiver name is required.";
    if (!String(address.addressLine1 || "").trim()) errors.addressLine1 = "Address line 1 is required.";
    if (!String(address.city || "").trim()) errors.city = "City is required.";
    if (!String(address.stateProvince || "").trim()) errors.stateProvince = "State or province is required.";
    if (!String(address.postalCode || "").trim()) errors.postalCode = "Postal code is required.";
  }

  const normalizedItems = [];
  let total = 0;

  for (let index = 0; index < items.length; index += 1) {
    const raw = items[index];
    const product = await getProductById(raw.id);
    const itemErrors = {};

    if (!product) {
      itemErrors.id = "Product is invalid.";
    } else {
      const quantity = Math.max(1, Number(raw.quantity || 1));

      const details = raw.details || {};

      if (product.intentionType === "single") {
        const readyIntentions = Array.isArray(details.readyIntentions)
          ? details.readyIntentions
          : [];
        if (readyIntentions.length === 0) {
          itemErrors.readyIntentions = "Check at least one focus area for this piece.";
        } else if (readyIntentions.length > maxFortuneSelections) {
          itemErrors.readyIntentions = `Please select up to ${maxFortuneSelections} areas to keep your energy focused.`;
        }
      }

      if (product.requiresBirthData) {
        const birth = details.birth || {};
        if (!String(birth.birthDate || "").trim()) itemErrors.birthDate = "Date of birth is required.";
        if (!String(birth.birthTime || "").trim()) itemErrors.birthTime = "Exact birth time is required.";
        if (!["Male", "Female"].includes(birth.biologicalGender)) {
          itemErrors.biologicalGender = "Select biological gender.";
        }
        if (!["Yes", "No", "I don't know"].includes(birth.daylightSavingTime)) {
          itemErrors.daylightSavingTime = "Select daylight saving time.";
        }
        if (!String(birth.birthLocation || "").trim()) {
          itemErrors.birthLocation = "City and country of birth are required.";
        }
        if (product.formType === "C") {
          const areas = Array.isArray(birth.digitalCuriosityAreas)
            ? birth.digitalCuriosityAreas
            : [];
          if (areas.length === 0) {
            itemErrors.digitalCuriosityAreas = "Check at least one area you are curious about.";
          } else if (areas.length > maxFortuneSelections) {
            itemErrors.digitalCuriosityAreas = `Please select up to ${maxFortuneSelections} areas to keep your energy focused.`;
          }
        }
        if (product.formType !== "C") {
          const intentions = Array.isArray(birth.baziIntentions)
            ? birth.baziIntentions
            : [];
          if (intentions.length === 0) {
            itemErrors.baziIntentions = "Check at least one area you are hoping to work on.";
          } else if (intentions.length > maxFortuneSelections) {
            itemErrors.baziIntentions = `Please select up to ${maxFortuneSelections} areas to keep your energy focused.`;
          }
        }
      }

      if (product.requiresNailDetails) {
        const nails = details.nails || {};
        if (!nails.mixedSet) {
          const measurements = nails.measurements || {};
          Object.entries(measurements).forEach(([key, value]) => {
            if (!String(value || "").trim()) {
              itemErrors[key] = "Nail measurement is required, or choose Mixed Set.";
            }
          });
        }
        if (!String(nails.nailShape || "").trim()) itemErrors.nailShape = "Nail shape is required.";
        if (!String(nails.nailLength || "").trim()) itemErrors.nailLength = "Nail length is required.";
        if (!String(nails.stylePreference || "").trim()) {
          itemErrors.stylePreference = "Style preference is required.";
        }
      }

      normalizedItems.push({
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        productKind: product.productKind,
        formType: product.formType,
        price: product.price,
        currency: product.currency,
        fulfillmentTime: product.fulfillmentTime,
        requiresBirthData: Boolean(product.requiresBirthData),
        requiresShipping: Boolean(product.requiresShipping),
        requiresNailDetails: Boolean(product.requiresNailDetails),
        quantity,
        intention: (details.readyIntentions || []).join(", "),
        birth: sanitizeBirth(details.birth),
        nails: sanitizeNails(details.nails),
        notes: String(details.notes || "").trim(),
      });

      total += product.price * quantity;
    }

    if (Object.keys(itemErrors).length > 0) {
      errors[`item_${index}`] = itemErrors;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { errors, order: null };
  }

  const order = {
    orderId: createOrderId(),
    status: "pending_payment",
    items: normalizedItems,
    fullName: String(payload.fullName || "").trim(),
    email: String(payload.email || "").trim().toLowerCase(),
    shipping: sanitizeAddress(payload.shipping),
    total,
    currency: "USD",
    memberEmail: String(payload.memberEmail || "").trim().toLowerCase() || null,
    saveAddressToMember: Boolean(payload.saveAddressToMember),
    trackingNumber: null,
    trackingStatus: "not_created",
    createdAt: new Date().toISOString(),
  };

  return { errors, order };
}

export async function createMultiNotionOrder(order) {
  const notion = createNotionClient();
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!notion || !databaseId) {
    return { skipped: true, reason: "Missing Notion environment variables." };
  }

  const firstItem = order.items[0] || {};
  const properties = {
    名稱: title(order.orderId),
    訂單日期: { date: { start: order.createdAt } },
    客人姓名: richText(order.fullName),
    "客人 Email": { email: order.email },
    商品名稱: select(firstItem.productName || "Multiple Items"),
    "金額 USD": { number: order.total },
    付款狀態: select("⏳ Pending"),
    製作狀態: select("📋 New Order"),
    收件地址: richText(formatAddress(order.shipping)),
    備註: richText(formatMultiOrderNotes(order)),
  };

  if (order.memberEmail) {
    properties["會員 Email"] = { email: order.memberEmail };
  }

  return notion.pages.create({
    parent: { database_id: databaseId },
    properties,
  });
}

export async function markMultiNotionOrderPaid(orderId) {
  const notion = createNotionClient();
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!notion || !databaseId) {
    return { skipped: true, reason: "Missing Notion environment variables." };
  }

  const queryResult = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: "名稱",
      title: { equals: orderId },
    },
    page_size: 1,
  });

  const page = queryResult.results?.[0];

  if (!page?.id) {
    return { skipped: true, reason: "Order page not found in Notion." };
  }

  return notion.pages.update({
    page_id: page.id,
    properties: {
      付款狀態: select("✅ Paid"),
    },
  });
}

/**
 * List every order in the Notion orders database.
 * Used by the admin order-management dashboard.
 */
export async function findAllNotionOrders() {
  const notion = createNotionClient();
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!notion || !databaseId) {
    return { skipped: true, reason: "Missing Notion environment variables." };
  }

  try {
    // Paginate through every order page in the database (Notion caps each
    // query at 100 results, so we follow start_cursor until it runs out).
    const seen = new Set();
    const orders = [];
    let startCursor;

    do {
      const queryResult = await notion.databases.query({
        database_id: databaseId,
        page_size: 100,
        start_cursor: startCursor,
      });

      for (const page of queryResult.results || []) {
        const order = parseNotionOrderPage(page);
        if (!order.orderId || seen.has(order.orderId)) continue;
        seen.add(order.orderId);
        orders.push(order);
      }

      const nextHasMore = queryResult.has_more;
      startCursor = queryResult.next_cursor || undefined;
      if (!nextHasMore) break;
    } while (startCursor);

    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return { skipped: false, orders };
  } catch (error) {
    console.error("findAllNotionOrders failed:", error);
    return { skipped: true, reason: error.message || "Order list lookup failed." };
  }
}

/**
 * Update the production status of a Notion order so customers can see live
 * progress on the public tracking page. Optionally records a postal tracking
 * number when the order is marked as shipped.
 */
export async function updateNotionOrderStatus({ orderId, status, trackingNumber }) {
  const notion = createNotionClient();
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!notion || !databaseId) {
    return { skipped: true, reason: "Missing Notion environment variables." };
  }

  const validStatuses = [
    "📋 訂單已發出",
    "✅ 訂單已接受",
    "🎨 貨品製作中",
    "🚚 貨品已寄出",
  ];

  if (!validStatuses.includes(status)) {
    return { skipped: true, reason: "Invalid production status." };
  }

  try {
    const queryResult = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: "名稱",
        title: { equals: String(orderId || "").trim() },
      },
      page_size: 1,
    });

    const page = queryResult.results?.[0];

    if (!page?.id) {
      return { skipped: true, reason: "Order page not found in Notion." };
    }

    const properties = {
      製作狀態: select(status),
    };

    if (trackingNumber) {
      properties.追蹤號碼 = richText(trackingNumber);
    }

    if (status === "🚚 貨品已寄出" || trackingNumber) {
      properties.預計出貨日 = { date: { start: new Date().toISOString() } };
    }

    return notion.pages.update({
      page_id: page.id,
      properties,
    });
  } catch (error) {
    console.error("updateNotionOrderStatus failed:", error);
    return { skipped: true, reason: error.message || "Status update failed." };
  }
}

export async function persistOrder(order) {
  storedOrders.push(order);
  console.log("Order stored temporarily:", JSON.stringify(order, null, 2));
  return order;
}

/**
 * Query a single order from the Notion orders database by orderId.
 * Used by the public order-tracking page.
 */
export async function findNotionOrder(orderId) {
  const notion = createNotionClient();
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!notion || !databaseId) {
    return { skipped: true, reason: "Missing Notion environment variables." };
  }

  try {
    const queryResult = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: "名稱",
        title: { equals: String(orderId || "").trim() },
      },
      page_size: 1,
    });

    const page = queryResult.results?.[0];

    if (!page?.id) {
      return { skipped: false, found: false };
    }

    return { skipped: false, found: true, order: parseNotionOrderPage(page) };
  } catch (error) {
    console.error("findNotionOrder failed:", error);
    return { skipped: true, reason: error.message || "Order lookup failed." };
  }
}

/**
 * Query all orders for a customer email from the Notion orders database.
 * Used by the member order-history page.
 */
export async function findNotionOrdersByEmail(email) {
  const notion = createNotionClient();
  const databaseId = process.env.NOTION_DATABASE_ID;
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!notion || !databaseId) {
    return { skipped: true, reason: "Missing Notion environment variables." };
  }

  try {
    const queryResult = await notion.databases.query({
      database_id: databaseId,
      filter: {
        or: [
          {
            property: "客人 Email",
            email: { equals: normalizedEmail },
          },
          {
            property: "會員 Email",
            email: { equals: normalizedEmail },
          },
        ],
      },
      page_size: 100,
    });

    const seen = new Set();
    const orders = (queryResult.results || [])
      .map((page) => parseNotionOrderPage(page))
      .filter((order) => {
        if (!order.orderId || seen.has(order.orderId)) return false;
        seen.add(order.orderId);
        return true;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return { skipped: false, orders };
  } catch (error) {
    console.error("findNotionOrdersByEmail failed:", error);
    return { skipped: true, reason: error.message || "Order history lookup failed." };
  }
}

/**
 * Update the tracking number, production status and shipping date on the
 * Notion order page so customers can see live status on the tracking page.
 */
export async function updateNotionTracking({ orderId, trackingNumber, carrier }) {
  const notion = createNotionClient();
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!notion || !databaseId) {
    return { skipped: true, reason: "Missing Notion environment variables." };
  }

  try {
    const queryResult = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: "名稱",
        title: { equals: String(orderId || "").trim() },
      },
      page_size: 1,
    });

    const page = queryResult.results?.[0];

    if (!page?.id) {
      return { skipped: true, reason: "Order page not found in Notion." };
    }

    return notion.pages.update({
      page_id: page.id,
      properties: {
        追蹤號碼: richText(trackingNumber),
        製作狀態: select("🚚 Shipped"),
        預計出貨日: { date: { start: new Date().toISOString() } },
      },
    });
  } catch (error) {
    console.error("updateNotionTracking failed:", error);
    return { skipped: true, reason: error.message || "Tracking update failed." };
  }
}

export async function createNotionOrder(order) {
  const notion = createNotionClient();
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!notion || !databaseId) {
    return { skipped: true, reason: "Missing Notion environment variables." };
  }

  return notion.pages.create({
    parent: { database_id: databaseId },
    properties: notionOrderProperties(order, "名稱"),
  });
}

export async function sendOrderEmails(order, notionResult) {
  const customerResult = await safeSendEmail({
    to: order.email,
    replyTo: ownerEmail,
    subject: `${storeName} — Order confirmed — ${order.orderId}`,
    text: customerEmailText(order),
  });

  const ownerResult = await safeSendEmail({
    to: ownerEmail,
    replyTo: order.email,
    subject: `${storeName} — Payment submitted — ${order.fullName}`,
    text: ownerEmailText(order, notionResult),
  });

  return { customerResult, ownerResult };
}

export async function normalizeConfirmedOrderPayload(payload) {
  const orderId = String(payload.orderId || "").trim();
  const { errors, order } = await validateOrderPayload(payload);

  if (!orderId) errors.orderId = "Order ID is required.";

  return {
    errors,
    order: {
      ...order,
      orderId,
      createdAt: String(payload.createdAt || order.createdAt),
      status: "payment_submitted",
    },
  };
}

export async function markNotionOrderPaid(orderId) {
  const notion = createNotionClient();
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!notion || !databaseId) {
    return { skipped: true, reason: "Missing Notion environment variables." };
  }

  const queryResult = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: "名稱",
      title: { equals: orderId },
    },
    page_size: 1,
  });

  const page = queryResult.results?.[0];

  if (!page?.id) {
    return { skipped: true, reason: "Order page not found in Notion." };
  }

  return notion.pages.update({
    page_id: page.id,
    properties: {
      付款狀態: select("✅ Paid"),
    },
  });
}

export async function sendTrackingEmail(order) {
  return safeSendEmail({
    to: order.email,
    replyTo: ownerEmail,
    subject: "Your Vesper Cosmos tracking number",
    text: `Your tracking number is ${order.trackingNumber}. Carrier: ${
      order.carrier || "TBD"
    }.`,
  });
}

export async function sendTestEmail(to = ownerEmail) {
  return safeSendEmail({
    to,
    replyTo: ownerEmail,
    subject: `${storeName} — Email test`,
    text: [
      "This is a test email from the Vesper Cosmos order system.",
      "",
      "If you received this, Resend is connected correctly.",
    ].join("\n"),
  });
}

export async function updateStoredTracking({ orderId, trackingNumber, carrier }) {
  const order = storedOrders.find((item) => item.orderId === orderId);

  if (order) {
    order.trackingNumber = trackingNumber;
    order.carrier = carrier || null;
    order.trackingStatus = "tracking_added";
    order.updatedAt = new Date().toISOString();
  }

  // Always keep the Notion order page in sync so customers can see the
  // tracking number on the public tracking page even if this serverless
  // instance loses its in-memory copy.
  const notionResult = await updateNotionTracking({
    orderId,
    trackingNumber,
    carrier,
  });

  if (process.env.LOGISTICS_API_URL && trackingNumber) {
    await fetch(process.env.LOGISTICS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.LOGISTICS_API_KEY || ""}`,
      },
      body: JSON.stringify({
        orderId,
        email: order?.email || "",
        trackingNumber,
        carrier: carrier || null,
      }),
    });
  }

  if (order?.email) {
    await sendTrackingEmail(order);
  }

  return order || notionResult;
}

export async function setupNotionDatabase() {
  const notion = createNotionClient();
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!notion || !databaseId) {
    throw new Error("Missing NOTION_TOKEN or NOTION_DATABASE_ID.");
  }

  const dataSourceResult = await notion.databases.update({
    database_id: databaseId,
    properties: notionDatabaseProperties(),
  });

  return { dataSourceResult };
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

  if (order.memberEmail) {
    properties["會員 Email"] = { email: order.memberEmail };
  }

  if (order.biologicalGender) properties.生理性別 = select(order.biologicalGender);
  const allIntentions = [
    ...(order.baziIntentions || []),
    ...(order.readyIntentions || []),
  ];
  if (allIntentions.length > 0) {
    properties.客人意圖 = select(allIntentions.join(", "));
  }
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
          option("Crystal Sachet — Ready to Use"),
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
          option("📋 訂單已發出"),
          option("✅ 訂單已接受"),
          option("🎨 貨品製作中"),
          option("🚚 貨品已寄出"),
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
          option("Health"),
          option("Career"),
          option("Love"),
          option("Wealth"),
          option("Protection"),
          option("General Energy"),
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
    "會員 Email": { email: {} },
    備註: { rich_text: {} },
    追蹤號碼: { rich_text: {} },
    預計出貨日: { date: {} },
    售後跟進: { checkbox: {} },
  };
}

async function tryCreateNotionViews() {
  return { skipped: true, reason: "Views are managed in the Notion UI." };
}

function createNotionClient() {
  if (!process.env.NOTION_TOKEN) return null;
  return new Client({ auth: process.env.NOTION_TOKEN });
}

export async function safeSendEmail({ to, replyTo = ownerEmail, subject, text }) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log("Email placeholder:", { to, subject, text });
      return { skipped: true, reason: "Missing RESEND_API_KEY." };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const response = await resend.emails.send({
      from: `${storeName} <${
        process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"
      }>`,
      to,
      replyTo,
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

export function customerEmailText(order) {
  const deliveryText = order.requiresShipping
    ? `Your handcrafted item will be prepared and shipped within ${order.fulfillmentTime}.\nYou'll receive a tracking number by email once it ships.`
    : `Your personalized report will be delivered to this email within 3–5 business days.`;

  const detailLines = [
    ["Full name", order.fullName],
    ["Email", order.email],
  ];

  if (order.readyIntentions?.length) {
    detailLines.push(["Focus areas", order.readyIntentions.join(", ")]);
  }
  if (order.specificIntentions) {
    detailLines.push(["Specific intentions", order.specificIntentions]);
  }
  if (order.birthDate) detailLines.push(["Date of birth", order.birthDate]);
  if (order.birthTime) detailLines.push(["Exact birth time", order.birthTime]);
  if (order.biologicalGender) {
    detailLines.push(["Biological gender", order.biologicalGender]);
  }
  if (order.daylightSavingTime) {
    detailLines.push(["Daylight saving time", order.daylightSavingTime]);
  }
  if (order.birthLocation) {
    detailLines.push(["Birth location", order.birthLocation]);
  }
  if (order.baziIntentions?.length) {
    detailLines.push(["Intentions", order.baziIntentions.join(", ")]);
  }
  if (order.digitalCuriosityAreas?.length) {
    detailLines.push(["Curiosity areas", order.digitalCuriosityAreas.join(", ")]);
  }
  if (order.requiresNailDetails) {
    if (order.mixedSet) {
      detailLines.push(["Nail size", "Mixed Set, sizes 10–18mm"]);
    } else {
      const sizes = Object.entries(order.nailMeasurements || {})
        .map(([key, value]) => `${key}: ${value}mm`)
        .join(", ");
      if (sizes) detailLines.push(["Nail sizes", sizes]);
    }
    if (order.nailShape) detailLines.push(["Nail shape", order.nailShape]);
    if (order.nailLength) detailLines.push(["Nail length", order.nailLength]);
    if (order.stylePreference) {
      detailLines.push(["Style preference", order.stylePreference]);
    }
    if (order.nailNotes) detailLines.push(["Nail notes", order.nailNotes]);
  }

  const detailsText = detailLines
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");

  const addressLines = [
    order.address?.addressLine1,
    order.address?.addressLine2,
    order.address?.city,
    order.address?.stateProvince,
    order.address?.postalCode,
    order.address?.country,
  ].filter(Boolean);

  return `${storeName} — Order Confirmation

Hi ${order.fullName},

Thank you for your Vesper Cosmos order! Your PayPal payment has been submitted and your order is now confirmed. Here is a summary of your order for your records.

===== ORDER SUMMARY =====
Order ID: ${order.orderId}
Order date: ${order.createdAt}
Payment status: PayPal payment submitted
Product: ${order.productName}
Amount: $${order.price} USD
Fulfillment time: ${order.fulfillmentTime || "N/A"}

===== YOUR DETAILS =====
${detailsText}

===== SHIPPING ADDRESS =====
${
  order.requiresShipping && addressLines.length > 0
    ? addressLines.join("\n")
    : "No physical shipping — your digital deliverable will be sent to this email address."
}

===== WHAT HAPPENS NEXT =====
${deliveryText}

I will review your order and be in touch within 24 hours to confirm the details.

If any of the details above need to be corrected, simply reply to this email.

I'm honored to be part of your journey.
Vesper
${storeName}
${ownerEmail}`;
}

function ownerEmailText(order, notionResult) {
  const notionStatus = notionResult?.skipped
    ? `Notion status: Skipped — ${notionResult.reason}`
    : notionResult?.error
    ? `Notion status: Failed — ${notionResult.error}`
    : "Notion status: Payment status updated";

  return `${storeName}

Payment submitted order notification

${notionStatus}

Order ID: ${order.orderId}
Product: ${order.productName}
Amount: $${order.price} USD
Payment status: PayPal payment submitted
Order time: ${order.createdAt}

Customer
Full name: ${order.fullName}
Email: ${order.email}

Birth details
Date of birth: ${order.birthDate || "N/A"}
Exact birth time: ${order.birthTime || "N/A"}
Biological gender: ${order.biologicalGender || "N/A"}
Daylight saving time: ${order.daylightSavingTime || "N/A"}
Birth city/country: ${order.birthLocation || "N/A"}
Intentions: ${(order.baziIntentions || []).join(", ") || "N/A"}
Curiosity areas: ${(order.digitalCuriosityAreas || []).join(", ") || "N/A"}
Ready-made focus: ${(order.readyIntentions || []).join(", ") || "N/A"}
Specific intentions: ${order.specificIntentions || "N/A"}

Shipping address
${formatAddress(order.address) || "N/A"}

Nail details
Mixed set: ${order.mixedSet ? "Yes" : "No"}
Measurements: ${formatNailSizes(order) || "N/A"}
Shape: ${order.nailShape || "N/A"}
Length: ${order.nailLength || "N/A"}
Style preference: ${order.stylePreference || "N/A"}
Inspiration photo: ${order.inspirationPhotoName || "N/A"}
Nail notes: ${order.nailNotes || "N/A"}

Full order payload
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

function sanitizeBirth(birth = {}) {
  return {
    birthDate: String(birth.birthDate || "").trim(),
    birthTime: String(birth.birthTime || "").trim(),
    biologicalGender: String(birth.biologicalGender || "").trim(),
    daylightSavingTime: String(birth.daylightSavingTime || "").trim(),
    birthLocation: String(birth.birthLocation || "").trim(),
    baziIntentions: sanitizeStringArray(birth.baziIntentions),
    digitalCuriosityAreas: sanitizeStringArray(birth.digitalCuriosityAreas),
    specificIntentions: String(birth.specificIntentions || "").trim(),
  };
}

function sanitizeNails(nails = {}) {
  return {
    measurements: sanitizeObject(nails.measurements),
    mixedSet: Boolean(nails.mixedSet),
    nailShape: String(nails.nailShape || "").trim(),
    nailLength: String(nails.nailLength || "").trim(),
    stylePreference: String(nails.stylePreference || "").trim(),
    inspirationPhotoName: String(nails.inspirationPhotoName || "").trim(),
    nailNotes: String(nails.nailNotes || "").trim(),
  };
}

function formatMultiOrderNotes(order) {
  const lines = order.items.map((item, index) => {
    const parts = [
      `${index + 1}. ${item.productName} × ${item.quantity}`,
    ];
    if (item.intention) parts.push(`Intention: ${item.intention}`);
    if (item.birth?.birthDate) {
      parts.push(
        `Birth: ${item.birth.birthDate} ${item.birth.birthTime} ${item.birth.birthLocation}`
      );
    }
    if (item.nails?.nailShape) {
      parts.push(
        `Nails: ${item.nails.nailShape} ${item.nails.nailLength} ${item.nails.stylePreference}`
      );
    }
    if (item.notes) parts.push(`Notes: ${item.notes}`);
    return parts.join(" — ");
  });

  if (order.memberEmail) lines.push(`Member: ${order.memberEmail}`);
  if (order.saveAddressToMember) lines.push("Address saved to member profile.");

  return lines.join("\n");
}

function sanitizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean);
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
    order.readyIntentions?.length
      ? `Ready-made focus: ${order.readyIntentions.join(", ")}`
      : "",
    order.nailNotes ? `Nail notes: ${order.nailNotes}` : "",
    order.inspirationPhotoName
      ? `Inspiration photo: ${order.inspirationPhotoName}`
      : "",
    order.digitalCuriosityAreas?.length
      ? `Digital curiosity areas: ${order.digitalCuriosityAreas.join(", ")}`
      : "",
    order.baziIntentions?.length
      ? `Intentions: ${order.baziIntentions.join(", ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function parseNotionOrderPage(page) {
  const properties = page?.properties || {};

  const orderData = (property) => {
    if (!property) return "";
    if (property.type === "title") {
      return (property.title || []).map((item) => item.plain_text || "").join("");
    }
    if (property.type === "rich_text") {
      return (property.rich_text || [])
        .map((item) => item.plain_text || "")
        .join("");
    }
    if (property.type === "email") return property.email || "";
    if (property.type === "select") return property.select?.name || "";
    if (property.type === "number") return property.number ?? "";
    return "";
  };

  return {
    orderId: orderData(properties["名稱"]),
    createdAt: properties["訂單日期"]?.date?.start || null,
    fullName: orderData(properties["客人姓名"]),
    email: properties["客人 Email"]?.email || "",
    productName: orderData(properties["商品名稱"]),
    amount: properties["金額 USD"]?.number ?? 0,
    paymentStatus: orderData(properties["付款狀態"]),
    productionStatus: orderData(properties["製作狀態"]),
    trackingNumber: orderData(properties["追蹤號碼"]),
    shippingDate: properties["預計出貨日"]?.date?.start || null,
    address: orderData(properties["收件地址"]),
    memberEmail: properties["會員 Email"]?.email || "",
  };
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
