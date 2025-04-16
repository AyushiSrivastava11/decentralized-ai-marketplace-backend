import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// async function main() {
//   const user = await prisma.user.create({
//     data: {
//       name: "Alice",
//       email: "alice@example.com",
//       posts: {
//         create: {
//           title: "Hello World",
//           content: "This is my first post!",
//         }
//       }
//     },
//     include: {
//       posts: true
//     }
//   });

//   console.log(user);
// }

// main()
//   .then(async () => {
//     console.log("✅ Done");
//     await prisma.$disconnect();
//   })
//   .catch(async (e) => {
//     console.error("❌ Error:", e);
//     await prisma.$disconnect();
//     process.exit(1);
//   });


export default prisma;