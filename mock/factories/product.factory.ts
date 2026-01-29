import { faker } from '@faker-js/faker'
import { CATEGORIES } from './category.factory'
import { getRandomVendor } from './vendor.factory'
import type {
  Product,
  ProductBadge,
  ProductImage,
  ProductPricing,
  ProductRating,
  ProductShipping,
  ProductVariant,
  StockStatus,
} from '@/types'

// ============================================
// Product Factory
// ============================================

const DISCOUNT_PERCENTAGES = [0, 0, 0, 10, 15, 20, 25, 30, 40, 50, 60, 70]

// ============================================
// Category-Specific Product Images (Unsplash)
// ============================================

const CATEGORY_IMAGES: Record<string, Array<string>> = {
  electronics: [
    // Smartphones
    'photo-1511707171634-5f897ff02aa9',
    'photo-1592899677977-9c10ca588bbd',
    'photo-1580910051074-3eb694886f2b',
    'photo-1601784551446-20c9e07cdbdb',
    'photo-1565849904461-04a58ad377e0',
    // Laptops
    'photo-1496181133206-80ce9b88a853',
    'photo-1525547719571-a2d4ac8945e2',
    'photo-1517336714731-489689fd1ca8',
    'photo-1588872657578-7efd1f1555ed',
    'photo-1541807084-5c52b6b92b5e',
    // Headphones & Audio
    'photo-1505740420928-5e560c06d30e',
    'photo-1583394838336-acd977736f90',
    'photo-1546435770-a3e426bf472b',
    'photo-1484704849700-f032a568e944',
    'photo-1558089687-f282ffcbc126',
    // Smartwatches
    'photo-1523275335684-37898b6baf30',
    'photo-1579586337278-3befd40fd17a',
    'photo-1544117519-31a4b719223d',
    'photo-1434493789847-2a75b0910e1b',
    'photo-1617043786394-f977fa12eddf',
    // Cameras
    'photo-1516035069371-29a1b244cc32',
    'photo-1502920917128-1aa500764cbd',
    'photo-1526170375885-4d8ecf77b99f',
    'photo-1500634245200-e5245c7574ef',
    'photo-1495121553079-4c61bcce1894',
    // Tablets & Accessories
    'photo-1544244015-0df4b3ffc6b0',
    'photo-1585790050226-b7d61c1f0a84',
    'photo-1589739900243-4b52cd9b104e',
    'photo-1593642632559-0c6d3fc62b89',
    'photo-1625480860249-be231806e6ed',
    // Gaming & Keyboards
    'photo-1587829741301-dc798b83add3',
    'photo-1595225476474-87563907a212',
    'photo-1618384887929-16ec33fab9ef',
  ],
  fashion: [
    // Men's Clothing
    'photo-1489987707025-afc232f7ea0f',
    'photo-1521572163474-6864f9cf17ab',
    'photo-1620799140408-edc6dcb6d633',
    'photo-1594938298603-c8148c4dae35',
    'photo-1602810318383-e386cc2a3ccf',
    // Women's Clothing
    'photo-1434389677669-e08b4cac3105',
    'photo-1485968579580-b6d095142e6e',
    'photo-1558171813-4c088753af8f',
    'photo-1551488831-00ddcb6c6bd3',
    'photo-1539109136881-3be0616acf4b',
    // Dresses & Tops
    'photo-1495385794356-15371f348c31',
    'photo-1562157873-818bc0726f68',
    'photo-1583743814966-8936f5b7be1a',
    'photo-1604006852748-903fccbc4019',
    'photo-1596755094514-f87e34085b2c',
    // Shoes & Sneakers
    'photo-1542291026-7eec264c27ff',
    'photo-1549298916-b41d501d3772',
    'photo-1460353581641-37baddab0fa2',
    'photo-1600269452121-4f2416e55c28',
    'photo-1595950653106-6c9ebd614d3a',
    // Bags & Accessories
    'photo-1548036328-c9fa89d128fa',
    'photo-1553062407-98eeb64c6a62',
    'photo-1584917865442-de89df76afd3',
    'photo-1566150905458-1bf1fc113f0d',
    'photo-1590874103328-eac38a683ce7',
    // Watches & Jewelry
    'photo-1524592094714-0f0654e20314',
    'photo-1522312346375-d1a52e2b99b3',
    'photo-1619134778706-7015533a6150',
    'photo-1611652022419-a9419f74343d',
    'photo-1515562141207-7a88fb7ce338',
    // Sunglasses
    'photo-1572635196237-14b3f281503f',
    'photo-1511499767150-a48a237f0083',
    'photo-1473496169904-658ba7c44d8a',
  ],
  home: [
    // Furniture - Sofas & Chairs
    'photo-1555041469-a586c61ea9bc',
    'photo-1493663284031-b7e3aefcae8e',
    'photo-1506439773649-6e0eb8cfb237',
    'photo-1567538096630-e0c55bd6374c',
    'photo-1598300042247-d088f8ab3a91',
    // Tables & Desks
    'photo-1518455027359-f3f8164ba6bd',
    'photo-1532372320572-cda25653a26d',
    'photo-1611269154421-4e27233ac5c7',
    'photo-1594026112284-02bb6f3352fe',
    'photo-1572025442646-866d16c84a54',
    // Lighting & Lamps
    'photo-1507473885765-e6ed057f782c',
    'photo-1513506003901-1e6a229e2d15',
    'photo-1524484485831-a92ffc0de03f',
    'photo-1540932239986-30128078f3c5',
    'photo-1494438639946-1ebd1d20bf85',
    // Kitchen Items
    'photo-1556909114-f6e7ad7d3136',
    'photo-1584990347449-a7e5d6d2d456',
    'photo-1556909172-8c2f041fca1e',
    'photo-1610701596061-2ecf227e85b2',
    'photo-1590794056226-79ef3a8147e1',
    // Bedding & Pillows
    'photo-1522771739844-6a9f6d5f14af',
    'photo-1584100936595-c0654b55a2e2',
    'photo-1631049307264-da0ec9d70304',
    'photo-1616627561950-9f746e330187',
    'photo-1629140727571-9b5c6f6267b4',
    // Decor & Vases
    'photo-1581783898377-1c85bf937427',
    'photo-1602028915047-37269d1a73f7',
    'photo-1612196808214-b8e1d6145a8c',
    'photo-1558997519-83ea9252edf8',
    'photo-1594040226829-7f251ab46d80',
    // Rugs & Curtains
    'photo-1600166898405-da9535204843',
    'photo-1493663284031-b7e3aefcae8e',
  ],
  beauty: [
    // Skincare
    'photo-1556228578-0d85b1a4d571',
    'photo-1570194065650-d99fb4b38b15',
    'photo-1608248597279-f99d160bfcbc',
    'photo-1611930022073-b7a4ba5fcccd',
    'photo-1620916566398-39f1143ab7be',
    // Makeup & Cosmetics
    'photo-1596462502278-27bfdc403348',
    'photo-1512496015851-a90fb38ba796',
    'photo-1631214524020-7e18db9a8f92',
    'photo-1586495777744-4413f21062fa',
    'photo-1619451334792-150fd785ee74',
    // Lipstick & Lip Products
    'photo-1586495777744-4413f21062fa',
    'photo-1631214524020-7e18db9a8f92',
    'photo-1599733594230-6b823276abcc',
    'photo-1571875257727-256c39da42af',
    'photo-1590156546946-ce55a12a6a5d',
    // Perfume & Fragrance
    'photo-1541643600914-78b084683601',
    'photo-1594035910387-fea47794261f',
    'photo-1588405748880-12d1d2a59f75',
    'photo-1592945403244-b3fbafd7f539',
    'photo-1595425970377-c9703cf48b6d',
    // Hair Care
    'photo-1527799820374-dcf8d9d4a388',
    'photo-1522337360788-8b13dee7a37e',
    'photo-1598440947619-2c35fc9aa908',
    'photo-1599305090598-fe179d501227',
    'photo-1626808642875-0aa545482dfb',
    // Brushes & Tools
    'photo-1596704017254-9b121068fb31',
    'photo-1567721913486-6585f069b332',
    'photo-1599305090598-fe179d501227',
    'photo-1609587312208-cea54be969e7',
    'photo-1599305090598-fe179d501227',
    // Nail Polish
    'photo-1604654894610-df63bc536371',
    'photo-1610992015732-2449b0bbec4a',
  ],
  books: [
    // Books & Stacks
    'photo-1495446815901-a7297e633e8d',
    'photo-1512820790803-83ca734da794',
    'photo-1497633762265-9d179a990aa6',
    'photo-1524578271613-d550eacf6090',
    'photo-1544947950-fa07a98d237f',
    // Open Books
    'photo-1476275466078-4007374efbbe',
    'photo-1532012197267-da84d127e765',
    'photo-1519682337058-a94d519337bc',
    'photo-1516979187457-637abb4f9353',
    'photo-1550399105-c4db5fb85c18',
    // Notebooks & Journals
    'photo-1531346878377-a5be20888e57',
    'photo-1517842645767-c639042777db',
    'photo-1506784365847-bbad939e9335',
    'photo-1544716278-ca5e3f4abd8c',
    'photo-1501618669935-18b6ecb13d6d',
    // Pens & Stationery
    'photo-1583485088034-697b5bc54ccd',
    'photo-1513542789411-b6a5d4f31634',
    'photo-1456735190827-d1262f71b8a3',
    'photo-1568871452920-45cf3e62a168',
    'photo-1586075010923-2dd4570fb338',
    // Art Supplies
    'photo-1513364776144-60967b0f800f',
    'photo-1452860606245-08befc0ff44b',
    'photo-1596568593607-8f9e21e1c2b3',
    'photo-1560785218-893293e01011',
    'photo-1578301978693-85fa9c0320b9',
    // Office Supplies
    'photo-1507925921958-8a62f3d1a50d',
    'photo-1434030216411-0b793f4b4173',
    'photo-1488190211105-8b0e65b80b4e',
    'photo-1455390582262-044cdead277a',
    'photo-1450101499163-c8848c66ca85',
    'photo-1589998059171-988d887df646',
  ],
  sports: [
    // Fitness Equipment
    'photo-1517836357463-d25dfeac3438',
    'photo-1534438327276-14e5300c3a48',
    'photo-1526506118085-60ce8714f8c5',
    'photo-1571019613454-1cb2f99b2d8b',
    'photo-1574680096145-d05b474e2155',
    // Dumbbells & Weights
    'photo-1583454110551-21f2fa2afe61',
    'photo-1581009137042-c552e485697a',
    'photo-1584735935682-2f2b69dff9d2',
    'photo-1598289431512-b97b0917affc',
    'photo-1605296867304-46d5465a13f1',
    // Yoga & Mats
    'photo-1544367567-0f2fcb009e0b',
    'photo-1518611012118-696072aa579a',
    'photo-1506126613408-eca07ce68773',
    'photo-1599447421416-3414500d18a5',
    'photo-1593810451137-5dc55105dace',
    // Sports Balls
    'photo-1486286701208-1d58e9338013',
    'photo-1552318965-6e6be7484ada',
    'photo-1579952363873-27f3bade9f55',
    'photo-1614632537197-38a17061c2bd',
    'photo-1560272564-c83b66b1ad12',
    // Running & Shoes
    'photo-1476480862126-209bfaa8edc8',
    'photo-1461896836934- voices',
    'photo-1539185441755-769473a23570',
    'photo-1595950653106-6c9ebd614d3a',
    'photo-1606107557195-0e29a4b5b4aa',
    // Cycling & Outdoor
    'photo-1485965120184-e220f721d03e',
    'photo-1507035895480-2b3156c31fc8',
    'photo-1558618666-fcd25c85cd64',
    'photo-1560769629-975ec94e6a86',
    'photo-1471506480208-91b3a4cc78be',
    // Cricket & Sports Gear
    'photo-1531415074968-036ba1b575da',
    'photo-1624526267942-ab0ff8a3e972',
  ],
  grocery: [
    // Coffee & Tea
    'photo-1559056199-641a0ac8b55e',
    'photo-1514432324607-a09d9b4aefdd',
    'photo-1498804103079-a6351b050096',
    'photo-1509042239860-f550ce710b93',
    'photo-1497515114889-e42f4ea4c09f',
    // Fruits & Vegetables
    'photo-1610832958506-aa56368176cf',
    'photo-1518843875459-f738682238a6',
    'photo-1490474418585-ba9bad8fd0ea',
    'photo-1512621776951-a57141f2eefd',
    'photo-1573246123716-6b1782bfc499',
    // Packaged Foods
    'photo-1604719312566-8912e9227c6a',
    'photo-1607623814075-e51df1bdc82f',
    'photo-1621939514649-280e2ee25f60',
    'photo-1599785209707-a456fc1337bb',
    'photo-1621955511667-e2c316e4575d',
    // Beverages
    'photo-1622483767028-3f66f32aef97',
    'photo-1625772299848-391b6a87d7b3',
    'photo-1546173159-315724a31696',
    'photo-1598614187854-26a60e982dc4',
    'photo-1558642452-9d2a7deb7f62',
    // Snacks
    'photo-1599490659213-e2b9527bd087',
    'photo-1621939514649-280e2ee25f60',
    'photo-1558160074-4d7d8bdf4256',
    'photo-1553909489-ec2175ef3f52',
    'photo-1606787366850-de6330128bfc',
    // Spices & Ingredients
    'photo-1596040033229-a9821ebd058d',
    'photo-1532336414038-cf19250c5757',
    'photo-1505253716362-afaea1d3d1af',
    'photo-1506368249639-73a05d6f6488',
    'photo-1540189549336-e6e99c3679fe',
    // Organic & Health
    'photo-1490645935967-10de6ba17061',
    'photo-1547592180-85f173990554',
  ],
  baby: [
    // Toys
    'photo-1558060370-d644479cb6f7',
    'photo-1596461404969-9ae70f2830c1',
    'photo-1515488042361-ee00e0ddd4e4',
    'photo-1545558014-8692077e9b5c',
    'photo-1587654780291-39c9404d746b',
    // Stuffed Animals
    'photo-1559715745-e1b33a271c8f',
    'photo-1585366119957-e9730b6d0f60',
    'photo-1562040506-a9b32cb51b94',
    'photo-1566576912321-d58ddd7a6088',
    'photo-1530982011887-3cc11cc85693',
    // Baby Clothes
    'photo-1522771930-78b47b0eb3a2',
    'photo-1519689680058-324335c77eba',
    'photo-1607453998774-d533f65dac99',
    'photo-1596870230751-ebdfce98ec42',
    'photo-1612531822840-46cdb62ac98d',
    // Baby Products
    'photo-1555252333-9f8e92e65df9',
    'photo-1594824476967-48c8b964273f',
    'photo-1609220136736-443140cffec6',
    'photo-1583845112203-29329902332e',
    'photo-1600369672770-985fd30004eb',
    // Feeding & Bottles
    'photo-1584839404042-8bc02dd17e7d',
    'photo-1544367567-0f2fcb009e0b',
    'photo-1604654894610-df63bc536371',
    'photo-1590859808308-3d2d9c515b1a',
    'photo-1544473244-96e666a2d0e2',
    // Strollers & Gear
    'photo-1591337676887-a217a6970a8a',
    'photo-1586048958857-4c5f3ea18c8b',
    'photo-1519689680058-324335c77eba',
    'photo-1581573025746-2f3b88ef0794',
    'photo-1595555297609-d1d11b567f89',
    // Educational Toys
    'photo-1560859251-d563a49c5e4a',
    'photo-1596068587619-e4b11c7a3c3b',
  ],
  automotive: [
    // Car Accessories
    'photo-1489824904134-891ab64532f1',
    'photo-1558618666-fcd25c85cd64',
    'photo-1493238792000-8113da705763',
    'photo-1606577924006-27d39b132ae2',
    'photo-1619642751034-765dfdf7c58e',
    // Tools
    'photo-1530124566582-a618bc2615dc',
    'photo-1581091226825-a6a2a5aee158',
    'photo-1504148455328-c376907d081c',
    'photo-1426927308491-6380b6a9936f',
    'photo-1572981779307-38b8cabb2407',
    // Car Parts
    'photo-1486262715619-67b85e0b08d3',
    'photo-1487754180451-c456f719a1fc',
    'photo-1558618666-fcd25c85cd64',
    'photo-1618843479313-40f8afb4b4d8',
    'photo-1492144534655-ae79c964c9d7',
    // Tires & Wheels
    'photo-1580273916550-e323be2ae537',
    'photo-1558618666-fcd25c85cd64',
    'photo-1494976388531-d1058494cdd8',
    'photo-1533473359331-0135ef1b58bf',
    'photo-1503376780353-7e6692767b70',
    // Car Electronics
    'photo-1593062096033-9a26b09da705',
    'photo-1558618666-fcd25c85cd64',
    'photo-1609521263047-f8f205293f24',
    'photo-1610647752706-3bb12232b3ab',
    'photo-1625047509248-ec889cbff17f',
    // Cleaning & Maintenance
    'photo-1600880292203-757bb62b4baf',
    'photo-1558618666-fcd25c85cd64',
    'photo-1610647752706-3bb12232b3ab',
    'photo-1558618666-fcd25c85cd64',
    'photo-1489824904134-891ab64532f1',
    // Motorcycle
    'photo-1558618666-fcd25c85cd64',
    'photo-1558980664-769d59546b3d',
  ],
  digital: [
    // Gift Cards
    'photo-1556742049-0cfed4f6a45d',
    'photo-1563013544-824ae1b704d3',
    'photo-1556742111-a301076d9d18',
    'photo-1579621970563-ebec7560ff3e',
    'photo-1556742393-d75f468bfcb0',
    // Software & Apps
    'photo-1551288049-bebda4e38f71',
    'photo-1460925895917-afdab827c52f',
    'photo-1498050108023-c5249f4df085',
    'photo-1555421689-491a97ff2040',
    'photo-1517694712202-14dd9538aa97',
    // Digital Products
    'photo-1558655146-9f40138edfeb',
    'photo-1611162617213-7d7a39e9b1d7',
    'photo-1551033406-611cf9a28f67',
    'photo-1485827404703-89b55fcc595e',
    'photo-1518770660439-4636190af475',
    // Gaming
    'photo-1612287230202-1ff1d85d1bdf',
    'photo-1593118247619-e2d6f056869e',
    'photo-1605901309584-818e25960a8f',
    'photo-1600861194942-f883de0dfe96',
    'photo-1625805866449-3589fe3f71a3',
    // Subscriptions & Streaming
    'photo-1522869635100-9f4c5e86aa37',
    'photo-1611162616305-c69b3fa7fbe0',
    'photo-1585079542156-2755d9c8a094',
    'photo-1616469829581-73993eb86b02',
    'photo-1594909122845-11baa439b7bf',
    // E-learning
    'photo-1501504905252-473c47e087f8',
    'photo-1434030216411-0b793f4b4173',
    'photo-1488190211105-8b0e65b80b4e',
    'photo-1610484826967-09c5720778c7',
    'photo-1571260899304-425eee4c7efc',
    // Tech & Digital
    'photo-1519389950473-47ba0277781c',
    'photo-1504868584819-f8e8b4b6d7e3',
  ],
}

const PRODUCT_ADJECTIVES = [
  'Premium',
  'Classic',
  'Modern',
  'Elegant',
  'Stylish',
  'Professional',
  'Compact',
  'Lightweight',
  'Durable',
  'Versatile',
  'Portable',
  'High-Quality',
  'Authentic',
  'Original',
  'Handcrafted',
]

function createProductImages(
  count: number = 4,
  categoryId: string = 'electronics',
): Array<ProductImage> {
  const images: Array<ProductImage> = []
  const categoryPool =
    CATEGORY_IMAGES[categoryId] ?? CATEGORY_IMAGES['electronics']

  // Get unique random images from the category pool
  const selectedImages = faker.helpers.arrayElements(
    categoryPool,
    Math.min(count, categoryPool.length),
  )

  for (let i = 0; i < count; i++) {
    const photoId = selectedImages[i % selectedImages.length]
    images.push({
      url: `https://images.unsplash.com/${photoId}?w=500&h=500&fit=crop&auto=format`,
      alt: faker.commerce.productName(),
      isPrimary: i === 0,
    })
  }

  return images
}

function createProductPricing(): ProductPricing {
  const originalPrice = faker.number.int({ min: 200, max: 50000 })
  const discountPercentage = faker.helpers.arrayElement(DISCOUNT_PERCENTAGES)
  const currentPrice = Math.round(
    originalPrice * (1 - discountPercentage / 100),
  )

  return {
    currentPrice,
    originalPrice,
    currency: 'BDT',
    currencySymbol: '৳',
    discountPercentage,
  }
}

function createProductRating(): ProductRating {
  return {
    average: faker.number.float({ min: 2.5, max: 5, fractionDigits: 1 }),
    count: faker.number.int({ min: 5, max: 2000 }),
  }
}

function createProductShipping(): ProductShipping {
  const freeShipping = faker.datatype.boolean({ probability: 0.4 })

  return {
    freeShipping,
    estimatedDays: faker.number.int({ min: 2, max: 7 }),
    cost: freeShipping ? 0 : faker.number.int({ min: 50, max: 150 }),
  }
}

function createProductBadges(): Array<ProductBadge> {
  const badges: Array<ProductBadge> = []
  const possibleBadges: Array<ProductBadge> = [
    'choice',
    'top_seller',
    'new',
    'verified',
  ]

  // 30% chance of having any badge
  if (faker.datatype.boolean({ probability: 0.3 })) {
    const numBadges = faker.number.int({ min: 1, max: 2 })
    const selectedBadges = faker.helpers.arrayElements(
      possibleBadges,
      numBadges,
    )
    badges.push(...selectedBadges)
  }

  return badges
}

function createStockStatus(stock: number): StockStatus {
  if (stock === 0) return 'out_of_stock'
  if (stock < 10) return 'low_stock'
  return 'in_stock'
}

function createProductVariants(
  categoryId: string,
): Array<ProductVariant> | undefined {
  // Only some categories have variants
  const categoriesWithVariants = ['fashion', 'beauty', 'baby', 'home']
  if (!categoriesWithVariants.includes(categoryId)) {
    return undefined
  }

  const variants: Array<ProductVariant> = []

  // Color variants
  if (faker.datatype.boolean({ probability: 0.6 })) {
    const colors = faker.helpers.arrayElements(
      [
        'Red',
        'Blue',
        'Black',
        'White',
        'Green',
        'Pink',
        'Navy',
        'Gray',
        'Brown',
        'Orange',
        'Purple',
        'Yellow',
      ],
      faker.number.int({ min: 2, max: 5 }),
    )

    colors.forEach((color) => {
      variants.push({
        id: faker.string.uuid(),
        type: 'color',
        value: color,
        priceModifier: 0,
        stock: faker.number.int({ min: 0, max: 50 }),
      })
    })
  }

  // Size variants for fashion
  if (
    categoryId === 'fashion' &&
    faker.datatype.boolean({ probability: 0.7 })
  ) {
    const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

    sizes.forEach((size) => {
      variants.push({
        id: faker.string.uuid(),
        type: 'size',
        value: size,
        priceModifier: size === 'XXL' ? 50 : 0,
        stock: faker.number.int({ min: 0, max: 30 }),
      })
    })
  }

  // Material variants for fashion and home
  if (
    (categoryId === 'fashion' || categoryId === 'home') &&
    faker.datatype.boolean({ probability: 0.4 })
  ) {
    const materials = faker.helpers.arrayElements(
      [
        'Cotton',
        'Polyester',
        'Leather',
        'Denim',
        'Silk',
        'Wool',
        'Linen',
        'Synthetic',
      ],
      faker.number.int({ min: 1, max: 3 }),
    )

    materials.forEach((material) => {
      variants.push({
        id: faker.string.uuid(),
        type: 'material',
        value: material,
        priceModifier:
          material === 'Leather' ? 200 : material === 'Silk' ? 150 : 0,
        stock: faker.number.int({ min: 0, max: 25 }),
      })
    })
  }

  return variants.length > 0 ? variants : undefined
}

function createKeyFeatures(): Array<string> {
  return Array.from(
    { length: faker.number.int({ min: 3, max: 5 }) },
    () => faker.commerce.productDescription().split('.')[0],
  )
}

export function createProduct(seed?: number): Product {
  if (seed !== undefined) {
    faker.seed(seed)
  }

  const category = faker.helpers.arrayElement(CATEGORIES)
  const adjective = faker.helpers.arrayElement(PRODUCT_ADJECTIVES)
  const productName = faker.commerce.productName()
  const title = `${adjective} ${productName}`
  const stock = faker.number.int({ min: 0, max: 500 })

  return {
    id: faker.string.uuid(),
    title,
    slug: title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, ''),
    description: faker.commerce.productDescription(),
    shortDescription: faker.lorem.sentence(),
    images: createProductImages(
      faker.number.int({ min: 3, max: 6 }),
      category.id,
    ),
    vendor: getRandomVendor(),
    pricing: createProductPricing(),
    rating: createProductRating(),
    shipping: createProductShipping(),
    stockStatus: createStockStatus(stock),
    stock,
    badges: createProductBadges(),
    categoryId: category.id,
    variants: createProductVariants(category.id),
    keyFeatures: createKeyFeatures(),
    returnPolicy: '7 days return policy',
    warranty: faker.datatype.boolean({ probability: 0.5 })
      ? '1 year manufacturer warranty'
      : undefined,
    createdAt: faker.date.recent({ days: 30 }).toISOString(),
  }
}

export function createProducts(
  count: number,
  startSeed: number = 0,
): Array<Product> {
  return Array.from({ length: count }, (_, i) => createProduct(startSeed + i))
}

// Generate products with specific discounts for deals
export function createDealProduct(seed?: number): Product {
  const product = createProduct(seed)

  // Ensure deal products have significant discounts
  const discountPercentage = faker.helpers.arrayElement([30, 40, 50, 60, 70])
  const originalPrice = product.pricing.originalPrice
  const currentPrice = Math.round(
    originalPrice * (1 - discountPercentage / 100),
  )

  return {
    ...product,
    pricing: {
      ...product.pricing,
      discountPercentage,
      currentPrice,
    },
    badges: [...product.badges, 'top_seller'],
  }
}

export function createDealProducts(
  count: number,
  startSeed: number = 5000,
): Array<Product> {
  return Array.from({ length: count }, (_, i) =>
    createDealProduct(startSeed + i),
  )
}
