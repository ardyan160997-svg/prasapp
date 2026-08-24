import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding default data...");

  // Create default household
  const household = await prisma.household.upsert({
    where: { id: "default-household" },
    update: {},
    create: {
      id: "default-household",
      name: "Keluarga Kita",
      currency: "IDR",
    },
  });
  console.log("Household:", household.name);

  // Create default categories
  const incomeCategories = [
    { name: "Gaji", icon: "💼", color: "#14b8a6" },
    { name: "Bonus", icon: "🎁", color: "#8b5cf6" },
    { name: "Side Hustle", icon: "💻", color: "#f97316" },
    { name: "Investasi", icon: "📈", color: "#22c55e" },
    { name: "Lainnya", icon: "📦", color: "#64748b" },
  ];

  const expenseCategories = [
    { name: "Makanan & Minuman", icon: "🍚", color: "#f97316" },
    { name: "Transport", icon: "🚌", color: "#3b82f6" },
    { name: "Belanja Bulanan", icon: "🛒", color: "#8b5cf6" },
    { name: "Tagihan & Cicilan", icon: "📄", color: "#ef4444" },
    { name: "Kesehatan", icon: "🏥", color: "#ec4899" },
    { name: "Pendidikan", icon: "📚", color: "#06b6d4" },
    { name: "Hiburan", icon: "🎮", color: "#f43f5e" },
    { name: "Lainnya", icon: "📦", color: "#64748b" },
  ];

  for (const cat of incomeCategories) {
    await prisma.category.upsert({
      where: { householdId_type_name: { householdId: household.id, type: "INCOME", name: cat.name } },
      update: {},
      create: { ...cat, householdId: household.id, type: "INCOME", isDefault: true },
    });
  }

  for (const cat of expenseCategories) {
    await prisma.category.upsert({
      where: { householdId_type_name: { householdId: household.id, type: "EXPENSE", name: cat.name } },
      update: {},
      create: { ...cat, householdId: household.id, type: "EXPENSE", isDefault: true },
    });
  }

  console.log("Categories seeded.");

  // Create default owner member
  await prisma.member.upsert({
    where: { householdId_email: { householdId: household.id, email: "owner@family.local" } },
    update: {},
    create: {
      householdId: household.id,
      name: "Owner",
      email: "owner@family.local",
      role: "OWNER",
      isActive: true,
    },
  });

  console.log("Default owner member created.");
  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });