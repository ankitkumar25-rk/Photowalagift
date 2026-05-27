import 'dotenv/config';
import prisma from '../lib/prisma.js';

async function clearData() {
  console.log('🗑️  Starting secure database cleanup...');

  // 1. Support Tickets
  await prisma.supportTicket.deleteMany();
  console.log('✅ Support tickets cleared');

  // 2. Returns
  await prisma.return.deleteMany();
  console.log('✅ Returns cleared');

  // 3. Reviews
  await prisma.review.deleteMany();
  console.log('✅ Reviews cleared');

  // 4. Payments
  await prisma.payment.deleteMany();
  console.log('✅ Payments cleared');

  // 5. Service Orders
  await prisma.serviceOrder.deleteMany();
  console.log('✅ Service orders cleared');

  // 6. Order Items
  await prisma.orderItem.deleteMany();
  console.log('✅ Order items cleared');

  // 7. Orders
  await prisma.order.deleteMany();
  console.log('✅ Orders cleared');

  // 8. Cart Items
  await prisma.cartItem.deleteMany();
  console.log('✅ Cart items cleared');

  // 9. Carts
  await prisma.cart.deleteMany();
  console.log('✅ Carts cleared');

  // 10. Wishlist Items
  await prisma.wishlistItem.deleteMany();
  console.log('✅ Wishlist items cleared');

  // 11. Refresh & Reset Tokens
  await prisma.refreshToken.deleteMany({
    where: {
      user: {
        role: 'CUSTOMER'
      }
    }
  });
  await prisma.passwordResetToken.deleteMany({
    where: {
      user: {
        role: 'CUSTOMER'
      }
    }
  });
  console.log('✅ Customer auth tokens cleared');

  // 12. Addresses
  await prisma.address.deleteMany({
    where: {
      user: {
        role: 'CUSTOMER'
      }
    }
  });
  console.log('✅ Customer addresses cleared');

  // 13. Customers (ONLY CUSTOMERS — ADMIN + SUPER_ADMIN stay intact)
  const deleteResult = await prisma.user.deleteMany({
    where: {
      role: 'CUSTOMER'
    }
  });
  console.log(`✅ Customers cleared (${deleteResult.count} users deleted)`);

  console.log('\n🎉 Secure database reset completed successfully!');
  console.log('🔒 ADMIN & SUPER_ADMIN logins are intact.');
  console.log('🔒 Product catalog, categories, and images are untouched.');
  console.log('🔒 Service definitions are preserved.');
}

clearData()
  .catch((err) => {
    console.error('❌ Secure cleanup failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
