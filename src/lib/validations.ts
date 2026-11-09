import { z } from "zod";

// Contact inquiry validation schema
export const inquirySchema = z.object({
  name: z.string().min(1, "Please provide your name").max(100),
  email: z.string().email("Please provide a valid email address"),
  phone: z
    .preprocess(
      (val) => (typeof val === "string" && val.trim() ? val.trim() : null),
      z.string().max(40).nullable().optional()
    ),
  subject: z
    .preprocess(
      (val) => (typeof val === "string" && val.trim() ? val.trim() : "General Inquiry"),
      z.string().max(200)
    ),
  message: z.string().min(1, "Please enter your message").max(5000),
  honeypot: z.string().optional().nullable(),
});

// Custom cake order validation schema
export const customOrderSchema = z.object({
  customerName: z.string().min(1, "Name is required").max(100).optional(),
  name: z.string().max(100).optional(),
  customerEmail: z.string().email("Please provide a valid email address").optional(),
  email: z.string().email("Please provide a valid email address").optional(),
  customerPhone: z.string().min(5, "Please provide a valid phone number").max(30).optional(),
  phone: z.string().max(30).optional(),
  eventType: z.string().default("Custom Celebration"),
  eventDate: z.string().default(() => new Date().toISOString().slice(0, 10)),
  deliveryDate: z.string().optional().nullable(),
  servings: z.string().default("10-20 guests"),
  cakeSize: z.string().optional().nullable(),
  flavor: z.string().optional().nullable(),
  filling: z.string().optional().nullable(),
  designDescription: z.string().min(1, "Please provide some details for your cake request").max(5000),
  budgetRange: z.string().optional().nullable(),
  images: z.array(z.string()).optional().default([]),
  additionalNotes: z.string().max(2000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

// Customer standard order schema
export const orderItemInputSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.preprocess(
    (val) => (typeof val === "string" ? parseInt(val, 10) : val),
    z.number().int().min(1, "Quantity must be at least 1").max(50)
  ),
  notes: z.preprocess(
    (val) => (typeof val === "string" && val.trim() ? val.trim() : undefined),
    z.string().max(500).optional()
  ),
});

export const createOrderSchema = z.object({
  customerName: z.preprocess(
    (val) => (typeof val === "string" ? val.trim() : val),
    z.string().min(1, "Please provide your name").max(100)
  ),
  customerEmail: z.preprocess(
    (val) => (typeof val === "string" ? val.trim().toLowerCase() : val),
    z.string().email("Please provide a valid email address")
  ),
  customerPhone: z.preprocess(
    (val) => (typeof val === "string" ? val.trim() : val),
    z.string().min(1, "Please provide your phone number").max(30)
  ),
  deliveryAddress: z.preprocess(
    (val) => (typeof val === "string" ? val.trim() : val),
    z.string().min(1, "Delivery address is required").max(500)
  ),
  customerNotes: z.preprocess(
    (val) => (typeof val === "string" && val.trim() ? val.trim() : undefined),
    z.string().max(1000).optional()
  ),
  items: z.array(orderItemInputSchema).min(1, "Your order must contain at least one item"),
  paymentMethod: z.preprocess(
    (val) => (typeof val === "string" && val.trim() ? val.trim() : "CASH_ON_DELIVERY"),
    z.enum(["CASH_ON_DELIVERY", "BANK_TRANSFER", "ONLINE"]).default("CASH_ON_DELIVERY")
  ),
});

// Newsletter subscription schema
export const newsletterSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

// Admin login schema
export const adminLoginSchema = z.object({
  email: z.string().email("Valid admin email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Admin product mutation schema
export const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(150),
  slug: z.preprocess((val) => {
    if (typeof val === "string" && val.trim().length > 0) {
      return val
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }
    return `product-${Date.now().toString().slice(-6)}`;
  }, z.string().min(1)),
  shortDescription: z.preprocess((val) => {
    if (typeof val === "string" && val.trim().length > 0) return val.trim();
    return "Handcrafted luxury bakery delight.";
  }, z.string()),
  description: z.preprocess((val) => {
    if (typeof val === "string" && val.trim().length > 0) return val.trim();
    return "Freshly baked with the finest artisanal ingredients.";
  }, z.string()),
  price: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return 0;
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  }, z.number().min(0, "Price must be non-negative").default(0)),
  salePrice: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined || val === 0) return null;
    const n = Number(val);
    return isNaN(n) ? null : n;
  }, z.number().min(0).nullable().optional()),
  sku: z.preprocess((val) => {
    if (typeof val === "string" && val.trim().length >= 2) return val.trim();
    return `KR-${Date.now().toString().slice(-6)}`;
  }, z.string()),
  categoryId: z.string().min(1, "Category is required"),
  mainImage: z.preprocess((val) => {
    if (typeof val === "string" && val.trim().length > 0) return val.trim();
    return "/placeholder-cake.jpg";
  }, z.string()),
  gallery: z.preprocess((val) => {
    if (Array.isArray(val)) return val.map(String).map((s) => s.trim()).filter(Boolean);
    if (typeof val === "string" && val.trim()) return [val.trim()];
    return [];
  }, z.array(z.string()).default([])),
  ingredients: z.preprocess((val) => {
    if (Array.isArray(val)) return val.map(String).map((s) => s.trim()).filter(Boolean);
    if (typeof val === "string" && val.trim()) {
      return val.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return [];
  }, z.array(z.string()).default([])),
  allergens: z.preprocess((val) => {
    if (Array.isArray(val)) return val.map(String).map((s) => s.trim()).filter(Boolean);
    if (typeof val === "string" && val.trim()) {
      return val.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return [];
  }, z.array(z.string()).default([])),
  size: z.preprocess((val) => (typeof val === "string" && val.trim() ? val.trim() : null), z.string().nullable().optional()),
  weight: z.preprocess((val) => (typeof val === "string" && val.trim() ? val.trim() : null), z.string().nullable().optional()),
  servings: z.preprocess((val) => (typeof val === "string" && val.trim() ? val.trim() : null), z.string().nullable().optional()),
  preparationTime: z.preprocess((val) => (typeof val === "string" && val.trim() ? val.trim() : null), z.string().nullable().optional()),
  featured: z.preprocess((val) => Boolean(val), z.boolean().default(false)),
  bestseller: z.preprocess((val) => Boolean(val), z.boolean().default(false)),
  available: z.preprocess((val) => (val === undefined ? true : Boolean(val)), z.boolean().default(true)),
  published: z.preprocess((val) => (val === undefined ? true : Boolean(val)), z.boolean().default(true)),
  sortOrder: z.preprocess((val) => {
    const n = parseInt(String(val), 10);
    return isNaN(n) ? 0 : n;
  }, z.number().int().default(0)),
});

// Admin category mutation schema
export const categorySchema = z.object({
  name: z.preprocess(
    (val) => (typeof val === "string" ? val.trim() : val),
    z.string().min(1, "Category name is required").max(100)
  ),
  slug: z.preprocess(
    (val) => {
      if (typeof val === "string" && val.trim()) {
        return val
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_-]+/g, "-")
          .replace(/^-+|-+$/g, "");
      }
      return val;
    },
    z.string().min(1, "Slug is required").max(100)
  ),
  description: z.preprocess(
    (val) => (typeof val === "string" && val.trim() ? val.trim() : null),
    z.string().max(1000).nullable().optional()
  ),
  image: z.preprocess(
    (val) => (typeof val === "string" && val.trim() ? val.trim() : null),
    z.string().nullable().optional()
  ),
  active: z.preprocess(
    (val) => (typeof val === "boolean" ? val : val === "true"),
    z.boolean().default(true)
  ),
  sortOrder: z.preprocess(
    (val) => (typeof val === "string" ? parseInt(val, 10) || 0 : typeof val === "number" ? val : 0),
    z.number().int().default(0)
  ),
});

// Admin order status update schema
export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "PREPARING",
    "READY",
    "OUT_FOR_DELIVERY",
    "COMPLETED",
    "CANCELLED",
  ]).optional(),
  paymentStatus: z.enum(["PENDING", "UNPAID", "PAID", "FAILED", "REFUNDED"]).optional(),
  notes: z.string().max(1000).optional(),
  internalNotes: z.string().max(1000).optional(),
});

// Admin custom order status update schema
export const updateCustomOrderStatusSchema = z.object({
  status: z.enum([
    "NEW",
    "REVIEWING",
    "UNDER_REVIEW",
    "QUOTED",
    "CONFIRMED",
    "IN_PRODUCTION",
    "COMPLETED",
    "CANCELLED",
    "DECLINED",
  ]).optional(),
  quotedPrice: z.number().nonnegative().nullable().optional(),
  adminNotes: z.string().max(1000).optional(),
  internalNotes: z.string().max(1000).optional(),
});

// Admin inquiry status update schema
export const updateInquiryStatusSchema = z.object({
  status: z.enum(["NEW", "IN_PROGRESS", "RESPONDED", "CLOSED"]),
  internalNotes: z.string().max(1000).optional(),
});

// Admin site settings schema
export const updateSiteSettingsSchema = z.record(z.string(), z.string());

