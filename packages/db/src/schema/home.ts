import {
  pgTable,
  text,
  timestamp,
  integer,
  uuid,
  varchar,
  boolean,
  index,
} from "drizzle-orm/pg-core";

// Testimonials table - customer reviews for homepage
export const testimonials = pgTable(
  "testimonials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quote: text("quote").notNull(),
    quoteBn: text("quote_bn"), // Bangla translation
    customerName: varchar("customer_name", { length: 100 }).notNull(),
    location: varchar("location", { length: 100 }),
    locationBn: varchar("location_bn", { length: 100 }), // Bangla translation
    avatarUrl: text("avatar_url"),
    rating: integer("rating").default(5),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("testimonials_active_idx").on(table.isActive)]
);

// Featured Collections table - curated product collections for homepage
export const featuredCollections = pgTable(
  "featured_collections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 100 }).notNull(),
    titleBn: varchar("title_bn", { length: 100 }), // Bangla translation
    description: text("description"),
    descriptionBn: text("description_bn"), // Bangla translation
    imageUrl: text("image_url").notNull(),
    link: text("link").notNull(), // URL to collection page
    bgColor: varchar("bg_color", { length: 50 }), // baby-pink, baby-blue, etc.
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("featured_collections_active_idx").on(table.isActive)]
);

// Instagram Posts table - curated social media images for homepage gallery
export const instagramPosts = pgTable(
  "instagram_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    imageUrl: text("image_url").notNull(),
    alt: varchar("alt", { length: 255 }),
    link: text("link"), // Instagram post URL
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("instagram_posts_active_idx").on(table.isActive)]
);

// Newsletter Subscribers table - email subscriptions
export const newsletterSubscribers = pgTable(
  "newsletter_subscribers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    isActive: boolean("is_active").default(true),
    subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
  },
  (table) => [index("newsletter_email_idx").on(table.email)]
);

// Type exports
export type Testimonial = typeof testimonials.$inferSelect;
export type NewTestimonial = typeof testimonials.$inferInsert;

export type FeaturedCollection = typeof featuredCollections.$inferSelect;
export type NewFeaturedCollection = typeof featuredCollections.$inferInsert;

export type InstagramPost = typeof instagramPosts.$inferSelect;
export type NewInstagramPost = typeof instagramPosts.$inferInsert;

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type NewNewsletterSubscriber = typeof newsletterSubscribers.$inferInsert;
