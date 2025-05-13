import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Hash passwords
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@example.com',
      passwordHash: hashedPassword,
      role: 'ADMIN'
    }
  });

  // Create Regular User
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      name: 'Regular User',
      email: 'user@example.com',
      passwordHash: hashedPassword,
      // role: 'USER'
    }
  });

  // Create Developer (user with isDeveloper: true)
  const developer = await prisma.user.upsert({
    where: { email: 'dev@example.com' },
    update: {},
    create: {
      name: 'AI Developer',
      email: 'dev@example.com',
      passwordHash: hashedPassword,
      role: 'USER',
      isDeveloper: true
    }
  });

  console.log({ admin, user, developer });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
