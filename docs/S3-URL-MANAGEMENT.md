# Professional S3 URL Management Guide

## Your Questions Answered

### Q1: How should S3 image URLs be stored in the database?

**❌ WRONG (Current/Bad):**
```sql
-- Storing full presigned URLs (EXPIRES!)
product_images (
  id: uuid,
  product_id: uuid,
  url: text  -- "http://127.0.0.1:54321/storage/v1/object/public/kinedao-assets/product-images/user123/abc.png"
)
```

**✅ CORRECT (Professional):**
```sql
-- Store S3 keys only, generate URLs on-demand
product_images (
  id: uuid,
  product_id: uuid,
  s3_key: text,        -- "products/123/images/original/uuid.jpg"
  variant: varchar,    -- "original" | "medium" | "thumbnail"
  is_primary: boolean
)
```

### Q2: Where are vendor applications stored?

**Answer:** `vendor_applications` table

**Your current data:**
```
✅ 3 applications found:
- ayon (approved)
- kenuuuu (approved)
- asdfasdf (approved)

Status: All approved, 0 pending, 0 rejected
```

## The Professional Pattern

### 1. Database Structure

```typescript
// ✅ STORE: S3 keys (never expire)
{
  id: "img-123",
  productId: "prod-789",
  s3Key: "products/prod-789/images/original/a1b2c3.jpg",
  variant: "original",
  isPrimary: true
}
```

### 2. Generate URLs On-Demand

```typescript
import { getS3Url } from "@kineDao.com/db/lib/s3-helpers";

// In your API/components
const imageUrl = getS3Url(image.s3Key);
// Development: http://127.0.0.1:54321/storage/v1/object/public/bucket/products/...
// Production: https://cdn.kinedao.com/products/prod-789/images/original/a1b2c3.jpg
```

### 3. Why This Is Better

| Aspect | Old (URL in DB) | New (S3 Key in DB) |
|--------|-----------------|---------------------|
| **Expiry** | ⏰ Expires in 7 days | ♾️ Never expires |
| **CDN Switch** | ❌ Must update ALL URLs | ✅ Change one env var |
| **Storage Provider** | ❌ Locked to Supabase | ✅ Switch anytime |
| **Database Size** | 📈 Large URLs (200+ chars) | 📉 Small keys (50 chars) |
| **Performance** | 🐌 Slow (complex URLs) | 🚀 Fast (simple keys) |
| **Backup/Migration** | ❌ URLs break | ✅ Keys portable |

## How Amazon/Shopify Do It

### Amazon
```javascript
// Database stores:
s3_key: "products/B08N5WRWNW/images/large/1.jpg"

// Application generates:
url: "https://m.media-amazon.com/images/I/71abc123.jpg"
// Or: "https://images-na.ssl-images-amazon.com/images/I/71abc123.jpg"
```

### Shopify
```javascript
// Database stores:
s3_key: "products/123456789/img-abc.jpg"

// Application generates:
url: "https://cdn.shopify.com/s/files/1/0123/4567/products/img-abc_medium.jpg"
```

### Stripe
```javascript
// Database stores:
file_id: "file_abc123"

// Application generates:
url: "https://files.stripe.com/v1/files/file_abc123/contents"
```

## Implementation for KineDao

### Step 1: Database Schema ✅ DONE

```typescript
// packages/db/src/schema/products.ts
export const productImages = pgTable("product_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull(),
  s3Key: text("s3_key").notNull(), // ✅ Key, not URL
  variant: varchar("variant", { length: 20 })
    .$type<"original" | "medium" | "thumbnail">()
    .default("original"),
  isPrimary: boolean("is_primary").default(false),
  sortOrder: integer("sort_order").default(0),
});
```

### Step 2: URL Helper Functions ✅ DONE

```typescript
// packages/db/src/lib/s3-helpers.ts
export function getS3Url(s3Key: string): string {
  const isProduction = process.env.NODE_ENV === "production";
  const cdnUrl = process.env.CDN_URL;

  if (isProduction && cdnUrl) {
    return `${cdnUrl}/${s3Key}`;
  }

  // Development: Supabase URL
  const supabaseUrl = process.env.SUPABASE_URL;
  const bucket = process.env.S3_BUCKET;
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${s3Key}`;
}
```

### Step 3: File Upload Returns S3 Key ✅ DONE

```typescript
// apps/server/src/lib/file-upload.ts
export async function uploadFile(file: File, options: UploadOptions) {
  const s3Key = `products/${options.productId}/images/${options.variant}/${uuid}.${ext}`;

  await s3.file(s3Key).write(file);

  return {
    s3Key, // ✅ Return key, not URL
    variant: options.variant,
  };
}
```

### Step 4: Usage in API

```typescript
// POST /api/vendor-dashboard/products
const uploadResult = await uploadFile(imageFile, {
  productId,
  category: "product-images",
  variant: "original",
});

// Save to database
await db.insert(productImages).values({
  productId,
  s3Key: uploadResult.s3Key, // ✅ Store key
  variant: uploadResult.variant,
  isPrimary: index === 0,
});
```

### Step 5: Usage in Frontend

```typescript
import { getS3Url } from "@kineDao.com/db/lib/s3-helpers";

// Fetch product with images
const product = await db.query.products.findFirst({
  with: { images: true },
});

// Generate URLs from keys
const imagesWithUrls = product.images.map(img => ({
  ...img,
  url: getS3Url(img.s3Key),          // Full size
  thumbnail: getImageUrl(img.s3Key, "thumbnail"), // Thumbnail
}));
```

## Environment Configuration

### Development (.env)
```bash
NODE_ENV=development
SUPABASE_URL=http://127.0.0.1:54321
S3_BUCKET=kinedao-assets
```

URLs generated:
```
http://127.0.0.1:54321/storage/v1/object/public/kinedao-assets/products/123/images/original/uuid.jpg
```

### Production (.env)
```bash
NODE_ENV=production
CDN_URL=https://cdn.kinedao.com
# Or: CDN_URL=https://d3abc123.cloudfront.net
```

URLs generated:
```
https://cdn.kinedao.com/products/123/images/original/uuid.jpg
```

## Benefits Summary

### 1. **Never Expires**
- S3 keys are permanent
- No broken images after 7 days
- No need to regenerate URLs

### 2. **Switch CDN Easily**
```bash
# Before: Supabase
CDN_URL=http://127.0.0.1:54321/storage/v1/object/public/kinedao-assets

# After: CloudFront (just change env var)
CDN_URL=https://d3abc123.cloudfront.net

# Or Cloudflare R2
CDN_URL=https://cdn.kinedao.com

# Database unchanged! URLs update automatically
```

### 3. **Smaller Database**
```
Old: 200 chars  →  "http://127.0.0.1:54321/storage/v1/object/public/kinedao-assets/product-images/mKay1iQwCHwdX8IDeSH1Ze4kqWnN0yoi/4ef6a142-de52-4c2e-9656-78bf2fe79a36.png"
New: 50 chars   →  "products/123/images/original/4ef6a142.jpg"

Savings: 75% less storage per image
```

### 4. **Image Variants**
```typescript
// Get different sizes easily
const urls = getAllImageVariants(image.s3Key);
// {
//   original: "https://cdn.../products/123/images/original/uuid.jpg",
//   medium: "https://cdn.../products/123/images/medium/uuid.jpg",
//   thumbnail: "https://cdn.../products/123/images/thumbnail/uuid.jpg"
// }
```

### 5. **Portable Data**
```bash
# Migrate to different cloud? Easy!
# S3 keys work anywhere:
aws s3 sync s3://old-bucket s3://new-bucket
# Update CDN_URL env var
# Done! No database changes needed
```

## Migration Plan (If Needed)

If you have existing URLs in database:

```typescript
// Migration script
import { extractS3KeyFromUrl, getS3Url } from "@kineDao.com/db/lib/s3-helpers";

async function migrateUrls() {
  const images = await db.select().from(productImages);

  for (const image of images) {
    const s3Key = extractS3KeyFromUrl(image.url);
    if (s3Key) {
      await db
        .update(productImages)
        .set({ s3Key })
        .where(eq(productImages.id, image.id));
    }
  }
}
```

## Best Practices Checklist

- ✅ Store S3 keys, NOT URLs
- ✅ Generate URLs on-demand via helper function
- ✅ Use CDN in production (CloudFront, Cloudflare)
- ✅ Use presigned URLs only for private files
- ✅ Organize by entity: `products/{id}/images/`
- ✅ Support variants: `original/`, `medium/`, `thumbnail/`
- ✅ Set proper cache headers on CDN
- ✅ Use environment variables for CDN URL
- ✅ Keep database portable (no hardcoded URLs)
- ✅ Implement image optimization pipeline

## Next Steps

1. **Run migration:** `bun run db:push` to update schema
2. **Update API:** Change vendor dashboard to use `s3Key`
3. **Add helper export:** Export `getS3Url` from `@kineDao.com/db`
4. **Test:** Upload new product image, verify key is stored
5. **Configure CDN:** Set up CloudFront/Cloudflare for production

## Questions?

**Q: What about private files (vendor documents)?**
A: Use presigned URLs for those (they're private):
```typescript
const privateUrl = s3.file(s3Key).presign({ expiresIn: 3600 }); // 1 hour
```

**Q: How to handle image optimization?**
A: Use CDN image transforms or generate variants on upload:
```typescript
await uploadFile(original, { variant: "original" });
await uploadFile(resized800, { variant: "medium" });
await uploadFile(resized200, { variant: "thumbnail" });
```

**Q: What if S3 is down?**
A: CDN caches images, they'll still work. Set cache headers:
```
Cache-Control: public, max-age=31536000, immutable
```
