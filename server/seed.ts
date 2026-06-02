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
      hasInsurance: true,
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
        status: "pending_approval",
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

  console.log("[seed] Done.");
  console.log("[seed] Demo users:");
  console.log("  Reseller: " + marchantEmail + " / password123");
  console.log("  Seller:   " + sellerEmail + " / password123");
}

seed().catch(console.error).finally(() => process.exit(0));
