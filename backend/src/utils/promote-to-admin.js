import 'dotenv/config.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function promoteToAdmin(email) {
  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      console.error(`❌ User with email "${email}" not found`);
      process.exit(1);
    }

    const updated = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
    });

    console.log(`✅ Successfully promoted ${email} to ADMIN role`);
    console.log(`User details:`, {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2];

if (!email) {
  console.log('Usage: node promote-to-admin.js <email>');
  console.log('Example: node promote-to-admin.js admin@example.com');
  process.exit(1);
}

promoteToAdmin(email);
