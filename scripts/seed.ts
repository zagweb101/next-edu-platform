/**
 * Seed script — populate the database with initial admin user + sample data
 * Run with: bun run db:seed
 */
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin12345', 12);
  const admin = await db.user.upsert({
    where: { email: 'admin@boilerplate.dev' },
    update: {},
    create: {
      email: 'admin@boilerplate.dev',
      name: 'Admin User',
      password: adminPassword,
      role: Role.ADMIN,
      isActive: true,
      locale: 'ar',
    },
  });
  console.log(`  ✓ Admin user: ${admin.email} (password: admin12345)`);

  // Create manager user
  const managerPassword = await bcrypt.hash('manager12345', 12);
  const manager = await db.user.upsert({
    where: { email: 'manager@boilerplate.dev' },
    update: {},
    create: {
      email: 'manager@boilerplate.dev',
      name: 'Manager User',
      password: managerPassword,
      role: Role.MANAGER,
      isActive: true,
      locale: 'ar',
    },
  });
  console.log(`  ✓ Manager user: ${manager.email} (password: manager12345)`);

  // Create regular user
  const userPassword = await bcrypt.hash('user12345', 12);
  const regularUser = await db.user.upsert({
    where: { email: 'user@boilerplate.dev' },
    update: {},
    create: {
      email: 'user@boilerplate.dev',
      name: 'Regular User',
      password: userPassword,
      role: Role.USER,
      isActive: true,
      locale: 'ar',
    },
  });
  console.log(`  ✓ Regular user: ${regularUser.email} (password: user12345)`);

  // Sample payments
  for (const [i, amount] of [49.99, 99.99, 150.0, 12.5].entries()) {
    await db.payment.upsert({
      where: { moyasarId: `seed_payment_${i}` },
      update: {},
      create: {
        userId: regularUser.id,
        moyasarId: `seed_payment_${i}`,
        amount,
        currency: 'SAR',
        status: i === 3 ? 'FAILED' : 'PAID',
        description: `Sample payment ${i + 1}`,
        method: i % 2 === 0 ? 'CREDITCARD' : 'APPLEPAY',
      },
    });
  }
  console.log('  ✓ Sample payments created');

  // Sample notifications (use individual creates to avoid skipDuplicates issue on SQLite)
  const existingNotifs = await db.notification.count({
    where: { userId: regularUser.id },
  });
  if (existingNotifs === 0) {
    await db.notification.createMany({
      data: [
        {
          userId: regularUser.id,
          title: 'مرحباً بك في النظام',
          body: 'تم إنشاء حسابك بنجاح. ابدأ باستكشاف الميزات الآن!',
          type: 'success',
          channel: 'IN_APP',
          status: 'DELIVERED',
        },
        {
          userId: regularUser.id,
          title: 'تم استلام دفعتك',
          body: 'تم استلام دفعتك بقيمة 99.99 ر.س بنجاح.',
          type: 'success',
          channel: 'IN_APP',
          status: 'DELIVERED',
        },
        {
          userId: regularUser.id,
          title: 'تنبيه أمني',
          body: 'تم تسجيل الدخول من جهاز جديد. إذا لم تكن أنت، يرجى تغيير كلمة المرور.',
          type: 'warning',
          channel: 'IN_APP',
          status: 'READ',
          readAt: new Date(),
        },
      ],
    });
  }
  console.log('  ✓ Sample notifications created');

  console.log('\n✅ Seed completed!');
  console.log('\nTest accounts:');
  console.log('  Admin:    admin@boilerplate.dev / admin12345');
  console.log('  Manager:  manager@boilerplate.dev / manager12345');
  console.log('  User:     user@boilerplate.dev / user12345');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
