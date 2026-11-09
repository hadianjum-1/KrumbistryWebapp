export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  active: boolean;
  sortOrder: number;
  tone?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number;
  salePrice?: number | null;
  sku: string;
  categoryId: string;
  category?: Category;
  mainImage: string;
  gallery: string[];
  ingredients: string[];
  allergens: string[];
  size?: string | null;
  weight?: string | null;
  servings?: string | null;
  preparationTime?: string | null;
  featured: boolean;
  bestseller: boolean;
  available: boolean;
  published: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  tag?: string;
  tone?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedOptions?: Record<string, string>;
  notes?: string;
}

export interface SiteSettings {
  bakeryName: string;
  tagline: string;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
  address: string;
  openingHours: string;
  currency: string;
  currencySymbol: string;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  minimumOrderAmount: number;
  instagramUrl: string;
  facebookUrl?: string;
  announcementText: string;
  announcementSubtext: string;
}

export interface CustomOrderRequest {
  customerName: string;
  email: string;
  phone: string;
  eventType: string;
  eventDate: string;
  deliveryDate: string;
  servings: string;
  cakeSize: string;
  flavor: string;
  filling?: string;
  designDescription: string;
  budgetRange: string;
  referenceImages?: string[];
  notes?: string;
}

export interface ContactInquiry {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

