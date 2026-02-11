import { sendEmail } from "@kineDao.com/auth/email";
import { env } from "@kineDao.com/env/server";

// Helper to format price in BDT
const formatPrice = (paisa: number) => {
	const taka = paisa / 100;
	return `৳${taka.toLocaleString("en-BD", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;
};

// Base email wrapper with KineDao branding
const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
    ${content}
    <!-- Footer -->
    <div style="background: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
      <p style="margin: 0 0 5px 0; color: #6B7280; font-size: 12px;">
        Questions? Contact us at <a href="mailto:support@kinedao.com" style="color: #4F46E5;">support@kinedao.com</a>
      </p>
      <p style="margin: 0; color: #9CA3AF; font-size: 11px;">
        © ${new Date().getFullYear()} KineDao. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
`;

// =====================
// Customer Emails
// =====================

export async function sendOrderConfirmedEmail(
	email: string,
	name: string,
	orderNumber: string,
): Promise<void> {
	const content = `
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 30px 20px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
        Order Confirmed! ✅
      </h1>
      <p style="margin: 10px 0 0 0; color: #E0E7FF; font-size: 14px;">
        Your order is being prepared, ${name}
      </p>
    </div>
    <!-- Content -->
    <div style="padding: 30px 20px;">
      <div style="background: #EEF2FF; border-left: 4px solid #4F46E5; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #4F46E5; font-weight: 600;">
          Order Number: ${orderNumber}
        </p>
      </div>
      <p style="margin: 0 0 15px 0; color: #374151; line-height: 1.6;">
        Good news! The vendor has confirmed your order and is preparing it for shipment.
      </p>
      <p style="margin: 0; color: #374151; line-height: 1.6;">
        You'll receive another notification once your order is shipped with tracking details.
      </p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${env.FRONTEND_URL}/account/orders" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          View Order Details
        </a>
      </div>
    </div>
  `;

	await sendEmail({
		to: email,
		subject: `Order Confirmed - ${orderNumber} | KineDao`,
		html: emailWrapper(content),
	});
}

export async function sendOrderShippedEmail(
	email: string,
	name: string,
	orderNumber: string,
	trackingNumber?: string,
	carrier?: string,
): Promise<void> {
	const content = `
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px 20px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
        Order Shipped! 📦
      </h1>
      <p style="margin: 10px 0 0 0; color: #D1FAE5; font-size: 14px;">
        Your order is on the way, ${name}
      </p>
    </div>
    <!-- Content -->
    <div style="padding: 30px 20px;">
      <div style="background: #ECFDF5; border-left: 4px solid #10B981; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #047857; font-weight: 600;">
          Order Number: ${orderNumber}
        </p>
        ${
					trackingNumber
						? `
        <p style="margin: 0; font-size: 13px; color: #065F46;">
          Tracking: ${trackingNumber}${carrier ? ` (${carrier})` : ""}
        </p>
        `
						: ""
				}
      </div>
      <p style="margin: 0 0 15px 0; color: #374151; line-height: 1.6;">
        Your order has been shipped and is on its way to you!
      </p>
      <div style="margin: 25px 0; padding: 15px; background: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #92400E;">
          <strong style="display: block; margin-bottom: 5px;">💰 Cash on Delivery</strong>
          Please keep the cash ready when receiving your order.
        </p>
      </div>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${env.FRONTEND_URL}/account/orders" style="display: inline-block; background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Track Your Order
        </a>
      </div>
    </div>
  `;

	await sendEmail({
		to: email,
		subject: `Order Shipped - ${orderNumber} | KineDao`,
		html: emailWrapper(content),
	});
}

export async function sendOrderDeliveredEmail(
	email: string,
	name: string,
	orderNumber: string,
): Promise<void> {
	const content = `
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%); padding: 30px 20px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
        Order Delivered! 🎉
      </h1>
      <p style="margin: 10px 0 0 0; color: #EDE9FE; font-size: 14px;">
        Thank you for shopping with us, ${name}
      </p>
    </div>
    <!-- Content -->
    <div style="padding: 30px 20px;">
      <div style="background: #F5F3FF; border-left: 4px solid #8B5CF6; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #6D28D9; font-weight: 600;">
          Order Number: ${orderNumber}
        </p>
      </div>
      <p style="margin: 0 0 15px 0; color: #374151; line-height: 1.6;">
        Your order has been successfully delivered! We hope you and your little one love it.
      </p>
      <p style="margin: 0; color: #374151; line-height: 1.6;">
        If you have any issues with your order, please contact us immediately.
      </p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${env.FRONTEND_URL}" style="display: inline-block; background: #8B5CF6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Continue Shopping
        </a>
      </div>
    </div>
  `;

	await sendEmail({
		to: email,
		subject: `Order Delivered - ${orderNumber} | KineDao`,
		html: emailWrapper(content),
	});
}

export async function sendOrderCancelledEmail(
	email: string,
	name: string,
	orderNumber: string,
	reason?: string,
): Promise<void> {
	const content = `
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); padding: 30px 20px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
        Order Cancelled
      </h1>
      <p style="margin: 10px 0 0 0; color: #FEE2E2; font-size: 14px;">
        We're sorry, ${name}
      </p>
    </div>
    <!-- Content -->
    <div style="padding: 30px 20px;">
      <div style="background: #FEF2F2; border-left: 4px solid #EF4444; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #991B1B; font-weight: 600;">
          Order Number: ${orderNumber}
        </p>
      </div>
      <p style="margin: 0 0 15px 0; color: #374151; line-height: 1.6;">
        Your order has been cancelled.
      </p>
      ${
				reason
					? `
      <p style="margin: 0 0 15px 0; color: #6B7280; line-height: 1.6;">
        <strong>Reason:</strong> ${reason}
      </p>
      `
					: ""
			}
      <p style="margin: 0; color: #374151; line-height: 1.6;">
        If you have any questions, please contact our support team.
      </p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${env.FRONTEND_URL}" style="display: inline-block; background: #EF4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Continue Shopping
        </a>
      </div>
    </div>
  `;

	await sendEmail({
		to: email,
		subject: `Order Cancelled - ${orderNumber} | KineDao`,
		html: emailWrapper(content),
	});
}

// =====================
// Vendor Emails
// =====================

export async function sendNewOrderVendorEmail(
	email: string,
	vendorName: string,
	orderNumber: string,
	total: number,
	itemCount: number,
): Promise<void> {
	const content = `
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding: 30px 20px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
        New Order! 🔔
      </h1>
      <p style="margin: 10px 0 0 0; color: #FEF3C7; font-size: 14px;">
        ${vendorName}
      </p>
    </div>
    <!-- Content -->
    <div style="padding: 30px 20px;">
      <div style="background: #FFFBEB; border-left: 4px solid #F59E0B; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #92400E; font-weight: 600;">
          Order Number: ${orderNumber}
        </p>
        <p style="margin: 0; font-size: 13px; color: #78350F;">
          ${itemCount} item${itemCount > 1 ? "s" : ""} • Total: ${formatPrice(total)}
        </p>
      </div>
      <p style="margin: 0 0 15px 0; color: #374151; line-height: 1.6;">
        You have received a new COD order. Please log in to your vendor dashboard to confirm and process it.
      </p>
      <div style="margin: 25px 0; padding: 15px; background: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #92400E;">
          <strong style="display: block; margin-bottom: 5px;">⏰ Action Required</strong>
          Please confirm this order within 24 hours.
        </p>
      </div>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${env.FRONTEND_URL}/vendor/orders" style="display: inline-block; background: #F59E0B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          View Order
        </a>
      </div>
    </div>
  `;

	await sendEmail({
		to: email,
		subject: `New Order ${orderNumber} - ${formatPrice(total)} | KineDao Vendor`,
		html: emailWrapper(content),
	});
}

export async function sendProductApprovedEmail(
	email: string,
	vendorName: string,
	productTitle: string,
): Promise<void> {
	const content = `
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px 20px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
        Product Approved! ✅
      </h1>
      <p style="margin: 10px 0 0 0; color: #D1FAE5; font-size: 14px;">
        ${vendorName}
      </p>
    </div>
    <!-- Content -->
    <div style="padding: 30px 20px;">
      <p style="margin: 0 0 15px 0; color: #374151; line-height: 1.6;">
        Great news! Your product <strong>"${productTitle}"</strong> has been approved and is now live on KineDao.
      </p>
      <p style="margin: 0; color: #374151; line-height: 1.6;">
        Customers can now browse and purchase this product from your store.
      </p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${env.FRONTEND_URL}/vendor/products" style="display: inline-block; background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          View Product
        </a>
      </div>
    </div>
  `;

	await sendEmail({
		to: email,
		subject: `Product Approved - ${productTitle} | KineDao Vendor`,
		html: emailWrapper(content),
	});
}

export async function sendProductRejectedEmail(
	email: string,
	vendorName: string,
	productTitle: string,
	reviewNotes: string,
): Promise<void> {
	const content = `
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); padding: 30px 20px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
        Product Needs Changes
      </h1>
      <p style="margin: 10px 0 0 0; color: #FEE2E2; font-size: 14px;">
        ${vendorName}
      </p>
    </div>
    <!-- Content -->
    <div style="padding: 30px 20px;">
      <p style="margin: 0 0 15px 0; color: #374151; line-height: 1.6;">
        Your product <strong>"${productTitle}"</strong> requires some changes before it can be published.
      </p>
      <div style="background: #FEF2F2; border-left: 4px solid #EF4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #991B1B; font-weight: 600;">
          Review Notes:
        </p>
        <p style="margin: 0; font-size: 13px; color: #7F1D1D; line-height: 1.6;">
          ${reviewNotes}
        </p>
      </div>
      <p style="margin: 0; color: #374151; line-height: 1.6;">
        Please make the necessary changes and resubmit your product for review.
      </p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${env.FRONTEND_URL}/vendor/products" style="display: inline-block; background: #EF4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Edit Product
        </a>
      </div>
    </div>
  `;

	await sendEmail({
		to: email,
		subject: `Product Needs Changes - ${productTitle} | KineDao Vendor`,
		html: emailWrapper(content),
	});
}

export async function sendVendorApprovedEmail(
	email: string,
	vendorName: string,
	shopName: string,
): Promise<void> {
	const content = `
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%); padding: 30px 20px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
        Welcome to KineDao! 🎉
      </h1>
      <p style="margin: 10px 0 0 0; color: #EDE9FE; font-size: 14px;">
        Your vendor application has been approved
      </p>
    </div>
    <!-- Content -->
    <div style="padding: 30px 20px;">
      <p style="margin: 0 0 15px 0; color: #374151; line-height: 1.6;">
        Congratulations, ${vendorName}! Your vendor application for <strong>${shopName}</strong> has been approved.
      </p>
      <p style="margin: 0 0 15px 0; color: #374151; line-height: 1.6;">
        You can now access your vendor dashboard and start listing your baby products on KineDao.
      </p>
      <div style="margin: 25px 0; padding: 15px; background: #F5F3FF; border-left: 4px solid #8B5CF6; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #5B21B6;">
          <strong style="display: block; margin-bottom: 5px;">📋 Next Steps</strong>
          Log in to your vendor dashboard to add products, manage orders, and track your earnings.
        </p>
      </div>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${env.FRONTEND_URL}/vendor/dashboard" style="display: inline-block; background: #8B5CF6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Go to Dashboard
        </a>
      </div>
    </div>
  `;

	await sendEmail({
		to: email,
		subject: `Welcome to KineDao - Vendor Approved | KineDao`,
		html: emailWrapper(content),
	});
}
