import { z } from "zod";
import type { ProductCardDTO } from "./catalog";

export const wishlistProductIdParamSchema = z.object({
  productId: z.string().uuid(),
});

export const wishlistAddItemSchema = z.object({
  productId: z.string().uuid(),
});

export const wishlistMergeSchema = z.object({
  productIds: z.array(z.string().uuid()).default([]),
});

export const wishlistResolveSchema = z.object({
  productIds: z.array(z.string().uuid()).min(1),
});

export interface WishlistItemDTO {
  product: ProductCardDTO;
  savedAt: string;
}

export interface WishlistResponseDTO {
  items: WishlistItemDTO[];
  total: number;
}

export interface WishlistResolveResponseDTO {
  items: ProductCardDTO[];
}

export interface WishlistMergeResponseDTO {
  mergedCount: number;
  total: number;
}
