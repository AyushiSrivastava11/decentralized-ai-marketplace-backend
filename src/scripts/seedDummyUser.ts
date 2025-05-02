import prisma from "../database/prismaClient"; // or "../src/lib/prisma" if not using alias

async function main() {
  const existing = await prisma.user.findUnique({ where: { id: "allahabibi" } });
  if (existing) {
    console.log("Dummy user already exists.");
    return;
  }

  const user = await prisma.user.create({
    data: {
      id: "allahabibi",
      email: "allahabibi@dev.com",
      name: "allahabibi Developer",
      passwordHash: "allahabibi-password", // Replace with an actual hashed password
    },
  });

  console.log("Dummy user created:", user);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
