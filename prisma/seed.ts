/**
 * Sellzy database seed — raw SQL matching the Drizzle schema column names.
 * Run: npm run db:seed
 */
import dotenv from "dotenv";
dotenv.config();

import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function generatePhone(): string {
  return `0${pickRandom(["6", "7"])}${randomInt(10000000, 99999999)}`;
}
function generateAddress() {
  const streets = [
    "12 Rue de Rivoli", "45 Boulevard Haussmann", "8 Avenue des Champs-Élysées",
    "3 Rue du Faubourg Saint-Antoine", "27 Rue de la Paix", "15 Cours Mirabeau",
  ];
  const cities = [
    { city: "Paris",      postal_code: "75001", department: "Île-de-France" },
    { city: "Marseille",  postal_code: "13001", department: "Provence-Alpes-Côte d'Azur" },
    { city: "Lyon",       postal_code: "69001", department: "Auvergne-Rhône-Alpes" },
    { city: "Bordeaux",   postal_code: "33000", department: "Nouvelle-Aquitaine" },
    { city: "Toulouse",   postal_code: "31000", department: "Occitanie" },
    { city: "Nantes",     postal_code: "44000", department: "Pays de la Loire" },
  ];
  return { address: pickRandom(streets), ...pickRandom(cities) };
}
function generateNotifPrefs(): string {
  return JSON.stringify({
    newRequest: Math.random() > 0.3,
    itemApproved: true,
    itemRejected: Math.random() > 0.2,
    counterOffer: Math.random() > 0.3,
    agreementReady: true,
    messages: Math.random() > 0.4,
    meetings: true,
  });
}

async function q(sql: string, params: any[] = []) {
  return pool.query(sql, params);
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Starting Sellzy seed...");

  // ── 1. Clear existing data ────────────────────────────────────────────────
  console.log("🗑️  Clearing existing data...");
  const deletes = [
    "moderation_actions", "fee_tier_changelog", "agreement_signatures",
    "agreements", "item_price_offers", "item_document_requests",
    "item_documents", "reviews", "transactions", "meetings",
    "messages", "notifications", "items", "requests", "profiles",
    "email_verification_codes", "password_reset_tokens",
    "sessions", "users", "fee_tiers",
  ];
  for (const table of deletes) {
    await q(`DELETE FROM ${table}`);
  }

  // ── 2. Fee tiers ──────────────────────────────────────────────────────────
  console.log("💶 Creating fee tiers...");
  const { rows: tiers } = await q(`
    INSERT INTO fee_tiers
      (label, min_price, max_price, seller_percent, marchand_percent, platform_percent, currency_note, is_active)
    VALUES
      ('Tier 1 : 0 – 150 €',   0,   150, 50, 40, 10, 'EUR/CHF', true),
      ('Tier 2 : 151 – 500 €', 151, 500, 55, 35, 10, 'EUR/CHF', true),
      ('Tier 3 : 501 € +',     501, NULL, 60, 30, 10, 'EUR/CHF', true)
    RETURNING id
  `);
  const [tier1Id] = tiers.map((r: any) => r.id);

  // All test accounts share this password: Sellzy2026!
  const PW = '$2b$10$yF8xTCmhErWHKqHFDgX0yODmuhpCAzcRgFCL5DCMKOWqQTSQcymvW';

  // ── 3. Admin users ────────────────────────────────────────────────────────
  console.log("👑 Creating admin users (3)...");
  const { rows: adminUsers } = await q(`
    INSERT INTO users (email, password_hash, first_name, last_name, profile_image_url)
    VALUES
      ('admin.moreau@example.fr',   $1, 'André',    'Moreau',   'https://i.pravatar.cc/150?u=admin1'),
      ('admin.lefevre@example.fr',  $1, 'Isabelle', 'Lefebvre', 'https://i.pravatar.cc/150?u=admin2'),
      ('admin.renard@example.fr',   $1, 'Claude',   'Renard',   'https://i.pravatar.cc/150?u=admin3')
    RETURNING id
  `, [PW]);
  for (const u of adminUsers) {
    await q(`
      INSERT INTO profiles (user_id, role, status, phone, notification_prefs)
      VALUES ($1, 'admin', 'approved', $2, $3)
    `, [u.id, generatePhone(), generateNotifPrefs()]);
  }

  // ── 4. Seller users ───────────────────────────────────────────────────────
  console.log("🛍️  Creating seller users (5)...");
  const sellerRows = [
    { email: "seller.dupont@example.fr",  first: "Pierre", last: "Dupont",  img: "seller1", bio: "Vend des articles de mode haut de gamme." },
    { email: "seller.martin@example.fr",  first: "Marie",  last: "Martin",  img: "seller2", bio: "Spécialisée en électronique et high-tech." },
    { email: "seller.bernard@example.fr", first: "Jean",   last: "Bernard", img: "seller3", bio: "Vendeur généraliste, articles variés." },
    { email: "seller.laurent@example.fr", first: "Sophie", last: "Laurent", img: "seller4", bio: "Vêtements enfants et jouets de qualité." },
    { email: "seller.leclerc@example.fr", first: "Marc",   last: "Leclerc", img: "seller5", bio: "Mobilier et décoration intérieure." },
  ];
  const sellerUsers: string[] = [];
  for (const s of sellerRows) {
    const { rows } = await q(`
      INSERT INTO users (email, password_hash, first_name, last_name, profile_image_url)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, [s.email, PW, s.first, s.last, `https://i.pravatar.cc/150?u=${s.img}`]);
    const uid = rows[0].id;
    sellerUsers.push(uid);
    const addr = generateAddress();
    await q(`
      INSERT INTO profiles
        (user_id, role, status, phone, address, city, postal_code, department, bio, notification_prefs)
      VALUES ($1, 'seller', 'approved', $2, $3, $4, $5, $6, $7, $8)
    `, [uid, generatePhone(), addr.address, addr.city, addr.postal_code, addr.department, s.bio, generateNotifPrefs()]);
  }

  // ── 5. Marchand (reseller) users ──────────────────────────────────────────
  console.log("🤝 Creating marchand users (3)...");
  const marchRows = [
    { email: "marchand.bernard@example.fr",  first: "Thomas",  last: "Bernard",  status: "approved", bio: "Revendeur expérimenté, 8 ans sur le marché. Service irréprochable.", img: "march1" },
    { email: "marchand.simon@example.fr",    first: "Émilie",  last: "Simon",    status: "approved", bio: "Revendeuse secondaire, activité occasionnelle.", img: "march2" },
    { email: "marchand.rousseau@example.fr", first: "Nicolas", last: "Rousseau", status: "pending",  bio: "Nouveau revendeur en attente de validation.", img: "march3" },
  ];
  const marchUsers: string[] = [];
  for (const m of marchRows) {
    const { rows } = await q(`
      INSERT INTO users (email, password_hash, first_name, last_name, profile_image_url)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, [m.email, PW, m.first, m.last, `https://i.pravatar.cc/150?u=${m.img}`]);
    const uid = rows[0].id;
    marchUsers.push(uid);
    const addr = generateAddress();
    const siret = m.status === "pending" ? null : `${addr.postal_code.slice(0, 2)}123${randomInt(10000000, 99999999)}`;
    const exp = m.status === "pending" ? null : `${randomInt(5, 15)} ans de revente`;
    await q(`
      INSERT INTO profiles
        (user_id, role, status, phone, address, city, postal_code, department, bio, experience, siret_number, notification_prefs)
      VALUES ($1, 'marchand', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [uid, m.status, generatePhone(), addr.address, addr.city, addr.postal_code, addr.department, m.bio, exp, siret, generateNotifPrefs()]);
  }

  const [march1, march2] = marchUsers;

  // ── 6. Requests & items ───────────────────────────────────────────────────
  console.log("📦 Creating requests & items...");

  // Request 1 — Pending, no marchand, Seller 0
  const { rows: [req1] } = await q(`
    INSERT INTO requests
      (seller_id, service_type, status, item_count, categories, item_condition, meeting_location, notes)
    VALUES ($1, 'resale', 'pending', 3, ARRAY['mode','accessoires'], 'excellent',
            'Paris, 75001', 'Articles de créateur, manipuler avec soin.')
    RETURNING id
  `, [sellerUsers[0]]);

  await q(`
    INSERT INTO items
      (request_id, seller_id, title, description, brand, category, subcategory,
       condition, status, min_price, max_price, photos)
    VALUES
      ($1, $2, 'Sac à main vintage en cuir',   'Sac de créateur authentique',         'Hermès', 'maroquinerie', 'sacs', 'excellent',  'pending_approval', 150, 200, ARRAY['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400']),
      ($1, $2, 'Foulard en soie',              'Foulard classique d''une marque de luxe', 'Hermès', 'accessoires', NULL,   'excellent',  'pending_approval', 50,  80,  ARRAY['https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400']),
      ($1, $2, 'Lunettes de soleil',           'Lunettes de créateur avec étui',      'Chanel', 'accessoires', NULL,   'comme_neuf', 'pending_approval', 120, 150, ARRAY['https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400'])
  `, [req1.id, sellerUsers[0]]);

  // Request 2 — In progress, assigned to march1, Seller 1
  const { rows: [req2] } = await q(`
    INSERT INTO requests
      (seller_id, marchand_id, service_type, status, item_count, categories, meeting_location)
    VALUES ($1, $2, 'resale', 'in_progress', 2, ARRAY['electronique'], 'Marseille, 13001')
    RETURNING id
  `, [sellerUsers[1], march1]);

  await q(`
    INSERT INTO items
      (request_id, seller_id, marchand_id, title, description, brand, category,
       subcategory, condition, status, min_price, max_price, approved_price,
       price_approved_by_seller, model, photos)
    VALUES
      ($1, $2, $3, 'Apple AirPods Pro', 'Écouteurs sans fil, boîte d''origine', 'Apple', 'electronique', 'audio', 'excellent', 'approved', 180, 220, 200, true, 'AirPods Pro 2', ARRAY['https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400']),
      ($1, $2, $3, 'Câble USB-C',       'Câble de charge haute qualité',        'Apple', 'electronique', NULL,    'neuf',      'approved', 15,  25,  20,  true, NULL,           ARRAY['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'])
  `, [req2.id, sellerUsers[1], march1]);

  // Request 3 — Completed, Seller 2 + march2
  const { rows: [req3] } = await q(`
    INSERT INTO requests
      (seller_id, marchand_id, service_type, status, item_count, categories,
       meeting_location, completed_at)
    VALUES ($1, $2, 'resale', 'completed', 1, ARRAY['mode'], 'Lyon, 69001', '2026-04-15')
    RETURNING id
  `, [sellerUsers[2], march2]);

  const { rows: [soldItem] } = await q(`
    INSERT INTO items
      (request_id, seller_id, marchand_id, title, description, brand, category,
       condition, status, min_price, max_price, approved_price,
       price_approved_by_seller, sale_price, sold_at, photos)
    VALUES ($1, $2, $3,
      'Veste en cuir noir', 'Veste en cuir véritable, taille M', 'Sandro', 'mode',
      'tres_bon', 'sold', 80, 120, 110, true, 110, '2026-04-10',
      ARRAY['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400'])
    RETURNING id
  `, [req3.id, sellerUsers[2], march2]);

  // Transaction for sold item (Tier 1: 50/40/10)
  await q(`
    INSERT INTO transactions
      (item_id, request_id, seller_id, marchand_id, sale_price,
       seller_earning, marchand_earning, platform_earning,
       fee_tier_id, seller_percent, marchand_percent, platform_percent, status)
    VALUES ($1, $2, $3, $4, 110, 55, 44, 11, $5, 50, 40, 10, 'completed')
  `, [soldItem.id, req3.id, sellerUsers[2], march2, tier1Id]);

  // Review for request 3
  await q(`
    INSERT INTO reviews
      (request_id, seller_id, marchand_id, rating, comment,
       communication_rating, reliability_rating, handling_rating)
    VALUES ($1, $2, $3, 5,
      'Service impeccable, vente rapide et transparente. Très satisfait !', 5, 5, 4)
  `, [req3.id, sellerUsers[2], march2]);

  // ── 7. Meeting for request 2 ──────────────────────────────────────────────
  console.log("📅 Creating meeting...");
  await q(`
    INSERT INTO meetings (request_id, scheduled_date, location, duration, status, notes)
    VALUES ($1, '2026-06-10 14:00:00', '13 Rue de la République, Marseille 13001', 60,
            'scheduled', 'Apporter les articles dans leur emballage d''origine.')
  `, [req2.id]);

  // ── 8. Messages ───────────────────────────────────────────────────────────
  console.log("💬 Creating messages...");
  await q(`
    INSERT INTO messages (sender_id, receiver_id, request_id, content, is_read)
    VALUES
      ($1, $2, $3, 'Bonjour, j''ai bien reçu votre confirmation. À quelle heure vous convient-il ?', true),
      ($2, $1, $3, 'Bonjour Marie ! 14h me conviendrait parfaitement. Je serai ponctuel.', false)
  `, [sellerUsers[1], march1, req2.id]);

  // ── 9. Notifications ──────────────────────────────────────────────────────
  console.log("🔔 Creating notifications...");
  await q(`
    INSERT INTO notifications (user_id, type, title, message, link, is_read)
    VALUES
      ($1, 'message',     'Nouveau message',  'Thomas Bernard vous a répondu concernant votre demande.', $3, false),
      ($2, 'new_request', 'Nouvelle demande', 'Une nouvelle demande de revente est disponible.', $4, false)
  `, [sellerUsers[1], march1, `/requests/${req2.id}`, `/requests/${req1.id}`]);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n✅ Seed terminé avec succès !");
  console.log("────────────────────────────────────────────────");
  console.log(`  Admins    : ${adminUsers.length}`);
  console.log(`  Sellers   : ${sellerUsers.length}`);
  console.log(`  Marchands : ${marchUsers.length}`);
  console.log("  Requests  : 3  (pending / in_progress / completed)");
  console.log("  Fee tiers : 3  (Tier 1/2/3)");
  console.log("────────────────────────────────────────────────");
  console.log("\n📋 Comptes de test :");
  console.log("  admin.moreau@example.fr");
  console.log("  seller.dupont@example.fr");
  console.log("  marchand.bernard@example.fr");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e.message ?? e);
    process.exit(1);
  })
  .finally(() => pool.end());
