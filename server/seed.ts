import { execSync } from "child_process";
import { db } from "./db";
import { users, profiles, requests, items } from "@shared/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "./auth";

async function seed() {
  console.log("[seed] Applying schema migrations...");
  try {
    execSync("npx drizzle-kit push --force", { stdio: "inherit" });
    console.log("[seed] Schema is up to date.");
  } catch (err) {
    console.error("[seed] Schema push failed:", err);
    process.exit(1);
  }

  console.log("[seed] Starting seed...");

  const marchantEmail = "reseller@sellzy.demo";
  const sellerEmail = "seller@sellzy.demo";
  const adminEmail = "admin@sellzy.demo";
  const customerEmail = "customer@sellzy.demo";

  const passwordHash = await hashPassword("password123");

  const [existingMarchant] = await db.select().from(users).where(eq(users.email, marchantEmail));
  let marchantId: string;

  if (!existingMarchant) {
    const [marchant] = await db.insert(users).values({
      id: "seed-marchand-001",
      email: marchantEmail,
      firstName: "Sophie",
      lastName: "Martin",
      passwordHash,
    }).returning();
    marchantId = marchant.id;
    console.log("[seed] Created reseller user:", marchantEmail);
  } else {
    marchantId = existingMarchant.id;
    console.log("[seed] Reseller user already exists:", marchantEmail);
  }

  const [existingMarchantProfile] = await db.select().from(profiles).where(eq(profiles.userId, marchantId));
  if (!existingMarchantProfile) {
    await db.insert(profiles).values({
      userId: marchantId,
      role: "marchand",
      status: "approved",
      bio: "Expert fashion reseller with 5 years of experience in luxury clothing and accessories.",
      experience: "5 years",
      city: "Paris",
      department: "75",
      leboncoinUrl: "https://www.leboncoin.fr/profil/sophie-martin-reseller",
      vintedUrl: "https://www.vinted.fr/member/sophie-martin",
      ricardoUrl: "https://www.ricardo.ch/sophie-martin-fashion",
    });
    console.log("[seed] Created reseller profile with platform URLs");
  } else {
    await db.update(profiles).set({
      leboncoinUrl: "https://www.leboncoin.fr/profil/sophie-martin-reseller",
      vintedUrl: "https://www.vinted.fr/member/sophie-martin",
      ricardoUrl: "https://www.ricardo.ch/sophie-martin-fashion",
      status: "approved",
    }).where(eq(profiles.userId, marchantId));
    console.log("[seed] Updated reseller profile with platform URLs");
  }

  const [existingSeller] = await db.select().from(users).where(eq(users.email, sellerEmail));
  let sellerId: string;

  if (!existingSeller) {
    const [seller] = await db.insert(users).values({
      id: "seed-seller-001",
      email: sellerEmail,
      firstName: "Marie",
      lastName: "Dupont",
      passwordHash,
    }).returning();
    sellerId = seller.id;
    console.log("[seed] Created seller user:", sellerEmail);
  } else {
    sellerId = existingSeller.id;
    console.log("[seed] Seller user already exists:", sellerEmail);
  }

  const [existingSellerProfile] = await db.select().from(profiles).where(eq(profiles.userId, sellerId));
  if (!existingSellerProfile) {
    await db.insert(profiles).values({
      userId: sellerId,
      role: "seller",
      status: "approved",
      city: "Lyon",
    });
    console.log("[seed] Created seller profile");
  }

  const [existingRequest] = await db.select().from(requests).where(eq(requests.sellerId, sellerId));
  let requestId: number;

  if (!existingRequest) {
    const [request] = await db.insert(requests).values({
      sellerId,
      marchantId,
      serviceType: "classic",
      status: "in_progress",
      itemCount: 3,
      estimatedValue: "500",
      meetingLocation: "Lyon 6ème",
      notes: "Luxury items including a Chanel bag, Louis Vuitton scarf, and Hermès belt.",
    }).returning();
    requestId = request.id;
    console.log("[seed] Created demo request #" + requestId);
  } else {
    requestId = existingRequest.id;
    console.log("[seed] Demo request already exists #" + requestId);
  }

  const [existingItem] = await db.select().from(items).where(eq(items.requestId, requestId));

  if (!existingItem) {
    await db.insert(items).values([
      {
        requestId,
        sellerId,
        marchantId,
        title: "Chanel Classic Flap Bag - Medium",
        category: "accessories_bags",
        brand: "Chanel",
        condition: "like_new",
        status: "pending_approval",
        minPrice: "2500",
        maxPrice: "3200",
        platformOnly: true,
        description: "Authentic Chanel Classic Flap Bag in black quilted lambskin with gold hardware. Comes with authenticity certificate.",
      },
      {
        requestId,
        sellerId,
        marchantId,
        title: "Louis Vuitton Monogram Scarf",
        category: "accessories_bags",
        brand: "Louis Vuitton",
        condition: "good",
        status: "listed",
        approvedPrice: "220",
        listedAt: new Date(),
        minPrice: "180",
        maxPrice: "250",
        platformOnly: false,
        description: "Classic LV monogram silk scarf, lightly worn.",
      },
      {
        requestId,
        sellerId,
        marchantId,
        title: "Hermès H Belt 90cm",
        category: "accessories_bags",
        brand: "Hermès",
        condition: "like_new",
        status: "pending_approval",
        minPrice: "450",
        maxPrice: "600",
        platformOnly: true,
        description: "Hermès reversible belt, 90cm, black/gold with H buckle.",
      },
    ]);
    console.log("[seed] Created 3 demo items (2 platform-only)");
  } else {
    console.log("[seed] Demo items already exist for request #" + requestId);
  }

  const extraProducts = [
    { title: "Rolex Datejust 36", category: "watches_jewelry", brand: "Rolex", condition: "like_new", approvedPrice: "4200", minPrice: "3900", maxPrice: "4500", description: "Steel Datejust 36 with a silver dial and fluted bezel. Box and papers included." },
    { title: "Nike Air Force 1 '07", category: "clothing", brand: "Nike", condition: "good", approvedPrice: "90", minPrice: "70", maxPrice: "110", description: "White leather sneakers, worn a few times, original laces." },
    { title: "Apple Watch Series 9", category: "phones_wearables", brand: "Apple", condition: "like_new", approvedPrice: "280", minPrice: "240", maxPrice: "320", description: "45mm GPS, midnight aluminum, with sport band and charger." },
    { title: "Sony WH-1000XM5", category: "electronics", brand: "Sony", condition: "good", approvedPrice: "220", minPrice: "180", maxPrice: "260", description: "Noise-cancelling headphones in black, with case and cable." },
    { title: "Canyon Endurace Road Bike", category: "bicycles", brand: "Canyon", condition: "good", approvedPrice: "650", minPrice: "550", maxPrice: "750", description: "Size M endurance road bike, recently serviced." },
    { title: "Le Creuset Dutch Oven 24cm", category: "home_appliances", brand: "Le Creuset", condition: "like_new", approvedPrice: "160", minPrice: "130", maxPrice: "190", description: "Flame-orange cast-iron cocotte, enamel intact." },
    { title: "Vintage Oak Sideboard", category: "furniture", brand: "Maisons du Monde", condition: "fair", approvedPrice: "340", minPrice: "280", maxPrice: "400", description: "Solid oak sideboard, three drawers, light surface wear." },
    { title: "Dior Book Tote", category: "accessories_bags", brand: "Dior", condition: "like_new", approvedPrice: "1800", minPrice: "1600", maxPrice: "2100", description: "Medium oblique canvas tote with leather handles." },
    { title: "Yamaha FG800 Acoustic Guitar", category: "musical_instruments", brand: "Yamaha", condition: "good", approvedPrice: "190", minPrice: "150", maxPrice: "230", description: "Dreadnought acoustic guitar with gig bag." },
    { title: "Moët & Chandon Impérial", category: "wines", brand: "Moët & Chandon", condition: "new_with_tags", approvedPrice: "45", minPrice: "40", maxPrice: "55", description: "Unopened 75cl bottle, stored cool and upright." },
  ];

  for (const product of extraProducts) {
    const [existingProduct] = await db.select().from(items).where(eq(items.title, product.title)).limit(1);
    if (existingProduct) continue;
    await db.insert(items).values({
      requestId,
      sellerId,
      marchantId,
      title: product.title,
      category: product.category,
      brand: product.brand,
      condition: product.condition,
      status: "listed",
      approvedPrice: product.approvedPrice,
      minPrice: product.minPrice,
      maxPrice: product.maxPrice,
      listedAt: new Date(),
      description: product.description,
      platformOnly: false,
    });
    console.log("[seed] Listed product:", product.title);
  }

  const listed = await db.select().from(items).where(eq(items.status, "listed")).limit(1);
  if (listed.length === 0) {
    const [scarf] = await db.select().from(items).where(eq(items.title, "Louis Vuitton Monogram Scarf")).limit(1);
    if (scarf && scarf.status !== "sold") {
      await db.update(items).set({
        status: "listed",
        approvedPrice: scarf.approvedPrice || "220",
        listedAt: new Date(),
      }).where(eq(items.id, scarf.id));
      console.log("[seed] Listed Louis Vuitton Monogram Scarf for checkout.");
    }
  }

  console.log("[seed] Done.");
  const [existingAdmin] = await db.select().from(users).where(eq(users.email, adminEmail));
  let adminId: string;
  if (!existingAdmin) {
    const [admin] = await db.insert(users).values({
      id: "seed-admin-001",
      email: adminEmail,
      firstName: "Alex",
      lastName: "Bernard",
      passwordHash,
    }).returning();
    adminId = admin.id;
    console.log("[seed] Created admin user:", adminEmail);
  } else {
    adminId = existingAdmin.id;
  }
  const [existingAdminProfile] = await db.select().from(profiles).where(eq(profiles.userId, adminId));
  if (!existingAdminProfile) {
    await db.insert(profiles).values({
      userId: adminId,
      role: "admin",
      status: "approved",
    });
    console.log("[seed] Created admin profile");
  }

  const [existingCustomer] = await db.select().from(users).where(eq(users.email, customerEmail));
  let customerId: string;
  if (!existingCustomer) {
    const [customer] = await db.insert(users).values({
      id: "seed-customer-001",
      email: customerEmail,
      firstName: "Camille",
      lastName: "Bernard",
      passwordHash,
    }).returning();
    customerId = customer.id;
    console.log("[seed] Created customer user:", customerEmail);
  } else {
    customerId = existingCustomer.id;
  }
  const [existingCustomerProfile] = await db.select().from(profiles).where(eq(profiles.userId, customerId));
  if (!existingCustomerProfile) {
    await db.insert(profiles).values({
      userId: customerId,
      role: "customer",
      status: "approved",
    });
    console.log("[seed] Created customer profile");
  }

  console.log("[seed] Demo users:");
  console.log("  Reseller: " + marchantEmail + " / password123");
  console.log("  Seller:   " + sellerEmail + " / password123");
  console.log("  Customer: " + customerEmail + " / password123");
  console.log("  Admin:    " + adminEmail + " / password123");
}

seed().catch(console.error).finally(() => process.exit(0));
