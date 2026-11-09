import { siteSettings } from "@/config/site";
import { Product } from "@/types";

/**
 * Clean phone number for WhatsApp URLs (digits only)
 */
export function formatWhatsAppNumber(phone?: string): string {
  const raw = phone || siteSettings.whatsappNumber;
  return raw.replace(/[^0-9]/g, "");
}

/**
 * Generate a WhatsApp chat URL with encoded prefilled message
 */
export function getWhatsAppUrl(message: string, customPhone?: string): string {
  const number = formatWhatsAppNumber(customPhone);
  const encoded = encodeURIComponent(message.trim());
  return `https://wa.me/${number}?text=${encoded}`;
}

/**
 * Message template for ordering an individual product
 */
export function getProductOrderWhatsAppUrl(
  product: Product,
  quantity = 1,
  notes?: string
): string {
  const lines = [
    `Hello ${siteSettings.bakeryName}!`,
    "",
    `I would like to place an order for:`,
    `*${product.name}*`,
    `Quantity: ${quantity}`,
    `Price: ${siteSettings.currencySymbol} ${(product.price * quantity).toLocaleString()}`,
  ];

  if (notes) {
    lines.push(`Special Instructions: ${notes}`);
  }

  lines.push("");
  lines.push(`Product Link: /menu/${product.slug}`);
  lines.push("Please let me know availability and delivery time. Thank you!");

  return getWhatsAppUrl(lines.join("\n"));
}

/**
 * Message template for custom cake / dessert enquiry
 */
export function getCustomOrderWhatsAppUrl(details: {
  customerName: string;
  eventType?: string;
  eventDate?: string;
  servings?: string;
  flavor?: string;
  referenceId?: string;
}): string {
  const lines = [
    `Hello ${siteSettings.bakeryName}!`,
    "",
    `I would like to enquire about a *Custom Cake / Dessert Order*:`,
  ];

  if (details.referenceId) {
    lines.push(`Enquiry Reference: *#${details.referenceId}*`);
  }
  lines.push(`Name: ${details.customerName}`);
  if (details.eventType) lines.push(`Event: ${details.eventType}`);
  if (details.eventDate) lines.push(`Required Date: ${details.eventDate}`);
  if (details.servings) lines.push(`Servings: ${details.servings}`);
  if (details.flavor) lines.push(`Preferred Flavor: ${details.flavor}`);

  lines.push("");
  lines.push("I would like to discuss design details and receive a quote.");

  return getWhatsAppUrl(lines.join("\n"));
}

/**
 * Message template for a full shopping bag / order
 */
export function getBagOrderWhatsAppUrl(
  items: Array<{ name: string; quantity: number; price: number }>,
  subtotal: number,
  deliveryFee: number,
  customerName?: string,
  deliveryAddress?: string
): string {
  const total = subtotal + deliveryFee;
  const lines = [
    `Hello ${siteSettings.bakeryName}!`,
    "",
    `I would like to place an order:`,
    "",
    ...items.map(
      (item, i) =>
        `${i + 1}. *${item.name}* x${item.quantity} — ${siteSettings.currencySymbol} ${(item.price * item.quantity).toLocaleString()}`
    ),
    "",
    `Subtotal: ${siteSettings.currencySymbol} ${subtotal.toLocaleString()}`,
    `Delivery: ${siteSettings.currencySymbol} ${deliveryFee.toLocaleString()}`,
    `*Total: ${siteSettings.currencySymbol} ${total.toLocaleString()}*`,
  ];

  if (customerName) lines.push(`Name: ${customerName}`);
  if (deliveryAddress) lines.push(`Address: ${deliveryAddress}`);

  lines.push("");
  lines.push("Please confirm my order and estimated delivery time. Thank you!");

  return getWhatsAppUrl(lines.join("\n"));
}

