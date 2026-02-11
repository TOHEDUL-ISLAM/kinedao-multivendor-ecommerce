import { z } from "zod";

// =====================
// Cart Schemas
// =====================

export const cartHeaders = z.object({
  "x-guest-id": z.string().uuid(),
});

export const cartItemParamSchema = z.object({
  itemId: z.string().uuid(),
});

export const cartAddItemSchema = z.object({
  productId: z.string().uuid(),
  skuId: z.string().uuid().optional(),
  quantity: z.number().int().min(1).default(1),
});

export const cartUpdateItemSchema = z.object({
  quantity: z.number().int().min(1),
});

export type CartAddItemRequest = z.infer<typeof cartAddItemSchema>;
export type CartUpdateItemRequest = z.infer<typeof cartUpdateItemSchema>;

// =====================
// Cart DTOs
// =====================

export interface CartProductDTO {
  id: string;
  title: string;
  titleBn: string | null;
  slug: string;
  image: string | null;
  imageAlt: string | null;
  price: number;
  stock: number;
  vendor: { id: string; shopName: string };
  ageRange: string | null;
  isBpaFree: boolean;
  isOrganic: boolean;
  isHypoallergenic: boolean;
  expiryDate: string | null;
}

export interface CartItem {
  id: string;
  skuId: string | null;
  selectedOptions: Record<string, string> | null;
  product: CartProductDTO;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CartResponse {
  cart: {
    id: string;
    items: CartItem[];
    subtotal: number;
    itemCount: number;
  };
}
