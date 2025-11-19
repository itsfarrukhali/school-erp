import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("SuperAdmin123!", 10);

  const superAdmin = await prisma.user.create({
    data: {
      uid: "SUPERADMIN001",
      username: "superadmin",
      email: "superadmin@erp.com",
      password,
      firstName: "Super",
      lastName: "Admin",
      fullName: "Super Admin",
      gender: "MALE",
      role: "SUPERADMIN",
      isEmailVerified: true,
      status: "ACTIVE",
    },
  });

  console.log("SuperAdmin created:", superAdmin);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
