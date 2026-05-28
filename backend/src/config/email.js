// Email configuration moved to mailer.js using Nodemailer
const FROM = process.env.FROM_EMAIL || process.env.SMTP_USER || 'Photowala Gift';

const SHARED_FOOTER = `
  <div style="
    text-align: center;
    padding: 24px 20px;
    color: #888888;
    font-size: 12px;
    font-family: 'DM Sans', Arial, sans-serif;
    border-top: 1px solid #f5e7d8;
    margin-top: 24px;
  ">
    <p style="margin: 4px 0; color: #5b3f2f; font-weight: 600;">
      PhotowalaGift
    </p>
    <p style="margin: 4px 0;">
      Floor No. 04, Khasra No. 409, Kumawat Colony,
    </p>
    <p style="margin: 4px 0;">
      Sithal Road, Jhunjhunu, Rajasthan — 333012
    </p>
    <p style="margin: 8px 0 4px 0;">
      © ${new Date().getFullYear()} PhotowalaGift. All rights reserved.
    </p>
  </div>
`;

// sendEmail function removed - use sendMail from lib/mailer.js instead

export const emailTemplates = {
  orderConfirmation: (order, user) => ({
    subject: `Order Confirmed #${order.orderNumber} 🎁`,
    html: `
      <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #2e211c;">
        <div style="background: #5a3f2f; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Photowala Gift</h1>
        </div>
        <div style="padding: 40px; background: #fffdfb; border: 1px solid #f5e7d8; border-top: none; border-radius: 0 0 12px 12px;">
          <h2 style="color: #5a3f2f; margin-top: 0;">Hi ${user.name}, your order is confirmed! 🎉</h2>
          <p>We've received your order and are getting it ready for crafting.</p>
          
          <div style="background: #f7f0e7; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 5px 0;">Order Number: <strong>#${order.orderNumber}</strong></p>
            <p style="margin: 5px 0;">Total Amount: <strong>₹${order.total}</strong></p>
          </div>
          
          <p>We'll notify you once your premium gift has been shipped.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.CLIENT_URL}/orders/${order.id}" 
               style="background: #5a3f2f; color: white; padding: 14px 28px; text-decoration: none; border-radius: 30px; display: inline-block; font-weight: bold; box-shadow: 0 4px 12px rgba(90, 63, 47, 0.2);">
              Track My Order
            </a>
          </div>
          
          ${SHARED_FOOTER}
        </div>
      </div>
    `,
  }),

  shippingConfirmation: (order, user) => ({
    subject: `Your Photowala Gift Order has been Shipped! 🚚`,
    html: `
      <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #2e211c;">
        <div style="background: #5a3f2f; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Photowala Gift</h1>
        </div>
        <div style="padding: 40px; background: #fffdfb; border: 1px solid #f5e7d8; border-top: none; border-radius: 0 0 12px 12px;">
          <h2 style="color: #5a3f2f; margin-top: 0;">Hi ${user.name}, your order has been shipped! 🚚</h2>
          <p>Great news! Your premium personalized gift is handcrafted, packed, and on its way to you.</p>
          
          <div style="background: #f7f0e7; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 5px 0;">Order Number: <strong>#${order.orderNumber}</strong></p>
            <p style="margin: 5px 0;">Courier Partner: <strong>${order.courierName || 'Shiprocket Partner'}</strong></p>
            <p style="margin: 5px 0;">Tracking Number: <strong>${order.trackingNumber || order.awbNumber || 'N/A'}</strong></p>
          </div>
          
          <p>You can track your package live directly on our website using the link below:</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.CLIENT_URL}/orders/${order.id}" 
               style="background: #5a3f2f; color: white; padding: 14px 28px; text-decoration: none; border-radius: 30px; display: inline-block; font-weight: bold; box-shadow: 0 4px 12px rgba(90, 63, 47, 0.2);">
              Track My Order on Website ↗
            </a>
          </div>
          
          ${SHARED_FOOTER}
        </div>
      </div>
    `,
  }),

  welcomeEmail: (user) => ({
    subject: 'Welcome to Photowala Gift! 🎁',
    html: `
      <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #2e211c;">
        <div style="background: #5a3f2f; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to Photowala</h1>
        </div>
        <div style="padding: 40px; background: #fffdfb; border: 1px solid #f5e7d8; border-top: none; border-radius: 0 0 12px 12px;">
          <h2 style="color: #5a3f2f; margin-top: 0;">Hi ${user.name}! 🎉</h2>
          <p>Thank you for joining Photowala Gift. We specialize in personalized photogifts, premium mementos, and celebration-ready keepsakes.</p>
          
          <p>Discover our wide collection of Trophies, Corporate Gifts, and custom models designed to capture your best moments.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.CLIENT_URL}/products"
               style="background: #5a3f2f; color: white; padding: 14px 28px; text-decoration: none; border-radius: 30px; display: inline-block; font-weight: bold; box-shadow: 0 4px 12px rgba(90, 63, 47, 0.2);">
              Start Shopping
            </a>
          </div>
          
          ${SHARED_FOOTER}
        </div>
      </div>
    `,
  }),

  emailVerification: (user, verificationLink) => ({
    subject: 'Verify Your Email - Photowala Gift',
    html: `
      <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #2e211c;">
        <div style="background: #5a3f2f; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Verify Your Email</h1>
        </div>
        <div style="padding: 40px; background: #fffdfb; border: 1px solid #f5e7d8; border-top: none; border-radius: 0 0 12px 12px;">
          <h2 style="color: #5a3f2f; margin-top: 0;">Hi ${user.name}! 👋</h2>
          <p>Welcome to Photowala Gift! Please verify your email address to complete your registration.</p>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="${verificationLink}"
               style="background: #b88a2f; color: white; padding: 14px 32px; text-decoration: none; border-radius: 30px; display: inline-block; font-weight: bold; box-shadow: 0 4px 12px rgba(184, 138, 47, 0.2);">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #7a655c; font-size: 13px; text-align: center;">
            Or copy and paste this link in your browser:<br>
            <code style="word-break: break-all; color: #5a3f2f;">${verificationLink}</code>
          </p>
          
          <p style="color: #7a655c; font-size: 13px; margin-top: 25px;">
            This verification link will expire in 24 hours. If you didn't create this account, please ignore this email.
          </p>
          
          ${SHARED_FOOTER}
        </div>
      </div>
    `,
  }),

  adminNewOrder: (order, user) => ({
    subject: `🚨 New Order Received #${order.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px;">
        <h2 style="color: #5a3f2f;">New Order Alert! 📦</h2>
        <p>Order Number: <strong>#${order.orderNumber}</strong></p>
        <p>Customer: <strong>${user.name} (${user.email})</strong></p>
        <p>Total Amount: <strong>₹${order.total}</strong></p>
        <p>Check the admin panel for details and production files.</p>
        <div style="margin-top: 20px;">
          <a href="${process.env.ADMIN_URL}/orders/${order.id}" 
             style="background: #b88a2f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Manage Order
          </a>
        </div>
      </div>
    `,
  }),

  adminNewServiceRequest: (request, user) => ({
    subject: `🛠️ New Service Request #${request.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px;">
        <h2 style="color: #b88a2f;">New Service Request!</h2>
        <p>Request ID: <strong>#${request.orderNumber}</strong></p>
        <p>Service: <strong>${request.serviceType}</strong></p>
        <p>Customer: <strong>${user?.name || 'Guest'} (${user?.email || 'N/A'})</strong></p>
        <p>Est. Price: <strong>${request.priceRange}</strong></p>
        <div style="margin-top: 20px;">
          <a href="${process.env.ADMIN_URL}/service-requests" 
             style="background: #5a3f2f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            View Requests
          </a>
        </div>
      </div>
    `,
  }),

  adminTransaction: (order, user, transactionType) => {
    const typeLabel = {
      ORDER_CREATED: '📦 New Order Created',
      ORDER_PAID: '✅ Order Payment Received',
      ORDER_SHIPPED: '🚚 Order Shipped',
      ORDER_RETURNED: '↩️ Order Return Initiated',
      ORDER_CANCELLED: '❌ Order Cancelled',
    }[transactionType] || '🔔 Transaction Update';

    return {
      subject: typeLabel,
      html: `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #2e211c; border: 2px solid #b88a2f;">
          <div style="background: linear-gradient(135deg, #5a3f2f 0%, #7a5a47 100%); padding: 25px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 22px;">${typeLabel}</h1>
          </div>
          <div style="padding: 30px; background: #fffdfb; border-radius: 0 0 8px 8px;">
            <p style="margin: 0 0 20px 0; color: #7a655c; font-size: 14px;"><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
            
            <div style="background: #f7f0e7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #b88a2f;">
              <p style="margin: 8px 0;"><strong style="color: #5a3f2f;">Order Details:</strong></p>
              <p style="margin: 5px 0;">📝 <strong>Order ID:</strong> #${order.orderNumber || order.id}</p>
              <p style="margin: 5px 0;">💰 <strong>Amount:</strong> ₹${order.total}</p>
              <p style="margin: 5px 0;">👤 <strong>Customer:</strong> ${user.name} (${user.email})</p>
              <p style="margin: 5px 0;">📞 <strong>Contact:</strong> ${user.phone || 'N/A'}</p>
              <p style="margin: 5px 0;">🛒 <strong>Items:</strong> ${order.items?.length || 0} item(s)</p>
            </div>
            
            <div style="background: #e8f4f8; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2196F3;">
              <p style="margin: 0; color: #1565c0; font-size: 13px;">⚡ <strong>Action Required:</strong> Review this transaction in the admin panel</p>
            </div>
            
            <div style="text-align: center; margin-top: 25px;">
              <a href="${process.env.ADMIN_URL}/orders/${order.id}" 
                 style="background: #b88a2f; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; box-shadow: 0 4px 8px rgba(184, 138, 47, 0.2);">
                View in Admin Panel
              </a>
            </div>
            
            <p style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #f5e7d8; text-align: center; color: #7a655c; font-size: 12px;">
              © ${new Date().getFullYear()} PhotowalaGift. All transactions monitored.
            </p>
          </div>
        </div>
      `,
    };
  },

  passwordReset: (user, resetUrl) => ({
    subject: 'Reset Your Password - Photowala Gift',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #2e211c;">
        <div style="padding: 40px; background: #fffdfb; border: 1px solid #f5e7d8; border-radius: 12px;">
          <h2 style="color: #5a3f2f;">Password Reset Request</h2>
          <p>Hi ${user.name}, we received a request to reset your password. Click the button below to choose a new one.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}"
               style="background: #e63946; color: white; padding: 14px 28px; text-decoration: none; border-radius: 30px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p style="color: #7a655c; font-size: 13px;">This link will expire in 15 minutes. If you didn't request this, you can safely ignore this email.</p>
          ${SHARED_FOOTER}
        </div>
      </div>
    `,
  }),

  serviceRequestStatusUpdate: (request, user, oldStatus) => {
    const statusLabels = {
      NEW: 'New Request',
      IN_PROGRESS: 'In Progress',
      CONFIRMED: 'Confirmed',
      PROCESSING: 'Processing',
      SHIPPED: 'Shipped',
      DELIVERED: 'Delivered',
      CANCELLED: 'Cancelled',
      CLOSED: 'Closed',
    };

    let message = '';
    let emoji = '📦';
    
    if (request.status === 'CONFIRMED') message = 'Your service request has been confirmed!';
    else if (request.status === 'PROCESSING') message = 'Your custom item is now being processed/crafted.';
    else if (request.status === 'SHIPPED') message = `Your order has been shipped! Tracking ID: ${request.trackingNumber || 'N/A'}`;
    else if (request.status === 'DELIVERED') message = 'Your order has been successfully delivered!';
    else if (request.status === 'CANCELLED') { message = 'Your request has been cancelled.'; emoji = '❌'; }
    else if (request.status === 'CLOSED') message = 'Your request has been closed.';
    
    return {
      subject: `${emoji} Update on Service Request #${request.orderNumber}`,
      html: `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #2e211c;">
          <div style="background: #5a3f2f; padding: 25px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">${emoji} Request Update</h1>
          </div>
          <div style="padding: 40px; background: #fffdfb; border: 1px solid #f5e7d8; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #5a3f2f; margin-top: 0;">Hi ${user.name},</h2>
            <p>${message}</p>
            
            <div style="background: #f7f0e7; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #f5e7d8;">
              <p style="margin: 5px 0;"><strong>Request Number:</strong> #${request.orderNumber}</p>
              <p style="margin: 5px 0;"><strong>Service Type:</strong> ${request.serviceType.replace(/_/g, ' ')}</p>
              <p style="margin: 5px 0;"><strong>New Status:</strong> <span style="color: #b88a2f; font-weight: bold;">${statusLabels[request.status]}</span></p>
              ${request.trackingNumber ? `<p style="margin: 5px 0;"><strong>Tracking ID:</strong> ${request.trackingNumber}</p>` : ''}
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.CLIENT_URL}/account/services"
                 style="background: #5a3f2f; color: white; padding: 14px 28px; text-decoration: none; border-radius: 30px; display: inline-block; font-weight: bold;">
                View My Services
              </a>
            </div>
            
            ${SHARED_FOOTER}
          </div>
        </div>
      `,
    };
  },
};
