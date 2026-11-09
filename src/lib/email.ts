import nodemailer from "nodemailer";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  if (!host || !user || !pass) {
    return null; // Return null to trigger development mock logger
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Universal email dispatcher
 */
export async function sendEmail({ to, subject, html, text }: EmailPayload): Promise<boolean> {
  const from = process.env.SMTP_FROM || '"KRUMBISTRY Bake Shop" <orders@krumbistry.com>';
  const transporter = getTransporter();

  if (!transporter) {
    console.log(`\n======================================================`);
    console.log(`[TRANSACTIONAL EMAIL SIMULATOR]`);
    console.log(`To: ${to}`);
    console.log(`From: ${from}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body Preview: ${text || html.slice(0, 150)}...`);
    console.log(`======================================================\n`);
    return true;
  }

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      text: text || subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("Nodemailer error sending email:", error);
    // Never throw error in production to avoid crashing checkout transactions
    return false;
  }
}

/**
 * Brand Wrapper for HTML emails
 */
function wrapHtmlEmail(title: string, contentHtml: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #F8F3E9;
      color: #32190D;
    }
    .container {
      max-width: 600px;
      margin: 30px auto;
      background-color: #ffffff;
      border: 1px solid rgba(50, 25, 13, 0.1);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(50, 25, 13, 0.05);
    }
    .header {
      background-color: #1B0F08;
      color: #ffffff;
      text-align: center;
      padding: 32px 20px;
    }
    .brand-title {
      font-family: Georgia, serif;
      font-size: 26px;
      letter-spacing: 2px;
      margin: 0;
      color: #ffffff;
    }
    .brand-tagline {
      font-size: 11px;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #D6A64B;
      margin-top: 6px;
      font-weight: 600;
    }
    .content {
      padding: 36px 30px;
      line-height: 1.6;
      font-size: 14px;
      color: #32190D;
    }
    .footer {
      background-color: #FDFBF7;
      border-top: 1px solid rgba(50, 25, 13, 0.08);
      padding: 24px;
      text-align: center;
      font-size: 12px;
      color: #7A6961;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background-color: #32190D;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 13px;
      font-weight: 600;
      border-radius: 6px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand-title">KRUMBISTRY</div>
      <div class="brand-tagline">LUXURY IN EVERY BITE · BAKE SHOP</div>
    </div>
    <div class="content">
      ${contentHtml}
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px 0;"><strong>KRUMBISTRY Bake Shop</strong></p>
      <p style="margin: 0 0 10px 0;">Artisanal Cakes, Confectionery & Sweet Delights</p>
      <p style="margin: 0; font-size: 11px; color: #9A8981;">
        © 2026 KRUMBISTRY Bake Shop. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * 4. Newsletter Welcome / Subscription Confirmation + Admin Alert
 */
export async function sendNewsletterWelcomeEmail(email: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://krumbistry.com";
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || "admin@krumbistry.com";
  const subscribedAt = new Date().toLocaleString("en-PK", {
    timeZone: "Asia/Karachi",
    dateStyle: "medium",
    timeStyle: "short",
  });

  // Subscriber welcome email
  const subscriberContent = `
    <h2 style="font-family: Georgia, serif; font-size: 22px; color: #32190D; margin-top: 0; letter-spacing: -0.5px;">
      Welcome to the Circle 🎂
    </h2>
    <p>Thank you for subscribing to the <strong>KRUMBISTRY Bake Shop</strong> newsletter.</p>
    <p>
      You're now part of our inner circle — the first to know about fresh seasonal creations,
      limited edition flavours, upcoming events, and exclusive sweet surprises.
    </p>

    <div style="background-color: #F8F3E9; border-left: 4px solid #D6A64B; padding: 16px 20px; margin: 24px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #8C6219; text-transform: uppercase; letter-spacing: 1px;">
        What to expect
      </p>
      <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #32190D; line-height: 1.9;">
        <li>🎉 New flavour &amp; seasonal collection launches</li>
        <li>🎁 Subscriber-only discounts &amp; early-bird offers</li>
        <li>📸 Behind-the-scenes baking stories</li>
        <li>🎂 Custom cake inspiration &amp; tips</li>
      </ul>
    </div>

    <p>In the meantime, explore our full menu and treat yourself to something extraordinary.</p>

    <a href="${siteUrl}/menu" style="display:inline-block;padding:12px 28px;background-color:#32190D;color:#ffffff !important;text-decoration:none;font-size:13px;font-weight:600;border-radius:6px;margin-top:8px;letter-spacing:0.5px;">
      Explore Our Menu →
    </a>

    <p style="margin-top: 28px; font-size: 12px; color: #9A8981;">
      If you did not subscribe to this newsletter, you can safely ignore this email — we won't contact you again.
    </p>
  `;

  // Admin notification email
  const adminContent = `
    <h2 style="font-family: Georgia, serif; font-size: 20px; color: #32190D; margin-top: 0;">
      📬 New Newsletter Subscriber
    </h2>
    <p>Someone just joined the KRUMBISTRY newsletter mailing list:</p>

    <div style="background-color: #F8F3E9; border: 1px solid rgba(214,166,75,0.4); padding: 18px 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0; font-size: 14px;">
        <strong>Subscriber Email:</strong>&nbsp;
        <a href="mailto:${email}" style="color: #8C6219; font-family: monospace; font-weight: 600;">${email}</a>
      </p>
      <p style="margin: 0; font-size: 13px; color: #7A6961;">
        <strong>Subscribed At:</strong> ${subscribedAt} (Pakistan Time)
      </p>
    </div>

    <p style="font-size: 13px; color: #7A6961;">
      Manage your full subscriber list from the
      <a href="${siteUrl}/admin" style="color: #8C6219; font-weight: 600;">Admin Portal</a>.
    </p>
  `;

  // Fire both emails in parallel — neither blocks the other
  await Promise.all([
    sendEmail({
      to: email,
      subject: "Welcome to KRUMBISTRY — You're on the List! 🎂",
      html: wrapHtmlEmail("Newsletter Welcome", subscriberContent),
      text: `Welcome to KRUMBISTRY Bake Shop!\n\nThank you for subscribing. You are now the first to know about new flavours, exclusive offers, and sweet surprises.\n\nExplore our menu: ${siteUrl}/menu\n\nIf you did not subscribe, please ignore this email.`,
    }),
    sendEmail({
      to: adminEmail,
      subject: `[KRUMBISTRY] New Newsletter Subscriber: ${email}`,
      html: wrapHtmlEmail("New Subscriber Alert", adminContent),
      text: `New newsletter subscriber: ${email}\nSubscribed at: ${subscribedAt} (PKT)`,
    }),
  ]);
}


/**
 * 1. Contact Inquiry Notifications
 */
export async function sendInquiryEmails(inquiry: {
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
}) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || "admin@krumbistry.com";

  // Customer Acknowledgement
  const customerContent = `
    <h2 style="font-family: Georgia, serif; font-size: 20px; color: #32190D; margin-top: 0;">
      Warm Greetings, ${inquiry.name}
    </h2>
    <p>Thank you for reaching out to <strong>KRUMBISTRY Bake Shop</strong>. We have received your inquiry regarding <em>"${inquiry.subject}"</em>.</p>
    <p>Our concierge team reviews every message with the utmost care. We will get back to you within 24 business hours.</p>
    
    <div style="background-color: #F8F3E9; border-left: 3px solid #D6A64B; padding: 14px 18px; margin: 20px 0; border-radius: 0 6px 6px 0;">
      <p style="margin: 0; font-size: 13px; color: #32190D; font-style: italic;">
        "${inquiry.message}"
      </p>
    </div>

    <p>If your inquiry is urgent or pertains to a same-day celebration cake, please connect with us directly on WhatsApp.</p>
  `;

  await sendEmail({
    to: inquiry.email,
    subject: `We have received your message: ${inquiry.subject} | KRUMBISTRY Bake Shop`,
    html: wrapHtmlEmail("Inquiry Received", customerContent),
  });

  // Admin Notification
  const adminContent = `
    <h2 style="font-family: Georgia, serif; font-size: 20px; color: #32190D; margin-top: 0;">
      New Customer Inquiry Received
    </h2>
    <p>A new inquiry was submitted through the storefront contact form:</p>
    <ul style="padding-left: 20px; margin: 16px 0; font-size: 13px;">
      <li><strong>Sender Name:</strong> ${inquiry.name}</li>
      <li><strong>Email:</strong> ${inquiry.email}</li>
      <li><strong>Phone:</strong> ${inquiry.phone || "Not provided"}</li>
      <li><strong>Subject:</strong> ${inquiry.subject}</li>
    </ul>
    <div style="background-color: #F8F3E9; border: 1px solid rgba(50,25,13,0.1); padding: 14px 18px; border-radius: 6px; font-size: 13px;">
      <strong>Message:</strong><br />
      ${inquiry.message}
    </div>
  `;

  await sendEmail({
    to: adminEmail,
    subject: `[ADMIN ALERT] New Inquiry: ${inquiry.subject} - ${inquiry.name}`,
    html: wrapHtmlEmail("Admin Inquiry Alert", adminContent),
  });
}

/**
 * 2. Bespoke Custom Cake Consultation Notifications
 */
export async function sendCustomOrderEmails(customOrder: {
  referenceNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  eventType: string;
  eventDate: string;
  servings: string;
  budgetRange?: string | null;
  designDescription: string;
}) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || "admin@krumbistry.com";

  // Customer Confirmation
  const customerContent = `
    <h2 style="font-family: Georgia, serif; font-size: 20px; color: #32190D; margin-top: 0;">
      Custom Cake Consultation Request Confirmed
    </h2>
    <p>Dear ${customOrder.customerName},</p>
    <p>Thank you for choosing KRUMBISTRY Bake Shop to sweeten your celebratory event. We have successfully registered your custom cake consultation request.</p>

    <div style="background-color: #F8F3E9; border: 1px solid rgba(214,166,75,0.4); padding: 18px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0; font-size: 13px;">
        <strong>Consultation Reference:</strong> <span style="font-family: monospace; font-weight: bold; color: #8C6219;">#${customOrder.referenceNumber}</span>
      </p>
      <p style="margin: 0 0 6px 0; font-size: 13px;"><strong>Event Type:</strong> ${customOrder.eventType}</p>
      <p style="margin: 0 0 6px 0; font-size: 13px;"><strong>Event Date:</strong> ${customOrder.eventDate}</p>
      <p style="margin: 0; font-size: 13px;"><strong>Estimated Servings:</strong> ${customOrder.servings}</p>
    </div>

    <p>Our master pâtissier will review your vision and design specifications to formulate an estimate and schedule our design consultation.</p>
    <p><em>Please note that bespoke cake requests are confirmed only after our culinary team verifies the dates and finalizes the quote.</em></p>
  `;

  await sendEmail({
    to: customOrder.customerEmail,
    subject: `Consultation Confirmed: Bespoke Cake #${customOrder.referenceNumber} | KRUMBISTRY`,
    html: wrapHtmlEmail("Custom Cake Request", customerContent),
  });

  // Admin Alert
  const adminContent = `
    <h2 style="font-family: Georgia, serif; font-size: 20px; color: #32190D; margin-top: 0;">
      New Bespoke Cake Request: #${customOrder.referenceNumber}
    </h2>
    <p>A new custom cake inquiry requires review:</p>
    <ul style="padding-left: 20px; font-size: 13px; line-height: 1.8;">
      <li><strong>Client:</strong> ${customOrder.customerName} (${customOrder.customerEmail} / ${customOrder.customerPhone})</li>
      <li><strong>Event:</strong> ${customOrder.eventType} on <strong>${customOrder.eventDate}</strong></li>
      <li><strong>Servings:</strong> ${customOrder.servings}</li>
      <li><strong>Budget:</strong> ${customOrder.budgetRange || "Flexible"}</li>
    </ul>
    <div style="background-color: #F8F3E9; border: 1px solid rgba(50,25,13,0.1); padding: 14px 18px; border-radius: 6px; font-size: 13px;">
      <strong>Design Vision:</strong><br />
      ${customOrder.designDescription}
    </div>
  `;

  await sendEmail({
    to: adminEmail,
    subject: `[ADMIN ALERT] New Custom Cake Request #${customOrder.referenceNumber} (${customOrder.eventType})`,
    html: wrapHtmlEmail("Admin Custom Order Alert", adminContent),
  });
}

/**
 * 3. Storefront Order Receipts
 */
export async function sendOrderConfirmationEmails(order: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryType: string;
  deliveryAddress?: string | null;
  deliveryDate?: string | null;
  deliveryTimeSlot?: string | null;
  items: Array<{ name: string; quantity: number; unitPrice: number; totalPrice: number }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
}) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || "admin@krumbistry.com";

  const itemsHtml = order.items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid rgba(50,25,13,0.06);">
        <td style="padding: 10px 0; font-size: 13px;">${item.name} × ${item.quantity}</td>
        <td style="padding: 10px 0; text-align: right; font-family: monospace; font-size: 13px;">Rs. ${Number(item.totalPrice).toLocaleString()}</td>
      </tr>
    `
    )
    .join("");

  // Customer Receipt
  const customerContent = `
    <h2 style="font-family: Georgia, serif; font-size: 20px; color: #32190D; margin-top: 0;">
      Order Confirmed: #${order.orderNumber}
    </h2>
    <p>Dear ${order.customerName},</p>
    <p>Your order has been received and is being prepared with artisanal care by the KRUMBISTRY Bake Shop team.</p>

    <div style="background-color: #F8F3E9; border: 1px solid rgba(50,25,13,0.1); padding: 16px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0 0 6px 0; font-size: 12px; text-transform: uppercase; color: #8C6219; font-weight: bold;">
        Fulfillment Details
      </p>
      <p style="margin: 0 0 4px 0; font-size: 13px;"><strong>Type:</strong> ${order.deliveryType}</p>
      ${order.deliveryAddress ? `<p style="margin: 0 0 4px 0; font-size: 13px;"><strong>Address:</strong> ${order.deliveryAddress}</p>` : ""}
      ${order.deliveryDate ? `<p style="margin: 0; font-size: 13px;"><strong>Date:</strong> ${order.deliveryDate} ${order.deliveryTimeSlot ? `(${order.deliveryTimeSlot})` : ""}</p>` : ""}
    </div>

    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="border-bottom: 2px solid #32190D; font-size: 12px; text-transform: uppercase;">
          <th style="text-align: left; padding-bottom: 8px;">Creation</th>
          <th style="text-align: right; padding-bottom: 8px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td style="padding-top: 12px; font-size: 13px;">Subtotal</td>
          <td style="padding-top: 12px; text-align: right; font-family: monospace; font-size: 13px;">Rs. ${Number(order.subtotal).toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding-top: 6px; font-size: 13px;">Delivery</td>
          <td style="padding-top: 6px; text-align: right; font-family: monospace; font-size: 13px;">Rs. ${Number(order.deliveryFee).toLocaleString()}</td>
        </tr>
        <tr style="font-weight: bold; font-size: 15px; color: #32190D;">
          <td style="padding-top: 10px; border-top: 1px solid #32190D;">Grand Total</td>
          <td style="padding-top: 10px; border-top: 1px solid #32190D; text-align: right; font-family: monospace; color: #8C6219;">Rs. ${Number(order.total).toLocaleString()}</td>
        </tr>
      </tfoot>
    </table>

    <p style="font-size: 13px; color: #7A6961;">
      We will notify you once your order is freshly packed and dispatched or ready for bakery pickup.
    </p>
  `;

  await sendEmail({
    to: order.customerEmail,
    subject: `Order Receipt: #${order.orderNumber} | KRUMBISTRY Bake Shop`,
    html: wrapHtmlEmail("Order Receipt", customerContent),
  });

  // Admin Notification
  const adminContent = `
    <h2 style="font-family: Georgia, serif; font-size: 20px; color: #32190D; margin-top: 0;">
      New Storefront Order: #${order.orderNumber}
    </h2>
    <p>A new customer order was received:</p>
    <p><strong>Customer:</strong> ${order.customerName} (${order.customerEmail} / ${order.customerPhone})</p>
    <p><strong>Fulfillment:</strong> ${order.deliveryType}</p>
    <p><strong>Grand Total:</strong> Rs. ${Number(order.total).toLocaleString()}</p>
    <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
      ${itemsHtml}
    </table>
  `;

  await sendEmail({
    to: adminEmail,
    subject: `[ADMIN ALERT] New Order #${order.orderNumber} - Rs. ${Number(order.total).toLocaleString()}`,
    html: wrapHtmlEmail("Admin Order Alert", adminContent),
  });
}

/**
 * Admin Password Reset Verification Code Email
 */
export async function sendAdminPasswordResetCodeEmail({
  to,
  code,
  expiresMinutes = 10,
}: {
  to: string;
  code: string;
  expiresMinutes?: number;
}): Promise<boolean> {
  const content = `
    <h2 style="font-family: Georgia, serif; font-size: 22px; color: #32190D; margin-top: 0; margin-bottom: 12px;">
      Admin Security Verification Code
    </h2>
    <p style="font-size: 14px; line-height: 1.6; color: #55443B;">
      A password reset was requested for the KRUMBISTRY Bake Shop Administrator Portal (<strong style="color: #32190D;">${to}</strong>).
    </p>
    <p style="font-size: 14px; line-height: 1.6; color: #55443B;">
      Please use the following 6-digit one-time code to authorize your password change. This code will expire in <strong>${expiresMinutes} minutes</strong>:
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <div style="display: inline-block; background-color: #F8F3E9; border: 2px solid #D6A64B; border-radius: 12px; padding: 18px 36px; box-shadow: 0 4px 12px rgba(50,25,13,0.06);">
        <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: bold; letter-spacing: 10px; color: #8C6219;">
          ${code}
        </span>
      </div>
    </div>

    <div style="background-color: #FFFDF9; border-left: 4px solid #D6A64B; padding: 14px 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; font-size: 12px; color: #7A6961; line-height: 1.6;">
        <strong style="color: #32190D;">Security Warning:</strong> If you did not request this password reset, please disregard this email. Your password remains unchanged.
      </p>
    </div>

    <p style="font-size: 12px; color: #9A8778; margin-top: 24px;">
      KRUMBISTRY Bake Shop Security System · Automated Notification
    </p>
  `;

  return sendEmail({
    to,
    subject: `[KRUMBISTRY Admin] Security Verification Code: ${code}`,
    html: wrapHtmlEmail("Admin Password Reset Code", content),
    text: `Your KRUMBISTRY Admin password reset verification code is: ${code}. It expires in ${expiresMinutes} minutes. If you did not request this, please ignore this email.`,
  });
}

/**
 * Admin Password Reset Confirmation Notification
 */
export async function sendAdminPasswordResetConfirmationEmail({
  to,
}: {
  to: string;
}): Promise<boolean> {
  const content = `
    <h2 style="font-family: Georgia, serif; font-size: 22px; color: #32190D; margin-top: 0; margin-bottom: 12px;">
      Password Successfully Changed
    </h2>
    <p style="font-size: 14px; line-height: 1.6; color: #55443B;">
      The password for your KRUMBISTRY Administrator account (<strong style="color: #32190D;">${to}</strong>) has been successfully updated and your security status is unlocked.
    </p>

    <div style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 14px 16px; margin: 20px 0;">
      <p style="margin: 0; font-size: 13px; color: #166534; font-weight: 600;">
        ✓ Account is Active & Unlocked
      </p>
      <p style="margin: 4px 0 0 0; font-size: 12px; color: #15803D;">
        Timestamp: ${new Date().toLocaleString()}
      </p>
    </div>

    <p style="font-size: 13px; line-height: 1.6; color: #55443B;">
      You can now log in to the Administrator Portal with your new credentials.
    </p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/login" style="display: inline-block; background-color: #32190D; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 13px; font-weight: bold; letter-spacing: 0.5px;">
        Open Admin Portal
      </a>
    </div>

    <p style="font-size: 12px; color: #9A8778;">
      If you did not perform this change, please contact technical support immediately.
    </p>
  `;

  return sendEmail({
    to,
    subject: `[KRUMBISTRY Admin] Your Password Was Successfully Reset`,
    html: wrapHtmlEmail("Password Reset Confirmation", content),
    text: `Your KRUMBISTRY Admin password has been successfully reset. If you did not make this change, please contact support immediately.`,
  });
}

