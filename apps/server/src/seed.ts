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
  cartItems,
  carts,
  orders,
  orderItems,
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

const toBn = (text: string) => `${text} (BN)`;

const imageCollections = {
  clothing: [
    "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600",
    "https://images.unsplash.com/photo-1607453998774-d533f65dac99?w=600",
    "https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?w=600",
    "https://images.unsplash.com/photo-1515779122185-2390ccdf060b?w=600",
    "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=600",
    "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600",
    "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800",
    "https://images.unsplash.com/photo-1607453998774-d533f65dac99?w=800",
    "https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?w=800",
    "https://images.unsplash.com/photo-1515779122185-2390ccdf060b?w=800",
    "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800",
    "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800",
    "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=900",
    "https://images.unsplash.com/photo-1607453998774-d533f65dac99?w=900",
    "https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?w=900",
  ],
  feeding: [
    "https://images.unsplash.com/photo-1590859808308-3d2d9c515b1a?w=500",
    "https://images.unsplash.com/photo-1590859808308-3d2d9c515b1a?w=600",
    "https://images.unsplash.com/photo-1590859808308-3d2d9c515b1a?w=650",
    "https://images.unsplash.com/photo-1590859808308-3d2d9c515b1a?w=700",
    "https://images.unsplash.com/photo-1590859808308-3d2d9c515b1a?w=750",
    "https://images.unsplash.com/photo-1590859808308-3d2d9c515b1a?w=800",
    "https://images.unsplash.com/photo-1590859808308-3d2d9c515b1a?w=850",
    "https://images.unsplash.com/photo-1590859808308-3d2d9c515b1a?w=900",
    "https://images.unsplash.com/photo-1590859808308-3d2d9c515b1a?w=950",
    "https://images.unsplash.com/photo-1590859808308-3d2d9c515b1a?w=1000",
    "https://images.unsplash.com/photo-1590859808308-3d2d9c515b1a?w=1100",
    "https://images.unsplash.com/photo-1590859808308-3d2d9c515b1a?w=1200",
    "https://images.unsplash.com/photo-1590859808308-3d2d9c515b1a?w=1300",
    "https://images.unsplash.com/photo-1590859808308-3d2d9c515b1a?w=1400",
    "https://images.unsplash.com/photo-1590859808308-3d2d9c515b1a?w=1500",
  ],
  diapering: [
    "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=600",
    "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=600",
    "https://images.unsplash.com/photo-1583845112203-29329902332e?w=600",
    "https://images.unsplash.com/photo-1604917621956-10dfa7cce2e7?w=600",
    "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600",
    "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800",
    "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=800",
    "https://images.unsplash.com/photo-1583845112203-29329902332e?w=800",
    "https://images.unsplash.com/photo-1604917621956-10dfa7cce2e7?w=800",
    "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800",
    "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=1000",
    "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=1000",
    "https://images.unsplash.com/photo-1583845112203-29329902332e?w=1000",
    "https://images.unsplash.com/photo-1604917621956-10dfa7cce2e7?w=1000",
    "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1000",
  ],
  toys: [
    "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=600",
    "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600",
    "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600",
    "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=600",
    "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600",
    "https://images.unsplash.com/photo-1536846511313-4b07b637bff9?w=600",
    "https://images.unsplash.com/photo-1504681869696-d977211a5f4c?w=600",
    "https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=600",
    "https://images.unsplash.com/photo-1559715745-e1b33a271c8f?w=600",
    "https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=600",
    "https://images.unsplash.com/photo-1562040506-a9b32cb51b94?w=600",
    "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600",
    "https://images.unsplash.com/photo-1530982011887-3cc11cc85693?w=600",
    "https://images.unsplash.com/photo-1560859251-d563a49c5e4a?w=600",
    "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=800",
  ],
  furniture: [
    "https://images.unsplash.com/photo-1566004100631-35d015d6a491?w=500",
    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500",
    "https://images.unsplash.com/photo-1492725764893-90b379c2b6e7?w=500",
    "https://images.unsplash.com/photo-1566004100631-35d015d6a491?w=700",
    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=700",
    "https://images.unsplash.com/photo-1492725764893-90b379c2b6e7?w=700",
    "https://images.unsplash.com/photo-1566004100631-35d015d6a491?w=900",
    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=900",
    "https://images.unsplash.com/photo-1492725764893-90b379c2b6e7?w=900",
    "https://images.unsplash.com/photo-1566004100631-35d015d6a491?w=1100",
    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1100",
    "https://images.unsplash.com/photo-1492725764893-90b379c2b6e7?w=1100",
    "https://images.unsplash.com/photo-1566004100631-35d015d6a491?w=1300",
    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1300",
    "https://images.unsplash.com/photo-1492725764893-90b379c2b6e7?w=1300",
  ],
  travel: [
    "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=500",
    "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=600",
    "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=700",
    "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=800",
    "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=900",
    "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=1000",
    "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=1100",
    "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=1200",
    "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=1300",
    "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=1400",
    "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=1500",
    "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=1600",
    "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=1700",
    "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=1800",
    "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=1900",
  ],
  bath: [
    "https://images.unsplash.com/photo-1600369672770-985fd30004eb?w=500",
    "https://images.unsplash.com/photo-1600369672770-985fd30004eb?w=600",
    "https://images.unsplash.com/photo-1600369672770-985fd30004eb?w=700",
    "https://images.unsplash.com/photo-1600369672770-985fd30004eb?w=800",
    "https://images.unsplash.com/photo-1600369672770-985fd30004eb?w=900",
    "https://images.unsplash.com/photo-1600369672770-985fd30004eb?w=1000",
    "https://images.unsplash.com/photo-1600369672770-985fd30004eb?w=1100",
    "https://images.unsplash.com/photo-1600369672770-985fd30004eb?w=1200",
    "https://images.unsplash.com/photo-1600369672770-985fd30004eb?w=1300",
    "https://images.unsplash.com/photo-1600369672770-985fd30004eb?w=1400",
    "https://images.unsplash.com/photo-1600369672770-985fd30004eb?w=1500",
    "https://images.unsplash.com/photo-1600369672770-985fd30004eb?w=1600",
    "https://images.unsplash.com/photo-1600369672770-985fd30004eb?w=1700",
    "https://images.unsplash.com/photo-1600369672770-985fd30004eb?w=1800",
    "https://images.unsplash.com/photo-1600369672770-985fd30004eb?w=1900",
  ],
  health: [
    "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=500",
    "https://images.unsplash.com/photo-1609220136736-443140cffec6?w=500",
    "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=650",
    "https://images.unsplash.com/photo-1609220136736-443140cffec6?w=650",
    "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=800",
    "https://images.unsplash.com/photo-1609220136736-443140cffec6?w=800",
    "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=950",
    "https://images.unsplash.com/photo-1609220136736-443140cffec6?w=950",
    "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=1100",
    "https://images.unsplash.com/photo-1609220136736-443140cffec6?w=1100",
    "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=1250",
    "https://images.unsplash.com/photo-1609220136736-443140cffec6?w=1250",
    "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=1400",
    "https://images.unsplash.com/photo-1609220136736-443140cffec6?w=1400",
    "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=1550",
  ],
} as const;

type ImageKey = keyof typeof imageCollections;

const campaignImageUrls = [
  "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=1200",
  "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200",
  "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=1200",
];

const brandLogos = [
  // Huggies - Leading diaper brand
  "/brands/huggies.svg",
  // Hasbro - Toys and games company
  "/brands/hasbro.svg",
  // Chicco - Italian baby products brand
  "/brands/chicco.svg",
  // Pigeon - Baby feeding and care products
  "/brands/pigeon.svg",
  // Mothercare - Baby and maternity products
  "/brands/mothercare.svg",
];

const clothingSizes = ["S", "M", "L", "XL", "XXL"];
const colorOptions = ["Blue", "Pink", "Yellow", "Green", "White", "Gray", "Beige", "Mint", "Coral", "Lavender"];
const adjectives = [
  "Soft",
  "Gentle",
  "Cozy",
  "Premium",
  "Organic",
  "Classic",
  "Deluxe",
  "Comfy",
  "Lightweight",
  "Durable",
  "Adorable",
  "Sweet",
];
const features = [
  "with Ribbon",
  "with Handle",
  "Set",
  "Bundle",
  "Travel-Friendly",
  "Easy-Clean",
  "Leakproof",
  "Anti-Colic",
  "Ergonomic",
  "Quick-Dry",
];
const ageRanges = ["0-3 months", "3-6 months", "6-12 months", "1-2 years", "2-3 years"];

// Age range string to numeric mapping (months)
const ageRangeMapping: Record<string, { min: number; max: number }> = {
  "0-3 months": { min: 0, max: 3 },
  "3-6 months": { min: 3, max: 6 },
  "6-12 months": { min: 6, max: 12 },
  "1-2 years": { min: 12, max: 24 },
  "2-3 years": { min: 24, max: 36 },
};

// Safety certifications by category
const safetyCertsByCategory: Record<string, string[]> = {
  toys: ["ASTM F963", "EN 71", "CE"],
  feeding: ["FDA Approved", "BPA-Free Certified"],
  furniture: ["CPSC Compliant", "JPMA Certified"],
  clothing: ["Oeko-Tex Standard 100"],
  skincare: ["Dermatologist Tested", "Hypoallergenic"],
  travel: ["FMVSS 213", "ECE R44/04"],
};

const categoryHierarchy = [
  {
    name: "Baby Clothing",
    icon: "Shirt",
    children: [
      { name: "Tops & T-shirts", children: ["Bodysuits", "Rompers", "T-shirts", "Sweaters", "Cardigans"] },
      { name: "Bottoms", children: ["Pants", "Leggings", "Shorts", "Skirts", "Jeans"] },
      { name: "Outerwear", children: ["Jackets", "Coats", "Snowsuits", "Raincoats", "Vests"] },
      { name: "Sleepwear", children: ["Pajamas", "Sleep Sacks", "Nightgowns", "Robes"] },
      { name: "Accessories", children: ["Hats", "Socks", "Mittens", "Bibs", "Hair Clips"] },
    ],
  },
  {
    name: "Feeding & Nursing",
    icon: "Utensils",
    children: [
      { name: "Bottles & Nipples", children: ["Baby Bottles", "Nipples", "Bottle Sets", "Anti-Colic Bottles"] },
      { name: "Breastfeeding", children: ["Breast Pumps", "Nursing Pads", "Nursing Covers", "Storage Bags"] },
      { name: "Feeding Essentials", children: ["Bibs", "Burp Cloths", "Bottle Warmers", "Sterilizers"] },
      { name: "Solid Food", children: ["High Chairs", "Baby Spoons", "Plates & Bowls", "Snack Cups"] },
      { name: "Formula & Food", children: ["Baby Formula", "Baby Cereal", "Purees", "Snacks"] },
    ],
  },
  {
    name: "Baby Care & Safety",
    icon: "Heart",
    children: [
      { name: "Diapering", children: ["Diapers", "Wipes", "Diaper Bags", "Changing Pads", "Rash Cream"] },
      { name: "Skin Care", children: ["Baby Lotion", "Baby Oil", "Sunscreen", "Diaper Cream"] },
      { name: "Health", children: ["Thermometers", "Nasal Aspirators", "Medicine Dispensers", "Humidifiers"] },
      { name: "Safety", children: ["Baby Monitors", "Gates", "Outlet Covers", "Cabinet Locks"] },
      { name: "Grooming", children: ["Nail Clippers", "Brushes", "Combs", "Toothbrushes"] },
    ],
  },
  {
    name: "Toys & Play",
    icon: "Sparkles",
    children: [
      { name: "Developmental Toys", children: ["Rattles", "Teethers", "Sensory Toys", "Stacking Toys"] },
      { name: "Plush & Stuffed", children: ["Teddy Bears", "Animal Plush", "Character Toys", "Comfort Toys"] },
      { name: "Activity Toys", children: ["Play Gyms", "Activity Centers", "Bouncers", "Walkers"] },
      { name: "Bath Toys", children: ["Rubber Ducks", "Floating Toys", "Squirt Toys", "Bath Books"] },
      { name: "Books & Music", children: ["Board Books", "Cloth Books", "Musical Toys", "Sound Books"] },
    ],
  },
  {
    name: "Nursery & Furniture",
    icon: "Bed",
    children: [
      { name: "Cribs & Beds", children: ["Cribs", "Bassinets", "Toddler Beds", "Bed Rails"] },
      { name: "Bedding", children: ["Crib Sheets", "Blankets", "Mattresses", "Pillows"] },
      { name: "Storage", children: ["Dressers", "Shelves", "Toy Boxes", "Closet Organizers"] },
      { name: "Decor", children: ["Wall Art", "Mobiles", "Night Lights", "Rugs"] },
      { name: "Seating", children: ["Rocking Chairs", "Gliders", "Nursing Chairs", "Ottomans"] },
    ],
  },
  {
    name: "Strollers & Travel",
    icon: "Car",
    children: [
      { name: "Strollers", children: ["Full-Size Strollers", "Umbrella Strollers", "Jogging Strollers", "Double Strollers"] },
      { name: "Car Seats", children: ["Infant Seats", "Convertible Seats", "Booster Seats", "Car Seat Bases"] },
      { name: "Baby Carriers", children: ["Wraps", "Structured Carriers", "Hip Carriers", "Slings"] },
      { name: "Travel Gear", children: ["Diaper Bags", "Travel Cribs", "Portable Changing Pads", "Stroller Accessories"] },
      { name: "Outdoor", children: ["Sun Shades", "Rain Covers", "Mosquito Nets", "Stroller Fans"] },
    ],
  },
  {
    name: "Bath Time",
    icon: "Bath",
    children: [
      { name: "Tubs & Seats", children: ["Baby Tubs", "Bath Seats", "Foldable Tubs", "Inflatable Tubs"] },
      { name: "Wash", children: ["Baby Shampoo", "Body Wash", "Bubble Bath", "2-in-1 Wash"] },
      { name: "Towels", children: ["Hooded Towels", "Washcloths", "Bath Robes", "Towel Sets"] },
      { name: "Bath Toys", children: ["Rubber Ducks", "Stacking Cups", "Water Wheels", "Bath Books"] },
      { name: "Safety", children: ["Bath Thermometers", "Non-Slip Mats", "Faucet Covers", "Knee Pads"] },
    ],
  },
  {
    name: "Health & Wellness",
    icon: "ShieldCheck",
    children: [
      { name: "First Aid", children: ["First Aid Kits", "Bandages", "Antiseptic", "Ice Packs"] },
      { name: "Medicine", children: ["Pain Relief", "Cold & Flu", "Vitamins", "Probiotics"] },
      { name: "Monitoring", children: ["Thermometers", "Pulse Oximeters", "Baby Scales", "Growth Charts"] },
      { name: "Teething", children: ["Teething Gels", "Teethers", "Teething Tablets", "Cold Packs"] },
      { name: "Allergies", children: ["Allergy Relief", "Air Purifiers", "Hypoallergenic Products"] },
    ],
  },
  {
    name: "Gift Sets & Bundles",
    icon: "Gift",
    children: [
      { name: "Newborn Sets", children: ["Welcome Baby Sets", "Hospital Bags", "Essentials Bundles"] },
      { name: "Shower Gifts", children: ["Gift Baskets", "Keepsakes", "Personalized Gifts"] },
    ],
  },
] as const;

const getImageKeyForCategory = (parentName: string, childName?: string, leafName?: string): ImageKey => {
  const leaf = leafName?.toLowerCase() ?? "";

  if (leaf) {
    if (leaf.includes("diaper") || leaf.includes("wipe") || leaf.includes("rash")) {
      return "diapering";
    }

    if (
      leaf.includes("bottle") ||
      leaf.includes("nipple") ||
      leaf.includes("breast") ||
      leaf.includes("formula") ||
      leaf.includes("cereal") ||
      leaf.includes("spoon") ||
      leaf.includes("bowl") ||
      leaf.includes("snack") ||
      leaf.includes("sterilizer") ||
      leaf.includes("warmer") ||
      leaf.includes("bib") ||
      leaf.includes("burp")
    ) {
      return "feeding";
    }

    if (
      leaf.includes("crib") ||
      leaf.includes("bassinet") ||
      leaf.includes("bed") ||
      leaf.includes("mattress") ||
      leaf.includes("dresser") ||
      leaf.includes("shelf") ||
      leaf.includes("storage") ||
      leaf.includes("chair") ||
      leaf.includes("glider") ||
      leaf.includes("ottoman") ||
      leaf.includes("rug") ||
      leaf.includes("decor") ||
      leaf.includes("night light") ||
      leaf.includes("mobile")
    ) {
      return "furniture";
    }

    if (
      leaf.includes("stroller") ||
      leaf.includes("car seat") ||
      leaf.includes("carrier") ||
      leaf.includes("wrap") ||
      leaf.includes("sling") ||
      leaf.includes("travel") ||
      leaf.includes("outdoor")
    ) {
      return "travel";
    }

    if (
      leaf.includes("bath") ||
      leaf.includes("tub") ||
      leaf.includes("towel") ||
      leaf.includes("wash") ||
      leaf.includes("shampoo") ||
      leaf.includes("faucet") ||
      leaf.includes("non-slip") ||
      leaf.includes("knee")
    ) {
      return "bath";
    }

    if (
      leaf.includes("thermometer") ||
      leaf.includes("medicine") ||
      leaf.includes("vitamin") ||
      leaf.includes("probiotic") ||
      leaf.includes("allergy") ||
      leaf.includes("monitor") ||
      leaf.includes("humidifier") ||
      leaf.includes("first aid") ||
      leaf.includes("bandage") ||
      leaf.includes("antiseptic") ||
      leaf.includes("oximeter") ||
      leaf.includes("scale") ||
      leaf.includes("growth")
    ) {
      return "health";
    }

    if (
      leaf.includes("toy") ||
      leaf.includes("teddy") ||
      leaf.includes("plush") ||
      leaf.includes("rattle") ||
      leaf.includes("teether") ||
      leaf.includes("book") ||
      leaf.includes("music") ||
      leaf.includes("walker") ||
      leaf.includes("bouncer") ||
      leaf.includes("gym") ||
      leaf.includes("stacking") ||
      leaf.includes("sensory") ||
      leaf.includes("character")
    ) {
      if (parentName === "Health & Wellness") {
        return "health";
      }
      if (parentName === "Nursery & Furniture") {
        return "furniture";
      }
      return "toys";
    }
  }

  switch (parentName) {
    case "Baby Clothing":
      return "clothing";
    case "Feeding & Nursing":
      return "feeding";
    case "Baby Care & Safety":
      return childName === "Diapering" ? "diapering" : "health";
    case "Toys & Play":
      return "toys";
    case "Nursery & Furniture":
      return "furniture";
    case "Strollers & Travel":
      return "travel";
    case "Bath Time":
      return "bath";
    case "Health & Wellness":
      return "health";
    case "Gift Sets & Bundles":
      return "toys";
    default:
      return "toys";
  }
};

async function seed() {
  console.log("🌱 Starting database seed...");

  // Clear existing data
  console.log("Clearing existing data...");
  // Delete in order of dependencies (child tables first)
  await db.delete(orderItems); // References products
  await db.delete(orders); // Parent of orderItems
  await db.delete(campaignProducts);
  await db.delete(campaigns);
  await db.delete(productSkus);
  await db.delete(productOptions);
  await db.delete(productImages);
  // Delete cart items before products (foreign key constraint)
  await db.delete(cartItems);
  await db.delete(carts);
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
        ratingAvg: faker.number.int({ min: 1, max: 5 }),
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
    { name: "Huggies", logo: brandLogos[0] },
    { name: "Hasbro", logo: brandLogos[1] },
    { name: "Chicco", logo: brandLogos[2] },
    { name: "Pigeon", logo: brandLogos[3] },
    { name: "Mothercare", logo: brandLogos[4] },
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

  // 3. Seed Categories (exact hierarchy)
  console.log("Creating category hierarchy...");

  const parentInserts = categoryHierarchy.map((parent, index) => {
    const imageKey = getImageKeyForCategory(parent.name);
    return {
      name: parent.name,
      nameBn: toBn(parent.name),
      slug: slugify(parent.name),
      iconKey: parent.icon,
      imageUrl: imageCollections[imageKey][0],
      sortOrder: index,
      depth: 0,
    };
  });

  const insertedParents = await db.insert(categories).values(parentInserts).returning();
  const parentByName = new Map(insertedParents.map((parent) => [parent.name, parent]));

  const childInserts: Array<typeof categories.$inferInsert> = [];
  const childKeyBySlug = new Map<string, string>();

  for (const parent of categoryHierarchy) {
    const parentRecord = parentByName.get(parent.name);
    parent.children.forEach((child, index) => {
      const slug = `${slugify(parent.name)}-${slugify(child.name)}`;
      childInserts.push({
        name: child.name,
        nameBn: toBn(child.name),
        slug,
        parentId: parentRecord?.id,
        sortOrder: index,
        depth: 1,
      });
      childKeyBySlug.set(slug, `${parent.name}::${child.name}`);
    });
  }

  const insertedChildren = await db.insert(categories).values(childInserts).returning();
  const childByKey = new Map<string, (typeof insertedChildren)[number]>();

  for (const child of insertedChildren) {
    const key = childKeyBySlug.get(child.slug);
    if (key) {
      childByKey.set(key, child);
    }
  }

  const grandchildInserts: Array<typeof categories.$inferInsert> = [];
  const leafMetaBySlug = new Map<string, { parentName: string; childName: string; leafName: string }>();

  for (const parent of categoryHierarchy) {
    for (const child of parent.children) {
      const childKey = `${parent.name}::${child.name}`;
      const childRecord = childByKey.get(childKey);
      const childSlug = childRecord?.slug ?? `${slugify(parent.name)}-${slugify(child.name)}`;

      child.children.forEach((leafName, index) => {
        const slug = `${childSlug}-${slugify(leafName)}`;
        grandchildInserts.push({
          name: leafName,
          nameBn: toBn(leafName),
          slug,
          parentId: childRecord?.id,
          sortOrder: index,
          depth: 2,
        });
        leafMetaBySlug.set(slug, { parentName: parent.name, childName: child.name, leafName });
      });
    }
  }

  const insertedGrandchildren = await db.insert(categories).values(grandchildInserts).returning();

  const allCategories = [...insertedParents, ...insertedChildren, ...insertedGrandchildren];

  console.log(
    `✅ Created ${allCategories.length} categories (${insertedParents.length} parent + ${insertedChildren.length} subcategories + ${insertedGrandchildren.length} items)`
  );

  // 4. Seed Products (20 per leaf category)
  console.log("Creating products...");

  const allInsertedProducts: Array<typeof products.$inferSelect> = [];
  let productIndex = 0;

  for (const leafCategory of insertedGrandchildren) {
    const meta = leafMetaBySlug.get(leafCategory.slug);
    if (!meta) {
      continue;
    }

    const imageKey = getImageKeyForCategory(meta.parentName, meta.childName, meta.leafName);
    const isClothing = meta.parentName === "Baby Clothing";

    const priceBySlug = new Map<string, number>();
    const productInserts: Array<typeof products.$inferInsert> = [];

    for (let i = 0; i < 20; i++) {
      const vendor = faker.helpers.arrayElement(insertedVendors);
      const brand = faker.helpers.arrayElement(brandData);
      const adjective = faker.helpers.arrayElement(adjectives);
      const feature = faker.datatype.boolean({ probability: 0.6 })
        ? faker.helpers.arrayElement(features)
        : null;
      const title = `${adjective} ${brand.name} ${meta.leafName}${feature ? ` ${feature}` : ""}`;
      const slug = slugify(`${title}-${productIndex}`);
      const priceBdt = faker.number.int({ min: 500, max: 15000 });
      const description = faker.commerce.productDescription();
      const shortDescription = `Quality ${meta.leafName.toLowerCase()} designed for everyday comfort.`;

      // Parse age range to numeric
      const ageRangeValue = faker.helpers.arrayElement(ageRanges);
      const ageNumeric = ageRangeMapping[ageRangeValue] || { min: 0, max: 36 };

      // Category-based safety logic
      const categoryName = meta.parentName;
      const isFeedingCat = categoryName === "Feeding & Nursing";
      const isSkincareCat = meta.leafName.includes("Lotion") || meta.leafName.includes("Cream") || meta.leafName.includes("Oil") || meta.leafName.includes("Shampoo") || meta.leafName.includes("Wash");
      const isToyCat = categoryName === "Toys & Play";
      const isFurnitureCat = categoryName === "Nursery & Furniture";
      const isTravelCat = categoryName === "Strollers & Travel";

      // BPA-free: 80% for feeding, 20% others
      const isBpaFree = isFeedingCat
        ? faker.datatype.boolean({ probability: 0.8 })
        : faker.datatype.boolean({ probability: 0.2 });

      // Organic: 60% skincare, 40% feeding, 10% others
      const isOrganic = isSkincareCat
        ? faker.datatype.boolean({ probability: 0.6 })
        : isFeedingCat
        ? faker.datatype.boolean({ probability: 0.4 })
        : faker.datatype.boolean({ probability: 0.1 });

      // Hypoallergenic: 70% skincare, 50% clothing, 10% others
      const isHypoallergenic = isSkincareCat
        ? faker.datatype.boolean({ probability: 0.7 })
        : categoryName === "Baby Clothing"
        ? faker.datatype.boolean({ probability: 0.5 })
        : faker.datatype.boolean({ probability: 0.1 });

      // Small parts: 30% toys, 5% others
      const hasSmallParts = isToyCat
        ? faker.datatype.boolean({ probability: 0.3 })
        : faker.datatype.boolean({ probability: 0.05 });

      // Safety warnings
      let safetyWarningEn = null;
      let safetyWarningBn = null;
      if (hasSmallParts) {
        safetyWarningEn = "CHOKING HAZARD - Small parts. Not for children under 3 years.";
        safetyWarningBn = "শ্বাসরোধের ঝুঁকি - ছোট অংশ। ৩ বছরের কম বয়সী শিশুদের জন্য নয়।";
      }

      // Weight limits (furniture, travel)
      const weightLimitKg = (isFurnitureCat || isTravelCat)
        ? faker.number.float({ min: 10, max: 30, fractionDigits: 1 })
        : null;

      // Expiry dates (consumables)
      const isConsumable = meta.leafName.includes("Formula") ||
                           meta.leafName.includes("Food") ||
                           meta.leafName.includes("Lotion") ||
                           meta.leafName.includes("Cream") ||
                           meta.leafName.includes("Oil");
      const expiryDate = isConsumable
        ? new Date(Date.now() + faker.number.int({ min: 6, max: 24 }) * 30 * 24 * 60 * 60 * 1000)
        : null;

      // Certifications
      let certifications: string[] = [];
      if (isToyCat && safetyCertsByCategory.toys) {
        certifications = faker.helpers.arrayElements(safetyCertsByCategory.toys, { min: 1, max: 2 });
      } else if (isFeedingCat && safetyCertsByCategory.feeding) {
        certifications = faker.helpers.arrayElements(safetyCertsByCategory.feeding, { min: 1, max: 2 });
      } else if (isFurnitureCat && safetyCertsByCategory.furniture) {
        certifications = faker.helpers.arrayElements(safetyCertsByCategory.furniture, { min: 1, max: 2 });
      } else if (isClothing && safetyCertsByCategory.clothing) {
        certifications = faker.helpers.arrayElements(safetyCertsByCategory.clothing, { min: 1, max: 1 });
      } else if (isSkincareCat && safetyCertsByCategory.skincare) {
        certifications = faker.helpers.arrayElements(safetyCertsByCategory.skincare, { min: 1, max: 2 });
      } else if (isTravelCat && safetyCertsByCategory.travel) {
        certifications = faker.helpers.arrayElements(safetyCertsByCategory.travel, { min: 1, max: 2 });
      }

      productInserts.push({
        title,
        titleBn: toBn(title),
        slug,
        vendorId: vendor.id,
        categoryId: leafCategory.id,
        brand: brand.name,
        shortDescription,
        shortDescriptionBn: toBn(shortDescription),
        description,
        descriptionBn: toBn(description),
        ageRange: ageRangeValue, // Keep string for backward compatibility
        ageRangeMin: ageNumeric.min,
        ageRangeMax: ageNumeric.max,
        isBpaFree,
        isOrganic,
        isHypoallergenic,
        hasSmallParts,
        safetyWarningEn,
        safetyWarningBn,
        weightLimitKg,
        expiryDate,
        safetyCertifications: certifications,
        ratingAvg: faker.number.int({ min: 1, max: 5 }),
        ratingCount: faker.number.int({ min: 5, max: 200 }),
        bestSellerScore: faker.number.int({ min: 0, max: 1000 }),
        isNew: faker.datatype.boolean({ probability: 0.3 }),
        isHot: faker.datatype.boolean({ probability: 0.2 }),
        status: "approved",
        isActive: true,
      });

      priceBySlug.set(slug, priceBdt * 100);
      productIndex++;
    }

    const insertedProducts = await db.insert(products).values(productInserts).returning();
    allInsertedProducts.push(...insertedProducts);

    const imageInserts: Array<typeof productImages.$inferInsert> = [];
    const optionInserts: Array<typeof productOptions.$inferInsert> = [];
    const skuInserts: Array<typeof productSkus.$inferInsert> = [];

    for (const product of insertedProducts) {
      const images = faker.helpers.arrayElements(imageCollections[imageKey], 3);
      images.forEach((url, index) => {
        // Convert external URL to mock s3Key for seeding
        // Extract the photo ID from Unsplash URL and create a mock s3Key
        const photoId = url.match(/photo-([^?]+)/)?.[1] || `seed-${index}`;
        const s3Key = `seed/products/${photoId}.jpg`;

        imageInserts.push({
          productId: product.id,
          s3Key: s3Key,
          variant: "original",
          isPrimary: index === 0,
          alt: `${product.title} - Image ${index + 1}`,
          sortOrder: index,
        });
      });

      const includeColor = faker.datatype.boolean({ probability: isClothing ? 0.7 : 0.4 });
      const colorValues = includeColor
        ? faker.helpers.arrayElements(colorOptions, { min: 2, max: 4 })
        : [];

      if (isClothing) {
        optionInserts.push({
          productId: product.id,
          name: "Size",
          nameBn: toBn("Size"),
          values: clothingSizes,
          valuesBn: clothingSizes.map(toBn),
          sortOrder: 0,
        });

        if (includeColor) {
          optionInserts.push({
            productId: product.id,
            name: "Color",
            nameBn: toBn("Color"),
            values: colorValues,
            valuesBn: colorValues.map(toBn),
            sortOrder: 1,
          });
        }
      } else if (includeColor) {
        optionInserts.push({
          productId: product.id,
          name: "Color",
          nameBn: toBn("Color"),
          values: colorValues,
          valuesBn: colorValues.map(toBn),
          sortOrder: 0,
        });
      }

      const basePrice = priceBySlug.get(product.slug) ?? faker.number.int({ min: 500, max: 15000 }) * 100;
      const hasDiscount = faker.datatype.boolean({ probability: 0.35 });
      const discountPercent = hasDiscount ? faker.number.int({ min: 10, max: 30 }) : 0;
      const compareAtAmount = hasDiscount ? Math.round(basePrice / (1 - discountPercent / 100)) : null;
      const shortId = product.id.split("-")[0];

      if (isClothing) {
        if (includeColor && colorValues.length > 0) {
          for (const size of clothingSizes) {
            for (const color of colorValues) {
              skuInserts.push({
                productId: product.id,
                sku: `SKU-${shortId}-${size}-${color}`.toUpperCase().replace(/\s+/g, ""),
                optionValues: { Size: size, Color: color },
                priceAmount: basePrice,
                compareAtAmount,
                currency: "BDT",
                stockQty: faker.number.int({ min: 0, max: 50 }),
                isAvailable: faker.datatype.boolean({ probability: 0.9 }),
              });
            }
          }
        } else {
          for (const size of clothingSizes) {
            skuInserts.push({
              productId: product.id,
              sku: `SKU-${shortId}-${size}`.toUpperCase().replace(/\s+/g, ""),
              optionValues: { Size: size },
              priceAmount: basePrice,
              compareAtAmount,
              currency: "BDT",
              stockQty: faker.number.int({ min: 0, max: 50 }),
              isAvailable: faker.datatype.boolean({ probability: 0.9 }),
            });
          }
        }
      } else if (includeColor && colorValues.length > 0) {
        for (const color of colorValues) {
          skuInserts.push({
            productId: product.id,
            sku: `SKU-${shortId}-${color}`.toUpperCase().replace(/\s+/g, ""),
            optionValues: { Color: color },
            priceAmount: basePrice,
            compareAtAmount,
            currency: "BDT",
            stockQty: faker.number.int({ min: 0, max: 50 }),
            isAvailable: faker.datatype.boolean({ probability: 0.9 }),
          });
        }
      } else {
        skuInserts.push({
          productId: product.id,
          sku: `SKU-${shortId}-STANDARD`,
          priceAmount: basePrice,
          compareAtAmount,
          currency: "BDT",
          stockQty: faker.number.int({ min: 0, max: 50 }),
          isAvailable: faker.datatype.boolean({ probability: 0.9 }),
        });
      }
    }

    await db.insert(productImages).values(imageInserts);
    if (optionInserts.length > 0) {
      await db.insert(productOptions).values(optionInserts);
    }
    await db.insert(productSkus).values(skuInserts);
  }

  // 5. Seed Campaigns
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
    const randomProducts = faker.helpers.arrayElements(allInsertedProducts, {
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

  // 6. Seed Homepage Content
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

  // 7. Seed Mega Menu Featured Products
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
    const categoryProducts = allInsertedProducts.filter((product) =>
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
  console.log(`   - ${allInsertedProducts.length} products`);
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
