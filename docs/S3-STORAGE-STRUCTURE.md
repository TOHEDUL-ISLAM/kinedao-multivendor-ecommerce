# S3 Storage Structure

## Overview

Professional S3 storage organization for KineDao.com, following industry best practices from Amazon, Shopify, and other e-commerce platforms.

## New Structure (Professional)

```
s3://kinedao-bucket/
├── products/
│   ├── {productId}/
│   │   └── images/
│   │       ├── original/
│   │       │   ├── {uuid-1}.jpg
│   │       │   └── {uuid-2}.jpg
│   │       ├── medium/           # 800px (for product pages)
│   │       │   ├── {uuid-1}.jpg
│   │       │   └── {uuid-2}.jpg
│   │       └── thumbnail/        # 200px (for listings)
│   │           ├── {uuid-1}.jpg
│   │           └── {uuid-2}.jpg
│   │
│   └── {another-productId}/
│       └── images/
│           └── original/
│               └── {uuid}.jpg
│
├── vendors/
│   ├── {vendorId}/
│   │   ├── logo/
│   │   │   └── {uuid}.png
│   │   └── documents/
│   │       ├── {uuid}-nid-front.jpg
│   │       ├── {uuid}-nid-back.jpg
│   │       └── {uuid}-trade-license.pdf
│   │
│   └── {another-vendorId}/
│       ├── logo/
│       │   └── {uuid}.png
│       └── documents/
│           └── {uuid}.pdf
│
└── uploads/                      # Fallback for uncategorized files
    └── {userId}/
        └── {uuid}.bin
```

## Benefits

### 1. **Easy Bulk Operations**
```typescript
// Delete all images when product is deleted
await deleteProductImages(productId);

// Delete all vendor documents when vendor is removed
await deleteVendorDocuments(vendorId);
```

### 2. **Clear Ownership**
- Products own their images (not users)
- Vendors own their documents
- Transferring ownership doesn't break image links

### 3. **Better Performance**
```typescript
// List only product images (no filtering needed)
const images = await s3.list({ prefix: `products/${productId}/images/` });

// Get specific variant
const thumbnails = await s3.list({ prefix: `products/${productId}/images/thumbnail/` });
```

### 4. **Organized Variants**
- Original: Full resolution (for zoom, downloads)
- Medium: 800px (product detail pages)
- Thumbnail: 200px (listing pages, related products)

### 5. **Simplified Billing & Analytics**
```bash
# See storage costs per product
aws s3 ls s3://bucket/products/{productId}/ --recursive --summarize

# See storage per vendor
aws s3 ls s3://bucket/vendors/{vendorId}/ --recursive --summarize
```

### 6. **Better IAM Policies**
```json
{
  "Effect": "Allow",
  "Action": ["s3:GetObject"],
  "Resource": "arn:aws:s3:::bucket/products/*/images/*"
}
```

### 7. **CDN Cache Rules**
```nginx
# Cache product images for 1 year (immutable)
location /products/ {
  expires 365d;
  add_header Cache-Control "public, immutable";
}

# Cache vendor logos for 30 days
location /vendors/ {
  expires 30d;
  add_header Cache-Control "public";
}
```

## Usage Examples

### Upload Product Image

```typescript
// Frontend: Upload with productId
const formData = new FormData();
formData.append("file", imageFile);

const response = await api.upload.$post({
  query: {
    category: "product-images",
    productId: "prod-123",
    variant: "original",
  },
  form: formData,
});

// Backend automatically structures: products/prod-123/images/original/{uuid}.jpg
```

### Upload Vendor Logo

```typescript
const response = await api.upload.$post({
  query: {
    category: "vendor-logos",
    vendorId: "vendor-456",
  },
  form: formData,
});

// Backend structures: vendors/vendor-456/logo/{uuid}.png
```

### Delete Product with Images

```typescript
// In vendor-dashboard.ts DELETE /products/:productId
import { deleteProductImages } from "../lib/file-upload";

// Delete product from database
await db.delete(products).where(eq(products.id, productId));

// Clean up all images from S3
await deleteProductImages(productId);
```

## Migration from Old Structure

### Old Structure (Problematic)
```
s3://bucket/
├── product-images/
│   └── user123/
│       ├── abc-123.jpg     # Which product?
│       └── def-456.jpg     # Which product?
├── vendor-logos/
│   └── user456/
│       └── logo.png
└── vendor-documents/
    └── user789/
        └── nid.pdf
```

### Issues with Old Structure
- ❌ Can't find product's images easily
- ❌ Can't delete product images in bulk
- ❌ userId != productId (products belong to vendors, not users)
- ❌ No image variants (thumbnail, medium, original)
- ❌ Hard to implement CDN caching rules
- ❌ Difficult to calculate storage costs per product

### Migration Script (If Needed)
```typescript
// Not needed for new projects - this is for reference if migrating existing data

async function migrateProductImages() {
  // 1. Get all products with their current image URLs
  const products = await db.select().from(products);

  for (const product of products) {
    // 2. For each image URL, extract the old S3 key
    const oldKeys = product.images.map(url => extractS3Key(url));

    // 3. Copy to new structure
    for (const oldKey of oldKeys) {
      const newKey = `products/${product.id}/images/original/${uuid()}.jpg`;
      await s3.copy({ from: oldKey, to: newKey });

      // 4. Update database with new URL
      // ...
    }

    // 5. Delete old files
    for (const oldKey of oldKeys) {
      await s3.delete(oldKey);
    }
  }
}
```

## Industry Examples

### Amazon
```
products/{asin}/images/{size}/{index}.jpg
products/B08N5WRWNW/images/large/1.jpg
```

### Shopify
```
products/{product-id}/{image-id}_{size}.jpg
products/123456789/img-abc_medium.jpg
```

### Stripe
```
files/{file-id}/original.pdf
files/{file-id}/thumbnails/medium.jpg
```

### Etsy
```
listing/{listing-id}/images/{variant}/{timestamp}.jpg
```

## Best Practices Summary

✅ **DO:**
- Organize by entity type (products, vendors)
- Use entity IDs for folders (productId, vendorId)
- Store variants in subfolders (original, thumbnail, medium)
- Use UUID filenames to prevent enumeration
- Implement bulk delete functions
- Set proper CDN cache headers
- Use S3 lifecycle policies for old files

❌ **DON'T:**
- Use flat folder structures
- Mix different entity types in same folder
- Use user-uploaded filenames (security risk)
- Store all images in one folder
- Forget to clean up when deleting entities
- Use userId when you mean productId/vendorId

## Lifecycle Policies (Future Enhancement)

```typescript
// Auto-delete product images after product is deleted for 90 days
{
  "Rules": [{
    "Filter": {
      "Prefix": "products/"
    },
    "Transitions": [{
      "Days": 90,
      "StorageClass": "GLACIER"
    }],
    "Expiration": {
      "Days": 180
    }
  }]
}
```

## Monitoring & Costs

```bash
# Check storage usage by category
aws s3 ls s3://bucket/products/ --recursive --summarize
aws s3 ls s3://bucket/vendors/ --recursive --summarize

# Find large files
aws s3 ls s3://bucket/ --recursive --human-readable --summarize | sort -h

# Cost estimation
# Products: ~100KB/image × 3 variants × 5 images × 3400 products = ~5.1 GB
# Vendors: ~50KB/logo × 10 vendors + ~500KB/docs × 10 = ~5.5 MB
# Total: ~5.1 GB (~$0.12/month on S3 standard)
```
