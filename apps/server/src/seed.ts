import { db } from "@kineDao.com/db";
import {
  vendors,
  brands,
  categories,
  products,
  productImages,
  productOptions,
  productSkus,
  campaigns,
  campaignProducts,
  megaMenuFeaturedProducts,
  testimonials,
  featuredCollections,
  instagramPosts,
} from "@kineDao.com/db/schema";
import { faker } from "@faker-js/faker";

// Set seed for reproducible data
faker.seed(12345);

// Helper to create slug
const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .trim();

// Verified working baby product image URLs (no adult images, all tested)
const productImageUrls = [
  // Baby Toys
  "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=600",
  "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600",
  "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600",
  "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=600",
  "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600",
  "https://images.unsplash.com/photo-1536846511313-4b07b637bff9?w=600",
  "https://images.unsplash.com/photo-1504681869696-d977211a5f4c?w=600",
  "https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=600",
  // Stuffed Animals
  "https://images.unsplash.com/photo-1559715745-e1b33a271c8f?w=600",
  "https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=600",
  "https://images.unsplash.com/photo-1562040506-a9b32cb51b94?w=600",
  "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600",
  "https://images.unsplash.com/photo-1530982011887-3cc11cc85693?w=600",
  // Baby Clothes & Shoes
  "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600",
  "https://images.unsplash.com/photo-1607453998774-d533f65dac99?w=600",
  "https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?w=600",
  "https://images.unsplash.com/photo-1515779122185-2390ccdf060b?w=600",
  "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=600",
  "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600",
  // Baby Products & Gear
  "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=600",
  "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=600",
  "https://images.unsplash.com/photo-1609220136736-443140cffec6?w=600",
  "https://images.unsplash.com/photo-1583845112203-29329902332e?w=600",
  "https://images.unsplash.com/photo-1600369672770-985fd30004eb?w=600",
  // Feeding
  "https://images.unsplash.com/photo-1590859808308-3d2d9c515b1a?w=600",
  // Strollers & Gear
  "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=600",
  // Educational Toys
  "https://images.unsplash.com/photo-1560859251-d563a49c5e4a?w=600",
  // Nursery & Bedding
  "https://images.unsplash.com/photo-1566004100631-35d015d6a491?w=600",
  "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600",
  "https://images.unsplash.com/photo-1492725764893-90b379c2b6e7?w=600",
  // Baby Monitor & Safety
  "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=600",
  // Additional variety
  "https://images.unsplash.com/photo-1604917621956-10dfa7cce2e7?w=600",
  "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600",
];

const campaignImageUrls = [
  "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=1200",
  "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200",
  "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=1200",
];

const brandLogos = [
  "https://placehold.co/200x100/f0f0f0/333?text=BabyLove",
  "https://placehold.co/200x100/f0f0f0/333?text=TinyTots",
  "https://placehold.co/200x100/f0f0f0/333?text=LittleAngel",
  "https://placehold.co/200x100/f0f0f0/333?text=BabySoft",
  "https://placehold.co/200x100/f0f0f0/333?text=CuddleBear",
  "https://placehold.co/200x100/f0f0f0/333?text=SweetDreams",
];

async function seed() {
  console.log("🌱 Starting database seed...");

  // Clear existing data
  console.log("Clearing existing data...");
  await db.delete(campaignProducts);
  await db.delete(campaigns);
  await db.delete(productSkus);
  await db.delete(productOptions);
  await db.delete(productImages);
  await db.delete(products);
  await db.delete(categories);
  await db.delete(vendors);
  await db.delete(brands);
  // Clear homepage content tables
  await db.delete(testimonials);
  await db.delete(featuredCollections);
  await db.delete(instagramPosts);

  // 1. Seed Vendors (10 vendors)
  console.log("Creating vendors...");
  const vendorData = [
    { name: "BabyLove Store", city: "Dhaka", verified: true },
    { name: "TinyTots Bangladesh", city: "Chittagong", verified: true },
    { name: "Little Angels Shop", city: "Dhaka", verified: true },
    { name: "Baby Comfort BD", city: "Sylhet", verified: false },
    { name: "Kids Paradise", city: "Dhaka", verified: true },
    { name: "Sweet Baby Store", city: "Rajshahi", verified: false },
    { name: "Happy Kids BD", city: "Dhaka", verified: true },
    { name: "Baby World BD", city: "Khulna", verified: true },
    { name: "Cuddle Corner", city: "Dhaka", verified: false },
    { name: "Little Star Shop", city: "Comilla", verified: true },
  ];

  const insertedVendors = await db
    .insert(vendors)
    .values(
      vendorData.map((v) => ({
        name: v.name,
        slug: slugify(v.name),
        logoUrl: `https://placehold.co/100x100/f0f0f0/333?text=${encodeURIComponent(v.name.charAt(0))}`,
        ratingAvg: faker.number.float({ min: 3.5, max: 5, fractionDigits: 1 }),
        ratingCount: faker.number.int({ min: 50, max: 500 }),
        locationCity: v.city,
        isVerified: v.verified,
        badges: v.verified ? ["Verified Seller", "Fast Shipping"] : ["New Seller"],
      }))
    )
    .returning();

  // 2. Seed Brands (6 brands)
  console.log("Creating brands...");
  const brandData = [
    { name: "BabyLove", logo: brandLogos[0] },
    { name: "TinyTots", logo: brandLogos[1] },
    { name: "LittleAngel", logo: brandLogos[2] },
    { name: "BabySoft", logo: brandLogos[3] },
    { name: "CuddleBear", logo: brandLogos[4] },
    { name: "SweetDreams", logo: brandLogos[5] },
  ];

  await db.insert(brands).values(
    brandData.map((b, i) => ({
      name: b.name,
      slug: slugify(b.name),
      logoUrl: b.logo || brandLogos[0]!, // Fallback to first logo
      sortOrder: i,
      isActive: true,
    }))
  );

  // 3. Seed Categories (comprehensive catalog matching mega menu design)
  console.log("Creating comprehensive category structure...");

  // Parent Categories (9 main categories)
  const parentCategories = [
    {
      name: "Baby Clothing",
      nameBn: "বেবি পোশাক",
      icon: "Shirt",
      imageUrl: "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600",
    },
    {
      name: "Feeding & Nursing",
      nameBn: "খাওয়ানো ও স্তন্যপান",
      icon: "Utensils",
      imageUrl: "https://images.unsplash.com/photo-1590859808308-3d2d9c515b1a?w=600",
    },
    {
      name: "Baby Care & Safety",
      nameBn: "শিশু যত্ন ও নিরাপত্তা",
      icon: "Heart",
      imageUrl: "https://images.unsplash.com/photo-1609220136736-443140cffec6?w=600",
    },
    {
      name: "Toys & Play",
      nameBn: "খেলনা ও খেলা",
      icon: "Sparkles",
      imageUrl: "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=600",
    },
    {
      name: "Nursery & Furniture",
      nameBn: "নার্সারি ও আসবাবপত্র",
      icon: "Bed",
      imageUrl: "https://images.unsplash.com/photo-1566004100631-35d015d6a491?w=600",
    },
    {
      name: "Strollers & Travel",
      nameBn: "স্ট্রলার ও ভ্রমণ",
      icon: "Car",
      imageUrl: "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=600",
    },
    {
      name: "Bath Time",
      nameBn: "গোসলের সময়",
      icon: "Bath",
      imageUrl: "https://images.unsplash.com/photo-1600369672770-985fd30004eb?w=600",
    },
    {
      name: "Health & Wellness",
      nameBn: "স্বাস্থ্য ও সুস্থতা",
      icon: "ShieldCheck",
      imageUrl: "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=600",
    },
    {
      name: "Gift Sets & Bundles",
      nameBn: "উপহার সেট ও বান্ডেল",
      icon: "Gift",
      imageUrl: "https://images.unsplash.com/photo-1562040506-a9b32cb51b94?w=600",
    },
  ];

  const insertedParents = await db
    .insert(categories)
    .values(
      parentCategories.map((c, i) => ({
        name: c.name,
        nameBn: c.nameBn,
        slug: slugify(c.name),
        iconKey: c.icon,
        imageUrl: c.imageUrl,
        sortOrder: i,
        depth: 0,
      }))
    )
    .returning();

  // Child Categories (Level 1 - Subcategory groups)
  const childCategories = [
    // 1. Baby Clothing (5 subcategories)
    { name: "Tops & T-shirts", nameBn: "টপস ও টি-শার্ট", parent: "Baby Clothing", sortOrder: 0 },
    { name: "Bottoms", nameBn: "বটমস", parent: "Baby Clothing", sortOrder: 1 },
    { name: "Outerwear", nameBn: "আউটারওয়্যার", parent: "Baby Clothing", sortOrder: 2 },
    { name: "Sleepwear", nameBn: "স্লিপওয়্যার", parent: "Baby Clothing", sortOrder: 3 },
    { name: "Accessories", nameBn: "আনুষাঙ্গিক", parent: "Baby Clothing", sortOrder: 4 },

    // 2. Feeding & Nursing (5 subcategories)
    { name: "Bottles & Nipples", nameBn: "বোতল ও নিপল", parent: "Feeding & Nursing", sortOrder: 0 },
    { name: "Breastfeeding", nameBn: "বুকের দুধ", parent: "Feeding & Nursing", sortOrder: 1 },
    { name: "Feeding Essentials", nameBn: "খাওয়ানোর প্রয়োজনীয়", parent: "Feeding & Nursing", sortOrder: 2 },
    { name: "Solid Food", nameBn: "শক্ত খাবার", parent: "Feeding & Nursing", sortOrder: 3 },
    { name: "Formula & Food", nameBn: "ফর্মুলা ও খাবার", parent: "Feeding & Nursing", sortOrder: 4 },

    // 3. Baby Care & Safety (5 subcategories)
    { name: "Diapering", nameBn: "ডায়াপারিং", parent: "Baby Care & Safety", sortOrder: 0 },
    { name: "Skin Care", nameBn: "ত্বক যত্ন", parent: "Baby Care & Safety", sortOrder: 1 },
    { name: "Health", nameBn: "স্বাস্থ্য", parent: "Baby Care & Safety", sortOrder: 2 },
    { name: "Safety", nameBn: "নিরাপত্তা", parent: "Baby Care & Safety", sortOrder: 3 },
    { name: "Grooming", nameBn: "সাজসজ্জা", parent: "Baby Care & Safety", sortOrder: 4 },

    // 4. Toys & Play (5 subcategories)
    { name: "Developmental Toys", nameBn: "উন্নয়নমূলক খেলনা", parent: "Toys & Play", sortOrder: 0 },
    { name: "Plush & Stuffed", nameBn: "প্লাশ ও স্টাফড", parent: "Toys & Play", sortOrder: 1 },
    { name: "Activity Toys", nameBn: "কার্যকলাপ খেলনা", parent: "Toys & Play", sortOrder: 2 },
    { name: "Bath Toys", nameBn: "স্নান খেলনা", parent: "Toys & Play", sortOrder: 3 },
    { name: "Books & Music", nameBn: "বই ও সঙ্গীত", parent: "Toys & Play", sortOrder: 4 },

    // 5. Nursery & Furniture (5 subcategories)
    { name: "Cribs & Beds", nameBn: "ক্রিব ও বিছানা", parent: "Nursery & Furniture", sortOrder: 0 },
    { name: "Bedding", nameBn: "বিছানা", parent: "Nursery & Furniture", sortOrder: 1 },
    { name: "Storage", nameBn: "সংরক্ষণ", parent: "Nursery & Furniture", sortOrder: 2 },
    { name: "Decor", nameBn: "সাজসজ্জা", parent: "Nursery & Furniture", sortOrder: 3 },
    { name: "Seating", nameBn: "বসার জায়গা", parent: "Nursery & Furniture", sortOrder: 4 },

    // 6. Strollers & Travel (5 subcategories)
    { name: "Strollers", nameBn: "স্ট্রলার", parent: "Strollers & Travel", sortOrder: 0 },
    { name: "Car Seats", nameBn: "গাড়ির আসন", parent: "Strollers & Travel", sortOrder: 1 },
    { name: "Baby Carriers", nameBn: "বেবি ক্যারিয়ার", parent: "Strollers & Travel", sortOrder: 2 },
    { name: "Travel Gear", nameBn: "ভ্রমণ গিয়ার", parent: "Strollers & Travel", sortOrder: 3 },
    { name: "Outdoor", nameBn: "আউটডোর", parent: "Strollers & Travel", sortOrder: 4 },

    // 7. Bath Time (5 subcategories)
    { name: "Tubs & Seats", nameBn: "টাব ও সিট", parent: "Bath Time", sortOrder: 0 },
    { name: "Wash", nameBn: "ওয়াশ", parent: "Bath Time", sortOrder: 1 },
    { name: "Towels", nameBn: "তোয়ালে", parent: "Bath Time", sortOrder: 2 },
    { name: "Bath Toys", nameBn: "স্নান খেলনা", parent: "Bath Time", sortOrder: 3 },
    { name: "Safety", nameBn: "নিরাপত্তা", parent: "Bath Time", sortOrder: 4 },

    // 8. Health & Wellness (5 subcategories)
    { name: "First Aid", nameBn: "প্রাথমিক চিকিৎসা", parent: "Health & Wellness", sortOrder: 0 },
    { name: "Medicine", nameBn: "ওষুধ", parent: "Health & Wellness", sortOrder: 1 },
    { name: "Monitoring", nameBn: "পর্যবেক্ষণ", parent: "Health & Wellness", sortOrder: 2 },
    { name: "Teething", nameBn: "দাঁত উঠা", parent: "Health & Wellness", sortOrder: 3 },
    { name: "Allergies", nameBn: "অ্যালার্জি", parent: "Health & Wellness", sortOrder: 4 },

    // 9. Gift Sets & Bundles (4 subcategories)
    { name: "Newborn Sets", nameBn: "নবজাতক সেট", parent: "Gift Sets & Bundles", sortOrder: 0 },
    { name: "Shower Gifts", nameBn: "শাওয়ার উপহার", parent: "Gift Sets & Bundles", sortOrder: 1 },
    { name: "Milestone", nameBn: "মাইলস্টোন", parent: "Gift Sets & Bundles", sortOrder: 2 },
    { name: "By Budget", nameBn: "বাজেট অনুসারে", parent: "Gift Sets & Bundles", sortOrder: 3 },
  ];

  const insertedChildren = await db
    .insert(categories)
    .values(
      childCategories.map((c) => {
        const parent = insertedParents.find((p) => p.name === c.parent);
        // Make slugs unique by combining parent slug and child name for duplicate names
        const uniqueSlug = parent ? `${slugify(c.parent)}-${slugify(c.name)}` : slugify(c.name);
        return {
          name: c.name,
          nameBn: c.nameBn,
          slug: uniqueSlug,
          parentId: parent?.id,
          sortOrder: c.sortOrder,
          depth: 1,
        };
      })
    )
    .returning();

  // Grandchild Categories (Level 2 - Leaf items)
  const grandchildCategories = [
    // Baby Clothing > Tops & T-shirts
    { name: "Bodysuits", nameBn: "বডিস্যুট", parent: "Tops & T-shirts", sortOrder: 0 },
    { name: "Rompers", nameBn: "রম্পার", parent: "Tops & T-shirts", sortOrder: 1 },
    { name: "T-shirts", nameBn: "টি-শার্ট", parent: "Tops & T-shirts", sortOrder: 2 },
    { name: "Sweaters", nameBn: "সোয়েটার", parent: "Tops & T-shirts", sortOrder: 3 },
    { name: "Cardigans", nameBn: "কার্ডিগান", parent: "Tops & T-shirts", sortOrder: 4 },

    // Baby Clothing > Bottoms
    { name: "Pants", nameBn: "প্যান্ট", parent: "Bottoms", sortOrder: 0 },
    { name: "Leggings", nameBn: "লেগিংস", parent: "Bottoms", sortOrder: 1 },
    { name: "Shorts", nameBn: "শর্টস", parent: "Bottoms", sortOrder: 2 },
    { name: "Skirts", nameBn: "স্কার্ট", parent: "Bottoms", sortOrder: 3 },
    { name: "Jeans", nameBn: "জিন্স", parent: "Bottoms", sortOrder: 4 },

    // Baby Clothing > Outerwear
    { name: "Jackets", nameBn: "জ্যাকেট", parent: "Outerwear", sortOrder: 0 },
    { name: "Coats", nameBn: "কোট", parent: "Outerwear", sortOrder: 1 },
    { name: "Snowsuits", nameBn: "স্নোস্যুট", parent: "Outerwear", sortOrder: 2 },
    { name: "Raincoats", nameBn: "রেইনকোট", parent: "Outerwear", sortOrder: 3 },
    { name: "Vests", nameBn: "ভেস্ট", parent: "Outerwear", sortOrder: 4 },

    // Baby Clothing > Sleepwear
    { name: "Pajamas", nameBn: "পাজামা", parent: "Sleepwear", sortOrder: 0 },
    { name: "Sleep Sacks", nameBn: "স্লিপ স্যাক", parent: "Sleepwear", sortOrder: 1 },
    { name: "Nightgowns", nameBn: "নাইটগাউন", parent: "Sleepwear", sortOrder: 2 },
    { name: "Robes", nameBn: "রোব", parent: "Sleepwear", sortOrder: 3 },

    // Baby Clothing > Accessories
    { name: "Hats", nameBn: "হ্যাট", parent: "Accessories", sortOrder: 0 },
    { name: "Socks", nameBn: "মোজা", parent: "Accessories", sortOrder: 1 },
    { name: "Mittens", nameBn: "মিটেন", parent: "Accessories", sortOrder: 2 },
    { name: "Bibs", nameBn: "বিব", parent: "Accessories", sortOrder: 3 },
    { name: "Hair Clips", nameBn: "হেয়ার ক্লিপ", parent: "Accessories", sortOrder: 4 },

    // Feeding & Nursing > Bottles & Nipples
    { name: "Baby Bottles", nameBn: "বেবি বোতল", parent: "Bottles & Nipples", sortOrder: 0 },
    { name: "Nipples", nameBn: "নিপল", parent: "Bottles & Nipples", sortOrder: 1 },
    { name: "Bottle Sets", nameBn: "বোতল সেট", parent: "Bottles & Nipples", sortOrder: 2 },
    { name: "Anti-Colic Bottles", nameBn: "অ্যান্টি-কলিক বোতল", parent: "Bottles & Nipples", sortOrder: 3 },

    // Feeding & Nursing > Breastfeeding
    { name: "Breast Pumps", nameBn: "ব্রেস্ট পাম্প", parent: "Breastfeeding", sortOrder: 0 },
    { name: "Nursing Pads", nameBn: "নার্সিং প্যাড", parent: "Breastfeeding", sortOrder: 1 },
    { name: "Nursing Covers", nameBn: "নার্সিং কভার", parent: "Breastfeeding", sortOrder: 2 },
    { name: "Storage Bags", nameBn: "স্টোরেজ ব্যাগ", parent: "Breastfeeding", sortOrder: 3 },

    // Feeding & Nursing > Feeding Essentials
    { name: "Bibs", nameBn: "বিব", parent: "Feeding Essentials", sortOrder: 0 },
    { name: "Burp Cloths", nameBn: "বার্প কাপড়", parent: "Feeding Essentials", sortOrder: 1 },
    { name: "Bottle Warmers", nameBn: "বোতল ওয়ার্মার", parent: "Feeding Essentials", sortOrder: 2 },
    { name: "Sterilizers", nameBn: "স্টেরিলাইজার", parent: "Feeding Essentials", sortOrder: 3 },

    // Feeding & Nursing > Solid Food
    { name: "High Chairs", nameBn: "হাই চেয়ার", parent: "Solid Food", sortOrder: 0 },
    { name: "Baby Spoons", nameBn: "বেবি চামচ", parent: "Solid Food", sortOrder: 1 },
    { name: "Plates & Bowls", nameBn: "প্লেট ও বাটি", parent: "Solid Food", sortOrder: 2 },
    { name: "Snack Cups", nameBn: "স্ন্যাক কাপ", parent: "Solid Food", sortOrder: 3 },

    // Feeding & Nursing > Formula & Food
    { name: "Baby Formula", nameBn: "বেবি ফর্মুলা", parent: "Formula & Food", sortOrder: 0 },
    { name: "Baby Cereal", nameBn: "বেবি সিরিয়াল", parent: "Formula & Food", sortOrder: 1 },
    { name: "Purees", nameBn: "পিউরি", parent: "Formula & Food", sortOrder: 2 },
    { name: "Snacks", nameBn: "স্ন্যাকস", parent: "Formula & Food", sortOrder: 3 },

    // Baby Care & Safety > Diapering
    { name: "Diapers", nameBn: "ডায়াপার", parent: "Diapering", sortOrder: 0 },
    { name: "Wipes", nameBn: "ওয়াইপস", parent: "Diapering", sortOrder: 1 },
    { name: "Diaper Bags", nameBn: "ডায়াপার ব্যাগ", parent: "Diapering", sortOrder: 2 },
    { name: "Changing Pads", nameBn: "চেঞ্জিং প্যাড", parent: "Diapering", sortOrder: 3 },
    { name: "Rash Cream", nameBn: "র‍্যাশ ক্রিম", parent: "Diapering", sortOrder: 4 },

    // Baby Care & Safety > Skin Care
    { name: "Baby Lotion", nameBn: "বেবি লোশন", parent: "Skin Care", sortOrder: 0 },
    { name: "Baby Oil", nameBn: "বেবি অয়েল", parent: "Skin Care", sortOrder: 1 },
    { name: "Sunscreen", nameBn: "সানস্ক্রিন", parent: "Skin Care", sortOrder: 2 },
    { name: "Diaper Cream", nameBn: "ডায়াপার ক্রিম", parent: "Skin Care", sortOrder: 3 },

    // Baby Care & Safety > Health
    { name: "Thermometers", nameBn: "থার্মোমিটার", parent: "Health", sortOrder: 0 },
    { name: "Nasal Aspirators", nameBn: "নেসাল এসপিরেটর", parent: "Health", sortOrder: 1 },
    { name: "Medicine Dispensers", nameBn: "মেডিসিন ডিসপেনসার", parent: "Health", sortOrder: 2 },
    { name: "Humidifiers", nameBn: "হিউমিডিফায়ার", parent: "Health", sortOrder: 3 },

    // Baby Care & Safety > Safety
    { name: "Baby Monitors", nameBn: "বেবি মনিটর", parent: "Safety", sortOrder: 0 },
    { name: "Gates", nameBn: "গেট", parent: "Safety", sortOrder: 1 },
    { name: "Outlet Covers", nameBn: "আউটলেট কভার", parent: "Safety", sortOrder: 2 },
    { name: "Cabinet Locks", nameBn: "ক্যাবিনেট লক", parent: "Safety", sortOrder: 3 },

    // Baby Care & Safety > Grooming
    { name: "Nail Clippers", nameBn: "নেইল ক্লিপার", parent: "Grooming", sortOrder: 0 },
    { name: "Brushes", nameBn: "ব্রাশ", parent: "Grooming", sortOrder: 1 },
    { name: "Combs", nameBn: "চিরুনি", parent: "Grooming", sortOrder: 2 },
    { name: "Toothbrushes", nameBn: "টুথব্রাশ", parent: "Grooming", sortOrder: 3 },

    // Toys & Play > Developmental Toys
    { name: "Rattles", nameBn: "র‍্যাটল", parent: "Developmental Toys", sortOrder: 0 },
    { name: "Teethers", nameBn: "টিথার", parent: "Developmental Toys", sortOrder: 1 },
    { name: "Sensory Toys", nameBn: "সেন্সরি খেলনা", parent: "Developmental Toys", sortOrder: 2 },
    { name: "Stacking Toys", nameBn: "স্ট্যাকিং খেলনা", parent: "Developmental Toys", sortOrder: 3 },

    // Toys & Play > Plush & Stuffed
    { name: "Teddy Bears", nameBn: "টেডি বিয়ার", parent: "Plush & Stuffed", sortOrder: 0 },
    { name: "Animal Plush", nameBn: "প্রাণী প্লাশ", parent: "Plush & Stuffed", sortOrder: 1 },
    { name: "Character Toys", nameBn: "চরিত্র খেলনা", parent: "Plush & Stuffed", sortOrder: 2 },
    { name: "Comfort Toys", nameBn: "কমফোর্ট খেলনা", parent: "Plush & Stuffed", sortOrder: 3 },

    // Toys & Play > Activity Toys
    { name: "Play Gyms", nameBn: "প্লে জিম", parent: "Activity Toys", sortOrder: 0 },
    { name: "Activity Centers", nameBn: "অ্যাক্টিভিটি সেন্টার", parent: "Activity Toys", sortOrder: 1 },
    { name: "Bouncers", nameBn: "বাউন্সার", parent: "Activity Toys", sortOrder: 2 },
    { name: "Walkers", nameBn: "ওয়াকার", parent: "Activity Toys", sortOrder: 3 },

    // Toys & Play > Bath Toys (duplicate - part of Toys & Play)
    { name: "Rubber Ducks", nameBn: "রাবার হাঁস", parent: "Bath Toys", sortOrder: 0, parentCategory: "Toys & Play" },
    { name: "Floating Toys", nameBn: "ভাসমান খেলনা", parent: "Bath Toys", sortOrder: 1, parentCategory: "Toys & Play" },
    { name: "Squirt Toys", nameBn: "স্কার্ট খেলনা", parent: "Bath Toys", sortOrder: 2, parentCategory: "Toys & Play" },
    { name: "Bath Books", nameBn: "স্নান বই", parent: "Bath Toys", sortOrder: 3, parentCategory: "Toys & Play" },

    // Toys & Play > Books & Music
    { name: "Board Books", nameBn: "বোর্ড বই", parent: "Books & Music", sortOrder: 0 },
    { name: "Cloth Books", nameBn: "কাপড়ের বই", parent: "Books & Music", sortOrder: 1 },
    { name: "Musical Toys", nameBn: "মিউজিক্যাল খেলনা", parent: "Books & Music", sortOrder: 2 },
    { name: "Sound Books", nameBn: "সাউন্ড বই", parent: "Books & Music", sortOrder: 3 },

    // Nursery & Furniture > Cribs & Beds
    { name: "Cribs", nameBn: "ক্রিব", parent: "Cribs & Beds", sortOrder: 0 },
    { name: "Bassinets", nameBn: "ব্যাসিনেট", parent: "Cribs & Beds", sortOrder: 1 },
    { name: "Toddler Beds", nameBn: "টডলার বিছানা", parent: "Cribs & Beds", sortOrder: 2 },
    { name: "Bed Rails", nameBn: "বেড রেল", parent: "Cribs & Beds", sortOrder: 3 },

    // Nursery & Furniture > Bedding
    { name: "Crib Sheets", nameBn: "ক্রিব শিট", parent: "Bedding", sortOrder: 0 },
    { name: "Blankets", nameBn: "কম্বল", parent: "Bedding", sortOrder: 1 },
    { name: "Mattresses", nameBn: "গদি", parent: "Bedding", sortOrder: 2 },
    { name: "Pillows", nameBn: "বালিশ", parent: "Bedding", sortOrder: 3 },

    // Nursery & Furniture > Storage
    { name: "Dressers", nameBn: "ড্রেসার", parent: "Storage", sortOrder: 0 },
    { name: "Shelves", nameBn: "তাক", parent: "Storage", sortOrder: 1 },
    { name: "Toy Boxes", nameBn: "খেলনা বাক্স", parent: "Storage", sortOrder: 2 },
    { name: "Closet Organizers", nameBn: "আলমারি সংগঠক", parent: "Storage", sortOrder: 3 },

    // Nursery & Furniture > Decor
    { name: "Wall Art", nameBn: "দেয়াল শিল্প", parent: "Decor", sortOrder: 0 },
    { name: "Mobiles", nameBn: "মোবাইল", parent: "Decor", sortOrder: 1 },
    { name: "Night Lights", nameBn: "রাতের আলো", parent: "Decor", sortOrder: 2 },
    { name: "Rugs", nameBn: "রাগ", parent: "Decor", sortOrder: 3 },

    // Nursery & Furniture > Seating
    { name: "Rocking Chairs", nameBn: "রকিং চেয়ার", parent: "Seating", sortOrder: 0 },
    { name: "Gliders", nameBn: "গ্লাইডার", parent: "Seating", sortOrder: 1 },
    { name: "Nursing Chairs", nameBn: "নার্সিং চেয়ার", parent: "Seating", sortOrder: 2 },
    { name: "Ottomans", nameBn: "অটোম্যান", parent: "Seating", sortOrder: 3 },

    // Strollers & Travel > Strollers
    { name: "Full-Size Strollers", nameBn: "ফুল-সাইজ স্ট্রলার", parent: "Strollers", sortOrder: 0 },
    { name: "Umbrella Strollers", nameBn: "ছাতা স্ট্রলার", parent: "Strollers", sortOrder: 1 },
    { name: "Jogging Strollers", nameBn: "জগিং স্ট্রলার", parent: "Strollers", sortOrder: 2 },
    { name: "Double Strollers", nameBn: "ডাবল স্ট্রলার", parent: "Strollers", sortOrder: 3 },

    // Strollers & Travel > Car Seats
    { name: "Infant Seats", nameBn: "শিশু আসন", parent: "Car Seats", sortOrder: 0 },
    { name: "Convertible Seats", nameBn: "রূপান্তরযোগ্য আসন", parent: "Car Seats", sortOrder: 1 },
    { name: "Booster Seats", nameBn: "বুস্টার আসন", parent: "Car Seats", sortOrder: 2 },
    { name: "Car Seat Bases", nameBn: "কার সিট বেস", parent: "Car Seats", sortOrder: 3 },

    // Strollers & Travel > Baby Carriers
    { name: "Wraps", nameBn: "র‍্যাপ", parent: "Baby Carriers", sortOrder: 0 },
    { name: "Structured Carriers", nameBn: "কাঠামোগত ক্যারিয়ার", parent: "Baby Carriers", sortOrder: 1 },
    { name: "Hip Carriers", nameBn: "হিপ ক্যারিয়ার", parent: "Baby Carriers", sortOrder: 2 },
    { name: "Slings", nameBn: "স্লিং", parent: "Baby Carriers", sortOrder: 3 },

    // Strollers & Travel > Travel Gear
    { name: "Diaper Bags", nameBn: "ডায়াপার ব্যাগ", parent: "Travel Gear", sortOrder: 0 },
    { name: "Travel Cribs", nameBn: "ভ্রমণ ক্রিব", parent: "Travel Gear", sortOrder: 1 },
    { name: "Portable Changing Pads", nameBn: "পোর্টেবল চেঞ্জিং প্যাড", parent: "Travel Gear", sortOrder: 2 },
    { name: "Stroller Accessories", nameBn: "স্ট্রলার আনুষাঙ্গিক", parent: "Travel Gear", sortOrder: 3 },

    // Strollers & Travel > Outdoor
    { name: "Sun Shades", nameBn: "সান শেড", parent: "Outdoor", sortOrder: 0 },
    { name: "Rain Covers", nameBn: "রেইন কভার", parent: "Outdoor", sortOrder: 1 },
    { name: "Mosquito Nets", nameBn: "মশারি", parent: "Outdoor", sortOrder: 2 },
    { name: "Stroller Fans", nameBn: "স্ট্রলার ফ্যান", parent: "Outdoor", sortOrder: 3 },

    // Bath Time > Tubs & Seats
    { name: "Baby Tubs", nameBn: "বেবি টাব", parent: "Tubs & Seats", sortOrder: 0 },
    { name: "Bath Seats", nameBn: "স্নান আসন", parent: "Tubs & Seats", sortOrder: 1 },
    { name: "Foldable Tubs", nameBn: "ভাঁজযোগ্য টাব", parent: "Tubs & Seats", sortOrder: 2 },
    { name: "Inflatable Tubs", nameBn: "ফোলানো টাব", parent: "Tubs & Seats", sortOrder: 3 },

    // Bath Time > Wash
    { name: "Baby Shampoo", nameBn: "বেবি শ্যাম্পু", parent: "Wash", sortOrder: 0 },
    { name: "Body Wash", nameBn: "বডি ওয়াশ", parent: "Wash", sortOrder: 1 },
    { name: "Bubble Bath", nameBn: "বাবল বাথ", parent: "Wash", sortOrder: 2 },
    { name: "2-in-1 Wash", nameBn: "২-ইন-১ ওয়াশ", parent: "Wash", sortOrder: 3 },

    // Bath Time > Towels
    { name: "Hooded Towels", nameBn: "হুডেড তোয়ালে", parent: "Towels", sortOrder: 0 },
    { name: "Washcloths", nameBn: "ওয়াশক্লথ", parent: "Towels", sortOrder: 1 },
    { name: "Bath Robes", nameBn: "বাথ রোব", parent: "Towels", sortOrder: 2 },
    { name: "Towel Sets", nameBn: "তোয়ালে সেট", parent: "Towels", sortOrder: 3 },

    // Bath Time > Bath Toys (duplicate - part of Bath Time)
    { name: "Rubber Ducks", nameBn: "রাবার হাঁস", parent: "Bath Toys", sortOrder: 0, parentCategory: "Bath Time" },
    { name: "Stacking Cups", nameBn: "স্ট্যাকিং কাপ", parent: "Bath Toys", sortOrder: 1, parentCategory: "Bath Time" },
    { name: "Water Wheels", nameBn: "ওয়াটার হুইল", parent: "Bath Toys", sortOrder: 2, parentCategory: "Bath Time" },
    { name: "Bath Books", nameBn: "স্নান বই", parent: "Bath Toys", sortOrder: 3, parentCategory: "Bath Time" },

    // Bath Time > Safety (duplicate - part of Bath Time)
    { name: "Bath Thermometers", nameBn: "স্নান থার্মোমিটার", parent: "Safety", sortOrder: 0, parentCategory: "Bath Time" },
    { name: "Non-Slip Mats", nameBn: "নন-স্লিপ ম্যাট", parent: "Safety", sortOrder: 1, parentCategory: "Bath Time" },
    { name: "Faucet Covers", nameBn: "কল কভার", parent: "Safety", sortOrder: 2, parentCategory: "Bath Time" },
    { name: "Knee Pads", nameBn: "হাঁটু প্যাড", parent: "Safety", sortOrder: 3, parentCategory: "Bath Time" },

    // Health & Wellness > First Aid
    { name: "First Aid Kits", nameBn: "প্রাথমিক চিকিৎসা কিট", parent: "First Aid", sortOrder: 0 },
    { name: "Bandages", nameBn: "ব্যান্ডেজ", parent: "First Aid", sortOrder: 1 },
    { name: "Antiseptic", nameBn: "এন্টিসেপটিক", parent: "First Aid", sortOrder: 2 },
    { name: "Ice Packs", nameBn: "আইস প্যাক", parent: "First Aid", sortOrder: 3 },

    // Health & Wellness > Medicine
    { name: "Pain Relief", nameBn: "ব্যথা উপশম", parent: "Medicine", sortOrder: 0 },
    { name: "Cold & Flu", nameBn: "ঠান্ডা ও ফ্লু", parent: "Medicine", sortOrder: 1 },
    { name: "Vitamins", nameBn: "ভিটামিন", parent: "Medicine", sortOrder: 2 },
    { name: "Probiotics", nameBn: "প্রোবায়োটিক", parent: "Medicine", sortOrder: 3 },

    // Health & Wellness > Monitoring
    { name: "Thermometers", nameBn: "থার্মোমিটার", parent: "Monitoring", sortOrder: 0 },
    { name: "Pulse Oximeters", nameBn: "পালস অক্সিমিটার", parent: "Monitoring", sortOrder: 1 },
    { name: "Baby Scales", nameBn: "বেবি স্কেল", parent: "Monitoring", sortOrder: 2 },
    { name: "Growth Charts", nameBn: "বৃদ্ধি চার্ট", parent: "Monitoring", sortOrder: 3 },

    // Health & Wellness > Teething
    { name: "Teething Gels", nameBn: "টিথিং জেল", parent: "Teething", sortOrder: 0 },
    { name: "Teethers", nameBn: "টিথার", parent: "Teething", sortOrder: 1 },
    { name: "Teething Tablets", nameBn: "টিথিং ট্যাবলেট", parent: "Teething", sortOrder: 2 },
    { name: "Cold Packs", nameBn: "কোল্ড প্যাক", parent: "Teething", sortOrder: 3 },

    // Health & Wellness > Allergies
    { name: "Allergy Relief", nameBn: "অ্যালার্জি উপশম", parent: "Allergies", sortOrder: 0 },
    { name: "Air Purifiers", nameBn: "এয়ার পিউরিফায়ার", parent: "Allergies", sortOrder: 1 },
    { name: "Hypoallergenic Products", nameBn: "হাইপোঅ্যালার্জেনিক পণ্য", parent: "Allergies", sortOrder: 2 },

    // Gift Sets & Bundles > Newborn Sets
    { name: "Welcome Baby Sets", nameBn: "ওয়েলকাম বেবি সেট", parent: "Newborn Sets", sortOrder: 0 },
    { name: "Hospital Bags", nameBn: "হাসপাতাল ব্যাগ", parent: "Newborn Sets", sortOrder: 1 },
    { name: "Essentials Bundles", nameBn: "প্রয়োজনীয় বান্ডেল", parent: "Newborn Sets", sortOrder: 2 },

    // Gift Sets & Bundles > Shower Gifts
    { name: "Gift Baskets", nameBn: "উপহার ঝুড়ি", parent: "Shower Gifts", sortOrder: 0 },
    { name: "Keepsakes", nameBn: "স্মৃতিচিহ্ন", parent: "Shower Gifts", sortOrder: 1 },
    { name: "Personalized Gifts", nameBn: "ব্যক্তিগতকৃত উপহার", parent: "Shower Gifts", sortOrder: 2 },

    // Gift Sets & Bundles > Milestone
    { name: "First Birthday", nameBn: "প্রথম জন্মদিন", parent: "Milestone", sortOrder: 0 },
    { name: "Christening", nameBn: "ক্রিশ্চেনিং", parent: "Milestone", sortOrder: 1 },
    { name: "Holiday Sets", nameBn: "ছুটির দিন সেট", parent: "Milestone", sortOrder: 2 },

    // Gift Sets & Bundles > By Budget
    { name: "Under $25", nameBn: "$২৫ এর নিচে", parent: "By Budget", sortOrder: 0 },
    { name: "$25-$50", nameBn: "$২৫-$৫০", parent: "By Budget", sortOrder: 1 },
    { name: "$50-$100", nameBn: "$৫০-$১০০", parent: "By Budget", sortOrder: 2 },
    { name: "Luxury Gifts", nameBn: "বিলাসবহুল উপহার", parent: "By Budget", sortOrder: 3 },
  ];

  const insertedGrandchildren = await db
    .insert(categories)
    .values(
      grandchildCategories.map((c) => {
        // For items with parentCategory specified, find parent matching both name and grandparent
        let parent;
        if ('parentCategory' in c && c.parentCategory) {
          const grandparentId = insertedParents.find((gp) => gp.name === c.parentCategory)?.id;
          parent = insertedChildren.find((p) => p.name === c.parent && p.parentId === grandparentId);
        } else {
          parent = insertedChildren.find((p) => p.name === c.parent);
        }
        // Use the parent's slug (which already includes grandparent) to ensure uniqueness
        const uniqueSlug = parent ? `${parent.slug}-${slugify(c.name)}` : slugify(c.name);
        return {
          name: c.name,
          nameBn: c.nameBn,
          slug: uniqueSlug,
          parentId: parent?.id,
          sortOrder: c.sortOrder,
          depth: 2,
        };
      })
    )
    .returning();

  const allCategories = [...insertedParents, ...insertedChildren, ...insertedGrandchildren];

  console.log(`✅ Created ${allCategories.length} categories (${insertedParents.length} parent + ${insertedChildren.length} subcategories + ${insertedGrandchildren.length} items)`);

  // 4. Seed Products (100+ products)
  console.log("Creating products...");
  const productTemplates = [
    // Baby Clothing products
    { prefix: "Soft Cotton", category: "Bodysuits", ageRanges: ["0-3 months", "3-6 months", "6-12 months"] },
    { prefix: "Organic", category: "Rompers", ageRanges: ["0-3 months", "3-6 months"] },
    { prefix: "Cozy", category: "Sweaters", ageRanges: ["6-12 months", "1-2 years"] },
    { prefix: "Warm", category: "Jackets", ageRanges: ["6-12 months", "1-2 years"] },
    { prefix: "Summer", category: "Shorts", ageRanges: ["3-6 months", "6-12 months"] },
    { prefix: "Sleepy Time", category: "Pajamas", ageRanges: ["0-3 months", "3-6 months"] },
    { prefix: "Adorable", category: "Hats", ageRanges: ["0-6 months", "6-12 months"] },

    // Feeding products
    { prefix: "Premium", category: "Baby Bottles", ageRanges: ["0-6 months", "6-12 months"] },
    { prefix: "Anti-Colic", category: "Baby Bottles", ageRanges: ["0-3 months", "3-6 months"] },
    { prefix: "Electric", category: "Breast Pumps", ageRanges: ["0-6 months", "6-12 months"] },
    { prefix: "Waterproof", category: "Bibs", ageRanges: ["3-6 months", "6-12 months"] },
    { prefix: "Organic", category: "Baby Cereal", ageRanges: ["6-12 months", "1-2 years"] },

    // Baby Care products
    { prefix: "Premium", category: "Diapers", ageRanges: ["Newborn", "0-6 months", "6-12 months"] },
    { prefix: "Eco-Friendly", category: "Wipes", ageRanges: ["0-6 months", "6-12 months"] },
    { prefix: "Gentle", category: "Baby Lotion", ageRanges: ["0-12 months", "1-3 years"] },
    { prefix: "Organic", category: "Baby Oil", ageRanges: ["0-6 months", "6-12 months"] },

    // Nursery
    { prefix: "Soft Fleece", category: "Blankets", ageRanges: ["0-12 months", "1-3 years"] },
    { prefix: "Comfortable", category: "Crib Sheets", ageRanges: ["0-12 months", "1-3 years"] },

    // Toys
    { prefix: "Plush", category: "Teddy Bears", ageRanges: ["0-6 months", "6-12 months", "1-2 years"] },
    { prefix: "Educational", category: "Stacking Toys", ageRanges: ["6-12 months", "1-2 years", "2-3 years"] },
    { prefix: "Musical", category: "Musical Toys", ageRanges: ["6-12 months", "1-2 years"] },
    { prefix: "Interactive", category: "Play Gyms", ageRanges: ["0-6 months", "6-12 months"] },

    // Gift Sets
    { prefix: "Deluxe", category: "Welcome Baby Sets", ageRanges: ["0-3 months", "3-6 months", "6-12 months"] },
    { prefix: "Essential", category: "Essentials Bundles", ageRanges: ["Newborn", "0-6 months"] },
    { prefix: "Festival", category: "Holiday Sets", ageRanges: ["0-12 months", "1-2 years"] },
  ];

  const colors = ["Blue", "Pink", "Yellow", "Green", "White", "Gray", "Beige"];
  const sizes = ["Newborn", "0-3M", "3-6M", "6-12M", "12-18M", "18-24M"];
  const adjectives = ["Premium", "Soft", "Cozy", "Gentle", "Adorable", "Cute", "Sweet", "Lovely"];

  const productInserts = [];
  let productIndex = 0;

  for (const template of productTemplates) {
    const category = allCategories.find(
      (c) => c.name === template.category || c.name === template.category.split(" ")[0]
    );
    if (!category) continue;

    for (let i = 0; i < 6; i++) {
      const adj = faker.helpers.arrayElement(adjectives);
      const color = faker.helpers.arrayElement(colors);
      const title = `${template.prefix} ${adj} ${template.category} - ${color}`;
      const titleBn = `${template.prefix} ${adj} ${template.category} - ${color}`;
      const ageRange = faker.helpers.arrayElement(template.ageRanges);
      const vendor = faker.helpers.arrayElement(insertedVendors);
      const brand = faker.helpers.arrayElement(brandData);

      productInserts.push({
        title,
        titleBn,
        slug: slugify(`${title}-${productIndex}`),
        vendorId: vendor.id,
        categoryId: category.id,
        brand: brand.name,
        shortDescription: `High-quality ${template.category.toLowerCase()} perfect for your little one. ${ageRange} age range.`,
        shortDescriptionBn: `আপনার ছোট্ট সোনার জন্য উচ্চ মানের ${template.category.toLowerCase()}। ${ageRange} বয়স পরিসীমা।`,
        description: faker.commerce.productDescription(),
        ageRange,
        ratingAvg: faker.number.float({ min: 3.5, max: 5, fractionDigits: 1 }),
        ratingCount: faker.number.int({ min: 5, max: 200 }),
        bestSellerScore: faker.number.int({ min: 0, max: 1000 }),
        isNew: faker.datatype.boolean({ probability: 0.3 }),
        isHot: faker.datatype.boolean({ probability: 0.2 }),
        isActive: true,
      });
      productIndex++;
    }
  }

  const insertedProducts = await db.insert(products).values(productInserts).returning();

  // 5. Seed Product Images, Options, and SKUs
  console.log("Creating product images, options, and SKUs...");

  for (const product of insertedProducts) {
    // Add 2-4 images per product
    const imageCount = faker.number.int({ min: 2, max: 4 });
    const productImageInserts = [];
    for (let i = 0; i < imageCount; i++) {
      productImageInserts.push({
        productId: product.id,
        url: faker.helpers.arrayElement(productImageUrls),
        alt: `${product.title} - Image ${i + 1}`,
        sortOrder: i,
      });
    }
    await db.insert(productImages).values(productImageInserts);

    // Add options (Size and sometimes Color)
    const hasColorOption = faker.datatype.boolean({ probability: 0.7 });
    const productOptionInserts = [
      {
        productId: product.id,
        name: "Size",
        nameBn: "সাইজ",
        values: faker.helpers.arrayElements(sizes, { min: 2, max: 4 }),
        sortOrder: 0,
      },
    ];

    if (hasColorOption) {
      productOptionInserts.push({
        productId: product.id,
        name: "Color",
        nameBn: "রং",
        values: faker.helpers.arrayElements(colors, { min: 2, max: 4 }),
        sortOrder: 1,
      });
    }

    const insertedOptions = await db.insert(productOptions).values(productOptionInserts).returning();

    // Create SKUs for option combinations
    const sizeOption = insertedOptions.find((o) => o.name === "Size");
    const colorOption = insertedOptions.find((o) => o.name === "Color");

    const basePrice = faker.number.int({ min: 30000, max: 250000 }); // 300-2500 BDT in paisa
    const hasDiscount = faker.datatype.boolean({ probability: 0.4 });
    const discountPercent = hasDiscount ? faker.number.int({ min: 10, max: 40 }) : 0;
    const compareAtPrice = hasDiscount ? Math.round(basePrice / (1 - discountPercent / 100)) : null;

    const skuInserts = [];
    const sizeValues = sizeOption?.values || ["One Size"];
    const shortId = product.id.split("-")[0]; // Use first part of UUID for uniqueness

    if (colorOption) {
      for (const size of sizeValues) {
        for (const color of colorOption.values || []) {
          skuInserts.push({
            productId: product.id,
            sku: `SKU-${shortId}-${size}-${color}`.toUpperCase().replace(/\s+/g, ""),
            optionValues: { Size: size, Color: color },
            priceAmount: basePrice,
            compareAtAmount: compareAtPrice,
            currency: "BDT",
            stockQty: faker.number.int({ min: 0, max: 50 }),
            isAvailable: faker.datatype.boolean({ probability: 0.9 }),
          });
        }
      }
    } else {
      for (const size of sizeValues) {
        skuInserts.push({
          productId: product.id,
          sku: `SKU-${shortId}-${size}`.toUpperCase().replace(/\s+/g, ""),
          optionValues: { Size: size },
          priceAmount: basePrice,
          compareAtAmount: compareAtPrice,
          currency: "BDT",
          stockQty: faker.number.int({ min: 0, max: 50 }),
          isAvailable: faker.datatype.boolean({ probability: 0.9 }),
        });
      }
    }

    await db.insert(productSkus).values(skuInserts);
  }

  // 6. Seed Campaigns
  console.log("Creating campaigns...");
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const campaignData = [
    {
      placement: "heroCarousel",
      title: "Baby Essentials Sale",
      titleBn: "শিশুর প্রয়োজনীয় সেল",
      subtitle: "Up to 50% off on all baby clothing",
      subtitleBn: "সমস্ত শিশুর পোশাকে ৫০% পর্যন্ত ছাড়",
      theme: "coral",
      ctaText: "Shop Now",
      ctaTextBn: "এখনই কিনুন",
      ctaLink: "/catalog?category=clothing",
      discountPercent: 50,
      endsAt: nextMonth,
    },
    {
      placement: "heroCarousel",
      title: "New Arrivals",
      titleBn: "নতুন আগমন",
      subtitle: "Fresh styles for your little one",
      subtitleBn: "আপনার ছোট্ট সোনার জন্য তাজা স্টাইল",
      theme: "teal",
      ctaText: "Explore",
      ctaTextBn: "অন্বেষণ করুন",
      ctaLink: "/catalog?sort=newest",
      endsAt: nextMonth,
    },
    {
      placement: "heroCarousel",
      title: "Gift Sets Collection",
      titleBn: "উপহার সেট সংগ্রহ",
      subtitle: "Perfect presents for baby showers",
      subtitleBn: "বেবি শাওয়ারের জন্য নিখুঁত উপহার",
      theme: "purple",
      ctaText: "View Collection",
      ctaTextBn: "সংগ্রহ দেখুন",
      ctaLink: "/catalog?category=gift-sets",
      endsAt: nextMonth,
    },
    {
      placement: "dealWall",
      title: "Flash Sale",
      titleBn: "ফ্ল্যাশ সেল",
      subtitle: "24 hours only!",
      subtitleBn: "শুধুমাত্র ২৪ ঘণ্টা!",
      theme: "amber",
      ctaText: "Grab Deal",
      ctaTextBn: "ডিল নিন",
      ctaLink: "/catalog?sort=bestseller",
      discountPercent: 40,
      endsAt: nextWeek,
    },
    {
      placement: "dealWall",
      title: "Toy Bonanza",
      titleBn: "খেলনা বোনানজা",
      subtitle: "Educational toys at best prices",
      subtitleBn: "সেরা দামে শিক্ষামূলক খেলনা",
      theme: "teal",
      ctaText: "Shop Toys",
      ctaTextBn: "খেলনা কিনুন",
      ctaLink: "/catalog?category=toys",
      discountPercent: 30,
      endsAt: nextMonth,
    },
    {
      placement: "dealWall",
      title: "Diaper Deals",
      titleBn: "ডায়াপার ডিল",
      subtitle: "Stock up & save big",
      subtitleBn: "মজুদ করুন এবং সাশ্রয় করুন",
      theme: "coral",
      ctaText: "View Deals",
      ctaTextBn: "ডিল দেখুন",
      ctaLink: "/catalog?category=diapers-care",
      discountPercent: 25,
      endsAt: nextMonth,
    },
  ];

  const insertedCampaigns = await db
    .insert(campaigns)
    .values(
      campaignData.map((c, i) => ({
        ...c,
        imageUrl: faker.helpers.arrayElement(campaignImageUrls),
        sortOrder: i,
        startsAt: now,
      }))
    )
    .returning();

  // Link some products to campaigns
  console.log("Linking products to campaigns...");
  const campaignProductInserts: { campaignId: string; productId: string; sortOrder: number }[] = [];

  for (const campaign of insertedCampaigns) {
    const randomProducts = faker.helpers.arrayElements(insertedProducts, {
      min: 6,
      max: 12,
    });
    randomProducts.forEach((product, i) => {
      campaignProductInserts.push({
        campaignId: campaign.id,
        productId: product.id,
        sortOrder: i,
      });
    });
  }

  await db.insert(campaignProducts).values(campaignProductInserts);

  // 7. Seed Homepage Content
  console.log("Creating homepage content...");

  // Testimonials
  const testimonialData = [
    {
      quote: "KineDao has everything I need for my baby. The quality is amazing and delivery is super fast!",
      quoteBn: "কিনেদাও-তে আমার শিশুর জন্য যা দরকার সব আছে। গুণমান অসাধারণ এবং ডেলিভারি খুব দ্রুত!",
      customerName: "Fatima Rahman",
      location: "Dhaka",
      locationBn: "ঢাকা",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      rating: 5,
      sortOrder: 0,
    },
    {
      quote: "Best baby products marketplace in Bangladesh. I love the variety and the prices are very reasonable.",
      quoteBn: "বাংলাদেশের সেরা শিশু পণ্যের মার্কেটপ্লেস। আমি বৈচিত্র্য পছন্দ করি এবং দামও অনেক যুক্তিসঙ্গত।",
      customerName: "Ayesha Khan",
      location: "Chittagong",
      locationBn: "চট্টগ্রাম",
      avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      rating: 5,
      sortOrder: 1,
    },
    {
      quote: "The organic baby products selection is excellent. My baby's skin has never been better!",
      quoteBn: "জৈব শিশু পণ্যের নির্বাচন চমৎকার। আমার শিশুর ত্বক আগের চেয়ে অনেক ভালো!",
      customerName: "Nadia Islam",
      location: "Sylhet",
      locationBn: "সিলেট",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      rating: 5,
      sortOrder: 2,
    },
    {
      quote: "Safe packaging and genuine products. Finally a trustworthy online baby store in Bangladesh!",
      quoteBn: "নিরাপদ প্যাকেজিং এবং আসল পণ্য। অবশেষে বাংলাদেশে একটি বিশ্বস্ত অনলাইন শিশু স্টোর!",
      customerName: "Rashida Begum",
      location: "Rajshahi",
      locationBn: "রাজশাহী",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
      rating: 5,
      sortOrder: 3,
    },
    {
      quote: "Customer service is outstanding. They helped me choose the perfect stroller for my needs.",
      quoteBn: "গ্রাহক সেবা অসাধারণ। তারা আমাকে আমার প্রয়োজনের জন্য নিখুঁত স্ট্রলার বেছে নিতে সাহায্য করেছে।",
      customerName: "Tasnim Ahmed",
      location: "Khulna",
      locationBn: "খুলনা",
      avatarUrl: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&h=100&fit=crop",
      rating: 5,
      sortOrder: 4,
    },
  ];

  const insertedTestimonials = await db.insert(testimonials).values(testimonialData).returning();

  // Featured Collections
  const featuredCollectionData = [
    {
      title: "Newborn Essentials",
      titleBn: "নবজাতক প্রয়োজনীয়",
      description: "Everything you need for your newborn's first months",
      descriptionBn: "আপনার নবজাতকের প্রথম মাসের জন্য যা দরকার সব",
      imageUrl: "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600",
      link: "/catalog?age=0-3months",
      bgColor: "baby-pink",
      sortOrder: 0,
    },
    {
      title: "Organic & Natural",
      titleBn: "জৈব ও প্রাকৃতিক",
      description: "Safe, chemical-free products for sensitive skin",
      descriptionBn: "সংবেদনশীল ত্বকের জন্য নিরাপদ, রাসায়নিক-মুক্ত পণ্য",
      imageUrl: "https://images.unsplash.com/photo-1600369672770-985fd30004eb?w=600",
      link: "/catalog?category=organic-skincare",
      bgColor: "baby-mint",
      sortOrder: 1,
    },
    {
      title: "Playtime Favorites",
      titleBn: "খেলার সময়ের প্রিয়",
      description: "Educational toys that make learning fun",
      descriptionBn: "শিক্ষামূলক খেলনা যা শেখাকে মজাদার করে",
      imageUrl: "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=600",
      link: "/catalog?category=toys-entertainment",
      bgColor: "baby-blue",
      sortOrder: 2,
    },
  ];

  const insertedCollections = await db.insert(featuredCollections).values(featuredCollectionData).returning();

  // Instagram Posts (curated baby lifestyle images)
  const instagramPostData = [
    {
      imageUrl: "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400&h=400&fit=crop",
      alt: "Baby in cute outfit",
      link: "https://instagram.com/kinedao",
      sortOrder: 0,
    },
    {
      imageUrl: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=400&fit=crop",
      alt: "Colorful baby toys",
      link: "https://instagram.com/kinedao",
      sortOrder: 1,
    },
    {
      imageUrl: "https://images.unsplash.com/photo-1566004100631-35d015d6a491?w=400&h=400&fit=crop",
      alt: "Cozy nursery setup",
      link: "https://instagram.com/kinedao",
      sortOrder: 2,
    },
    {
      imageUrl: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=400&fit=crop",
      alt: "Baby sleeping peacefully",
      link: "https://instagram.com/kinedao",
      sortOrder: 3,
    },
    {
      imageUrl: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400&h=400&fit=crop",
      alt: "Baby products flatlay",
      link: "https://instagram.com/kinedao",
      sortOrder: 4,
    },
    {
      imageUrl: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400&h=400&fit=crop",
      alt: "Baby playing with toys",
      link: "https://instagram.com/kinedao",
      sortOrder: 5,
    },
    {
      imageUrl: "https://images.unsplash.com/photo-1559715745-e1b33a271c8f?w=400&h=400&fit=crop",
      alt: "Cute stuffed animal",
      link: "https://instagram.com/kinedao",
      sortOrder: 6,
    },
    {
      imageUrl: "https://images.unsplash.com/photo-1604917621956-10dfa7cce2e7?w=400&h=400&fit=crop",
      alt: "Baby essentials",
      link: "https://instagram.com/kinedao",
      sortOrder: 7,
    },
  ];

  const insertedInstagramPosts = await db.insert(instagramPosts).values(instagramPostData).returning();

  // 8. Seed Mega Menu Featured Products
  console.log("Creating mega menu featured products...");

  const megaMenuFeaturedInserts: Array<{
    categoryId: string;
    productId: string;
    sortOrder: number;
    isActive: boolean;
  }> = [];

  // For each parent category, select 6 random products from that category or its children
  for (const parentCat of insertedParents) {
    // Get all products under this parent category (including children categories)
    const childCategoryIds = insertedChildren
      .filter((child) => child.parentId === parentCat.id)
      .map((child) => child.id);

    const grandchildCategoryIds = insertedGrandchildren
      .filter((grandchild) => {
        const parent = insertedChildren.find((c) => c.id === grandchild.parentId);
        return parent && parent.parentId === parentCat.id;
      })
      .map((grandchild) => grandchild.id);

    const allCategoryIds = [parentCat.id, ...childCategoryIds, ...grandchildCategoryIds];

    // Get products from these categories
    const categoryProducts = insertedProducts.filter((product) =>
      allCategoryIds.includes(product.categoryId)
    );

    // Select up to 6 random products
    const selectedProducts = faker.helpers.arrayElements(
      categoryProducts,
      { min: Math.min(4, categoryProducts.length), max: Math.min(6, categoryProducts.length) }
    );

    // Add them as featured products
    selectedProducts.forEach((product, index) => {
      megaMenuFeaturedInserts.push({
        categoryId: parentCat.id,
        productId: product.id,
        sortOrder: index,
        isActive: true,
      });
    });
  }

  const insertedMegaMenuFeatured = await db
    .insert(megaMenuFeaturedProducts)
    .values(megaMenuFeaturedInserts)
    .returning();

  console.log("✅ Database seeded successfully!");
  console.log(`   - ${insertedVendors.length} vendors`);
  console.log(`   - ${allCategories.length} categories`);
  console.log(`   - ${insertedProducts.length} products`);
  console.log(`   - ${insertedCampaigns.length} campaigns`);
  console.log(`   - ${insertedMegaMenuFeatured.length} mega menu featured products`);
  console.log(`   - ${insertedTestimonials.length} testimonials`);
  console.log(`   - ${insertedCollections.length} featured collections`);
  console.log(`   - ${insertedInstagramPosts.length} instagram posts`);

  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
