// scripts/seed.ts
// Run: npx tsx scripts/seed.ts
import * as dotenv from "dotenv";
// Load .env first (real credentials), then .env.local can override
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../lib/schema";
import bcrypt from "bcryptjs";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
  console.log("🌱 Seeding database...");

  // Admin user
  const adminHash = await bcrypt.hash("Admin@123", 12);
  const sellerHash = await bcrypt.hash("Seller@123", 12);

  const [admin] = await db
    .insert(schema.users)
    .values([
      {
        name: "Super Admin",
        email: "admin@asamedchem.com",
        passwordHash: adminHash,
        role: "admin",
      },
      {
        name: "Test Seller",
        email: "seller@asamedchem.com",
        passwordHash: sellerHash,
        role: "seller",
      },
    ])
    .onConflictDoNothing()
    .returning();

  console.log("✅ Users seeded");

  // Categories
  const [cats] = await db
    .insert(schema.categories)
    .values([
      { name: "APIs & Active Ingredients", description: "Active pharmaceutical ingredients" },
      { name: "Excipients", description: "Inactive ingredients used as carrier or binder" },
      { name: "Solvents & Reagents", description: "Chemical solvents and reagents" },
      { name: "Lab Consumables", description: "Lab items sold by unit count" },
    ])
    .onConflictDoNothing()
    .returning();

  const allCats = await db.select().from(schema.categories);
  console.log("✅ Categories seeded:", allCats.length);

  const apiCat = allCats.find((c) => c.name === "APIs & Active Ingredients");
  const excipCat = allCats.find((c) => c.name === "Excipients");
  const solventCat = allCats.find((c) => c.name === "Solvents & Reagents");
  const labCat = allCats.find((c) => c.name === "Lab Consumables");

  // Products - mix of weight, volume, count
  await db
    .insert(schema.products)
    .values([
      // Weight-based (base unit: g, price per gram)
      {
        name: "Paracetamol USP",
        sku: "PARA-USP-001",
        description: "High purity paracetamol, Ph. Eur. grade",
        categoryId: apiCat?.id,
        dimension: "weight",
        baseUnit: "g",
        stockQuantity: "50000", // 50 kg in grams
        pricePerBaseUnit: "2.500000", // ₹2.50 per gram = ₹2500/kg
        minOrderQuantity: "100",
        isActive: true,
      },
      {
        name: "Ibuprofen BP",
        sku: "IBU-BP-002",
        description: "Ibuprofen British Pharmacopoeia grade",
        categoryId: apiCat?.id,
        dimension: "weight",
        baseUnit: "g",
        stockQuantity: "25000", // 25 kg
        pricePerBaseUnit: "4.800000", // ₹4.80/g = ₹4800/kg
        minOrderQuantity: "500",
        isActive: true,
      },
      {
        name: "Microcrystalline Cellulose PH-101",
        sku: "MCC-PH101-003",
        description: "MCC excipient for tablet compression",
        categoryId: excipCat?.id,
        dimension: "weight",
        baseUnit: "g",
        stockQuantity: "200000", // 200 kg
        pricePerBaseUnit: "0.350000", // ₹0.35/g = ₹350/kg
        minOrderQuantity: "1000",
        isActive: true,
      },
      {
        name: "Lactose Monohydrate",
        sku: "LAC-MONO-004",
        description: "Pharma grade lactose monohydrate",
        categoryId: excipCat?.id,
        dimension: "weight",
        baseUnit: "g",
        stockQuantity: "100000",
        pricePerBaseUnit: "0.280000", // ₹0.28/g = ₹280/kg
        minOrderQuantity: "500",
        isActive: true,
      },
      // Volume-based (base unit: mL, price per mL)
      {
        name: "Ethanol (Absolute) 99.9%",
        sku: "ETH-ABS-005",
        description: "Absolute ethanol, HPLC grade",
        categoryId: solventCat?.id,
        dimension: "volume",
        baseUnit: "mL",
        stockQuantity: "500000", // 500 L in mL
        pricePerBaseUnit: "0.180000", // ₹0.18/mL = ₹180/L
        minOrderQuantity: "500",
        isActive: true,
      },
      {
        name: "Methanol HPLC Grade",
        sku: "MET-HPLC-006",
        description: "HPLC grade methanol, ≥99.9% purity",
        categoryId: solventCat?.id,
        dimension: "volume",
        baseUnit: "mL",
        stockQuantity: "200000", // 200 L
        pricePerBaseUnit: "0.220000", // ₹0.22/mL = ₹220/L
        minOrderQuantity: "250",
        isActive: true,
      },
      {
        name: "Sodium Hydroxide Solution (1M)",
        sku: "NaOH-1M-007",
        description: "1M NaOH aqueous solution, titration grade",
        categoryId: solventCat?.id,
        dimension: "volume",
        baseUnit: "mL",
        stockQuantity: "100000", // 100 L
        pricePerBaseUnit: "0.045000", // ₹0.045/mL = ₹45/L
        minOrderQuantity: "1000",
        isActive: true,
      },
      // Count-based (base unit: ea)
      {
        name: "HPLC Column C18 (250mm×4.6mm)",
        sku: "HPLC-C18-008",
        description: "Reverse-phase C18 HPLC column, 5μm particle size",
        categoryId: labCat?.id,
        dimension: "count",
        baseUnit: "ea",
        stockQuantity: "25",
        pricePerBaseUnit: "18500.000000", // ₹18,500 per column
        minOrderQuantity: "1",
        isActive: true,
      },
      {
        name: "Glass Volumetric Flask 1L",
        sku: "VF-1L-009",
        description: "Class A glass volumetric flask, 1L",
        categoryId: labCat?.id,
        dimension: "count",
        baseUnit: "ea",
        stockQuantity: "100",
        pricePerBaseUnit: "850.000000", // ₹850 each
        minOrderQuantity: "1",
        isActive: true,
      },
      {
        name: "Aspirin IP Grade",
        sku: "ASP-IP-010",
        description: "Aspirin Indian Pharmacopoeia grade",
        categoryId: apiCat?.id,
        dimension: "weight",
        baseUnit: "g",
        stockQuantity: "75000",
        pricePerBaseUnit: "1.200000", // ₹1.20/g = ₹1200/kg
        minOrderQuantity: "100",
        isActive: true,
      },
    ])
    .onConflictDoNothing();

  console.log("✅ Products seeded");
  console.log("");
  console.log("─────────────────────────────────────────────");
  console.log("🎉 Seed complete! Test credentials:");
  console.log("   Admin:  admin@asamedchem.com / Admin@123");
  console.log("   Seller: seller@asamedchem.com / Seller@123");
  console.log("─────────────────────────────────────────────");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
