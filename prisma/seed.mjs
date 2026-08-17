import { PrismaClient } from '../src/generated/prisma/client.ts';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// Load .env.local like Next.js does
dotenv.config({ path: path.join(root, '.env.local') });
dotenv.config({ path: path.join(root, '.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DEFAULT_NOTES = 'Thank you for your purchase at Swift Tech & Games.';
const DEFAULT_TERMS = 'Warranty void if burnt or broken. Original box, stickers, accessories, manuals and invoice are required for warranty.\nWarranty claims can take between 20 to 60 days.';

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'rafay@swifttechngames.com';
  const adminName = process.env.ADMIN_NAME || 'System Admin';
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error(
      'ERROR: ADMIN_PASSWORD environment variable is required for seeding.\n' +
      'Set it before running: ADMIN_PASSWORD=yourpassword npx prisma db seed'
    );
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      role: 'admin',
      isSystem: true,
    },
    create: {
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: 'admin',
      isSystem: true,
    },
  });

  console.log(`✓ Admin user seeded: ${adminEmail}`);

  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      defaultNotes: DEFAULT_NOTES,
      defaultTerms: DEFAULT_TERMS,
    },
  });

  console.log('✓ Default settings seeded');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
    await prisma.$disconnect();
  });
