import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seedPos() {
  console.log("🌱 Seeding POS Initial Data...");

  // 1. Initial Staff Members
  const staffList = [
    {
      name: "Owner / Master",
      email: "owner@krumbistry.com",
      role: "OWNER" as const,
      pin: "9999",
    },
    {
      name: "Fatima Noor (Manager)",
      email: "fatima.manager@krumbistry.com",
      role: "MANAGER" as const,
      pin: "1234",
    },
    {
      name: "Ali Raza (Cashier)",
      email: "ali.cashier@krumbistry.com",
      role: "CASHIER" as const,
      pin: "5678",
    },
  ];

  for (const s of staffList) {
    const pinHash = await bcrypt.hash(s.pin, 10);
    const staff = await prisma.staff.upsert({
      where: { email: s.email },
      create: {
        name: s.name,
        email: s.email,
        pinHash,
        role: s.role,
        active: true,
        maxOfflineHours: 168, // 7 days offline allowance
      },
      update: {
        name: s.name,
        pinHash,
        role: s.role,
        active: true,
      },
    });
    console.log(`✅ Staff: ${staff.name} (${staff.role}) | PIN: ${s.pin}`);
  }

  // 2. Initial POS Device
  const device = await prisma.device.upsert({
    where: { deviceCode: "POS-01" },
    create: {
      deviceCode: "POS-01",
      name: "Main Counter Terminal",
      branch: "Main Bakery - Peshawar",
      status: "AUTHORIZED",
      allowOffline: true,
      secretTokenHash: await bcrypt.hash("device-secret-pos-01", 10),
    },
    update: {
      name: "Main Counter Terminal",
      status: "AUTHORIZED",
      allowOffline: true,
    },
  });
  console.log(`✅ Device: ${device.deviceCode} - ${device.name}`);

  // 3. Ensure all products have initial inventory
  const products = await prisma.product.findMany();
  for (const p of products) {
    await prisma.product.update({
      where: { id: p.id },
      data: {
        trackInventory: true,
        stockQuantity: p.stockQuantity && p.stockQuantity > 0 ? p.stockQuantity : 50,
        lowStockThreshold: 5,
      },
    });
  }
  console.log(`✅ Updated inventory for ${products.length} products.`);

  console.log("🎉 POS Initial Seeding Completed Successfully!");
}

seedPos()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
