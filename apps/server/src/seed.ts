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

  // 3. Seed Categories (comprehensive Bangladesh-focused catalog)
  console.log("Creating comprehensive category structure...");

  // Parent Categories (10 main categories)
  const parentCategories = [
    {
      name: "Baby Clothing & Fashion",
      nameBn: "পোশাক ও ফ্যাশন",
      icon: "Shirt",
      imageUrl: "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600",
    },
    {
      name: "Feeding & Nursing",
      nameBn: "খাওয়ানো ও স্তন্যপান",
      icon: "Milk",
      imageUrl: "https://images.unsplash.com/photo-1590859808308-3d2d9c515b1a?w=600",
    },
    {
      name: "Diapering & Potty",
      nameBn: "ডায়াপার ও পটি",
      icon: "Shield",
      imageUrl: "https://images.unsplash.com/photo-1609220136736-443140cffec6?w=600",
    },
    {
      name: "Bath & Skincare",
      nameBn: "গোসল ও ত্বক যত্ন",
      icon: "Bath",
      imageUrl: "https://images.unsplash.com/photo-1600369672770-985fd30004eb?w=600",
    },
    {
      name: "Toys & Entertainment",
      nameBn: "খেলনা ও বিনোদন",
      icon: "ToyBrick",
      imageUrl: "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=600",
    },
    {
      name: "Nursery & Furniture",
      nameBn: "নার্সারি ও আসবাবপত্র",
      icon: "Bed",
      imageUrl: "https://images.unsplash.com/photo-1566004100631-35d015d6a491?w=600",
    },
    {
      name: "Safety & Health",
      nameBn: "নিরাপত্তা ও স্বাস্থ্য",
      icon: "ShieldCheck",
      imageUrl: "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=600",
    },
    {
      name: "Gear & Travel",
      nameBn: "যন্ত্রপাতি ও ভ্রমণ",
      icon: "Car",
      imageUrl: "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=600",
    },
    {
      name: "Mom & Baby Care",
      nameBn: "মা ও শিশু যত্ন",
      icon: "Heart",
      imageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600",
    },
    {
      name: "Gift Sets & Hampers",
      nameBn: "উপহার সেট ও হ্যাম্পার",
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
      }))
    )
    .returning();

  // Child Categories (~60 subcategories)
  const childCategories = [
    // 1. Baby Clothing & Fashion (5 children)
    { name: "Traditional Wear", nameBn: "ঐতিহ্যবাহী পোশাক", parent: "Baby Clothing & Fashion", icon: "User", sortOrder: 0 },
    { name: "Western Wear", nameBn: "পাশ্চাত্য পোশাক", parent: "Baby Clothing & Fashion", icon: "Shirt", sortOrder: 1 },
    { name: "Seasonal Clothing", nameBn: "মৌসুমি পোশাক", parent: "Baby Clothing & Fashion", icon: "CloudRain", sortOrder: 2 },
    { name: "Nightwear", nameBn: "রাতের পোশাক", parent: "Baby Clothing & Fashion", icon: "Moon", sortOrder: 3 },
    { name: "Clothing Accessories", nameBn: "পোশাক আনুষাঙ্গিক", parent: "Baby Clothing & Fashion", icon: "Shirt", sortOrder: 4 },

    // 2. Feeding & Nursing (6 children)
    { name: "Bottles & Feeding", nameBn: "বোতল ও খাওয়ানো", parent: "Feeding & Nursing", icon: "Milk", sortOrder: 0 },
    { name: "Breast Feeding", nameBn: "বুকের দুধ", parent: "Feeding & Nursing", icon: "Heart", sortOrder: 1 },
    { name: "Solid Feeding", nameBn: "শক্ত খাবার", parent: "Feeding & Nursing", icon: "Utensils", sortOrder: 2 },
    { name: "Baby Food & Formula", nameBn: "শিশু খাদ্য ও ফর্মুলা", parent: "Feeding & Nursing", icon: "Cookie", sortOrder: 3 },
    { name: "Feeding Accessories", nameBn: "খাওয়ানোর উপকরণ", parent: "Feeding & Nursing", icon: "Utensils", sortOrder: 4 },
    { name: "Organic Baby Food", nameBn: "জৈব শিশু খাদ্য", parent: "Feeding & Nursing", icon: "Leaf", sortOrder: 5 },

    // 3. Diapering & Potty (5 children)
    { name: "Disposable Diapers", nameBn: "ডিসপোজেবল ডায়াপার", parent: "Diapering & Potty", icon: "Package", sortOrder: 0 },
    { name: "Cloth Diapers", nameBn: "কাপড়ের ডায়াপার", parent: "Diapering & Potty", icon: "Shirt", sortOrder: 1 },
    { name: "Wipes & Cloths", nameBn: "ওয়াইপস ও কাপড়", parent: "Diapering & Potty", icon: "Droplets", sortOrder: 2 },
    { name: "Diaper Accessories", nameBn: "ডায়াপার উপকরণ", parent: "Diapering & Potty", icon: "Backpack", sortOrder: 3 },
    { name: "Potty Training", nameBn: "পটি প্রশিক্ষণ", parent: "Diapering & Potty", icon: "Baby", sortOrder: 4 },

    // 4. Bath & Skincare (5 children)
    { name: "Bath Time Essentials", nameBn: "গোসল প্রয়োজনীয়", parent: "Bath & Skincare", icon: "Bath", sortOrder: 0 },
    { name: "Skincare Products", nameBn: "ত্বক পণ্য", parent: "Bath & Skincare", icon: "Sparkles", sortOrder: 1 },
    { name: "Organic Skincare", nameBn: "জৈব ত্বক যত্ন", parent: "Bath & Skincare", icon: "Leaf", sortOrder: 2 },
    { name: "Baby Grooming", nameBn: "শিশু সাজসজ্জা", parent: "Bath & Skincare", icon: "Scissors", sortOrder: 3 },
    { name: "Oral Care", nameBn: "মুখ যত্ন", parent: "Bath & Skincare", icon: "Baby", sortOrder: 4 },

    // 5. Toys & Entertainment (6 children)
    { name: "Soft Toys", nameBn: "নরম খেলনা", parent: "Toys & Entertainment", icon: "Heart", sortOrder: 0 },
    { name: "Educational Toys", nameBn: "শিক্ষামূলক খেলনা", parent: "Toys & Entertainment", icon: "Book", sortOrder: 1 },
    { name: "Activity & Play", nameBn: "কার্যকলাপ ও খেলা", parent: "Toys & Entertainment", icon: "ToyBrick", sortOrder: 2 },
    { name: "Musical Toys", nameBn: "সঙ্গীত খেলনা", parent: "Toys & Entertainment", icon: "Music", sortOrder: 3 },
    { name: "Baby Books", nameBn: "শিশু বই", parent: "Toys & Entertainment", icon: "Book", sortOrder: 4 },
    { name: "Budget Toys", nameBn: "সাশ্রয়ী খেলনা", parent: "Toys & Entertainment", icon: "ToyBrick", sortOrder: 5 },

    // 6. Nursery & Furniture (5 children) - Mosquito Protection is PRIORITY
    { name: "Baby Beds & Cradles", nameBn: "শিশু খাট ও দোলনা", parent: "Nursery & Furniture", icon: "Bed", sortOrder: 0 },
    { name: "Bedding & Linens", nameBn: "বিছানা ও লিনেন", parent: "Nursery & Furniture", icon: "Bed", sortOrder: 1 },
    { name: "Mosquito Protection", nameBn: "মশা সুরক্ষা", parent: "Nursery & Furniture", icon: "Shield", sortOrder: 2 },
    { name: "Nursery Storage", nameBn: "নার্সারি সংরক্ষণ", parent: "Nursery & Furniture", icon: "Package", sortOrder: 3 },
    { name: "Room Decor & Lighting", nameBn: "ঘর সাজসজ্জা ও আলো", parent: "Nursery & Furniture", icon: "Home", sortOrder: 4 },

    // 7. Safety & Health (4 children)
    { name: "Baby Monitors", nameBn: "শিশু মনিটর", parent: "Safety & Health", icon: "Radio", sortOrder: 0 },
    { name: "Home Safety Gear", nameBn: "ঘর নিরাপত্তা", parent: "Safety & Health", icon: "Shield", sortOrder: 1 },
    { name: "Health Care Essentials", nameBn: "স্বাস্থ্য যত্ন প্রয়োজনীয়", parent: "Safety & Health", icon: "Activity", sortOrder: 2 },
    { name: "First Aid & Wellness", nameBn: "প্রাথমিক চিকিৎসা ও সুস্থতা", parent: "Safety & Health", icon: "Cross", sortOrder: 3 },

    // 8. Gear & Travel (4 children)
    { name: "Strollers & Prams", nameBn: "স্ট্রলার ও প্র্যাম", parent: "Gear & Travel", icon: "Car", sortOrder: 0 },
    { name: "Car Seats", nameBn: "গাড়ির আসন", parent: "Gear & Travel", icon: "Car", sortOrder: 1 },
    { name: "Baby Carriers & Slings", nameBn: "বাহক ও স্লিং", parent: "Gear & Travel", icon: "Backpack", sortOrder: 2 },
    { name: "Travel Accessories", nameBn: "ভ্রমণ আনুষাঙ্গিক", parent: "Gear & Travel", icon: "Plane", sortOrder: 3 },

    // 9. Mom & Baby Care (4 children)
    { name: "Maternity Essentials", nameBn: "মাতৃত্ব প্রয়োজনীয়", parent: "Mom & Baby Care", icon: "Users", sortOrder: 0 },
    { name: "Nursing Care", nameBn: "স্তন্যপান যত্ন", parent: "Mom & Baby Care", icon: "Heart", sortOrder: 1 },
    { name: "Postpartum Recovery", nameBn: "প্রসবোত্তর পুনরুদ্ধার", parent: "Mom & Baby Care", icon: "Heart", sortOrder: 2 },
    { name: "Mom Wellness", nameBn: "মায়ের সুস্থতা", parent: "Mom & Baby Care", icon: "Heart", sortOrder: 3 },

    // 10. Gift Sets & Hampers (4 children)
    { name: "Newborn Gift Sets", nameBn: "নবজাতক উপহার সেট", parent: "Gift Sets & Hampers", icon: "Gift", sortOrder: 0 },
    { name: "Festival & Seasonal Gifts", nameBn: "উৎসব ও মৌসুমি উপহার", parent: "Gift Sets & Hampers", icon: "Gift", sortOrder: 1 },
    { name: "Themed Collections", nameBn: "থিমভিত্তিক সংগ্রহ", parent: "Gift Sets & Hampers", icon: "Package", sortOrder: 2 },
    { name: "Budget Gift Options", nameBn: "সাশ্রয়ী উপহার", parent: "Gift Sets & Hampers", icon: "Gift", sortOrder: 3 },
  ];

  const insertedChildren = await db
    .insert(categories)
    .values(
      childCategories.map((c) => ({
        name: c.name,
        nameBn: c.nameBn,
        slug: slugify(c.name),
        parentId: insertedParents.find((p) => p.name === c.parent)?.id,
        iconKey: c.icon,
        sortOrder: c.sortOrder,
      }))
    )
    .returning();

  const allCategories = [...insertedParents, ...insertedChildren];

  console.log(`✅ Created ${allCategories.length} categories (${insertedParents.length} parent + ${insertedChildren.length} child)`);

  // 4. Seed Products (100+ products)
  console.log("Creating products...");
  const productTemplates = [
    // Clothing products
    { prefix: "Soft Cotton", category: "Western Wear", ageRanges: ["0-3 months", "3-6 months", "6-12 months"] },
    { prefix: "Organic", category: "Western Wear", ageRanges: ["0-3 months", "3-6 months"] },
    { prefix: "Traditional", category: "Traditional Wear", ageRanges: ["6-12 months", "1-2 years"] },
    { prefix: "Cozy Winter", category: "Seasonal Clothing", ageRanges: ["6-12 months", "1-2 years"] },
    { prefix: "Summer Cotton", category: "Seasonal Clothing", ageRanges: ["3-6 months", "6-12 months"] },
    { prefix: "Sleepy Time", category: "Nightwear", ageRanges: ["0-3 months", "3-6 months"] },
    { prefix: "Adorable", category: "Clothing Accessories", ageRanges: ["0-6 months", "6-12 months"] },

    // Feeding products
    { prefix: "Feeding", category: "Bottles & Feeding", ageRanges: ["0-6 months", "6-12 months"] },
    { prefix: "Anti-Colic", category: "Bottles & Feeding", ageRanges: ["0-3 months", "3-6 months"] },
    { prefix: "Nursing", category: "Breast Feeding", ageRanges: ["0-6 months", "6-12 months"] },
    { prefix: "Waterproof", category: "Feeding Accessories", ageRanges: ["3-6 months", "6-12 months"] },
    { prefix: "Organic", category: "Organic Baby Food", ageRanges: ["6-12 months", "1-2 years"] },

    // Diapers
    { prefix: "Premium", category: "Disposable Diapers", ageRanges: ["Newborn", "0-6 months", "6-12 months"] },
    { prefix: "Eco-Friendly", category: "Cloth Diapers", ageRanges: ["0-6 months", "6-12 months"] },

    // Bath & Skincare
    { prefix: "Gentle", category: "Bath Time Essentials", ageRanges: ["0-12 months", "1-3 years"] },
    { prefix: "Organic", category: "Organic Skincare", ageRanges: ["0-6 months", "6-12 months"] },

    // Nursery
    { prefix: "Soft Fleece", category: "Bedding & Linens", ageRanges: ["0-12 months", "1-3 years"] },
    { prefix: "Protective", category: "Mosquito Protection", ageRanges: ["0-12 months", "1-3 years"] },

    // Toys
    { prefix: "Plush", category: "Soft Toys", ageRanges: ["0-6 months", "6-12 months", "1-2 years"] },
    { prefix: "Educational", category: "Educational Toys", ageRanges: ["6-12 months", "1-2 years", "2-3 years"] },
    { prefix: "Musical", category: "Musical Toys", ageRanges: ["6-12 months", "1-2 years"] },
    { prefix: "Budget", category: "Budget Toys", ageRanges: ["0-6 months", "6-12 months"] },

    // Gift Sets
    { prefix: "Deluxe", category: "Newborn Gift Sets", ageRanges: ["0-3 months", "3-6 months", "6-12 months"] },
    { prefix: "Essential", category: "Newborn Gift Sets", ageRanges: ["Newborn", "0-6 months"] },
    { prefix: "Festival", category: "Festival & Seasonal Gifts", ageRanges: ["0-12 months", "1-2 years"] },
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

  console.log("✅ Database seeded successfully!");
  console.log(`   - ${insertedVendors.length} vendors`);
  console.log(`   - ${allCategories.length} categories`);
  console.log(`   - ${insertedProducts.length} products`);
  console.log(`   - ${insertedCampaigns.length} campaigns`);

  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
