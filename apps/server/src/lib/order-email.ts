import { sendEmail } from "@kineDao.com/auth/email";
import type { OrderDTO } from "@kineDao.com/api-types/checkout";

export async function sendOrderConfirmationEmail(
	userEmail: string,
	userName: string,
	_groupId: string,
	orders: OrderDTO[],
	grandTotal: number,
): Promise<void> {
	const orderNumbers = orders.map((o) => o.orderNumber).join(", ");

	// Format price helper
	const formatPrice = (paisa: number) => {
		const taka = paisa / 100;
		return `৳${taka.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	};

	// Build items HTML grouped by vendor
	const itemsHTML = orders
		.map(
			(order) => `
    <div style="margin: 20px 0; padding: 15px; background: #f9fafb; border-radius: 8px;">
      <h3 style="margin: 0 0 10px 0; color: #4F46E5; font-size: 16px;">
        Order ${order.orderNumber} - ${order.vendorName}
      </h3>
      <table style="width: 100%; border-collapse: collapse;">
        ${order.items
					.map(
						(item) => `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px 0; color: #374151;">
              ${item.productSnapshot.title}
              ${item.productSnapshot.ageRange ? `<span style="font-size: 12px; color: #6b7280;">(${item.productSnapshot.ageRange})</span>` : ""}
            </td>
            <td style="padding: 8px 0; text-align: center; color: #6b7280;">×${item.quantity}</td>
            <td style="padding: 8px 0; text-align: right; color: #111827; font-weight: 500;">${formatPrice(item.lineTotal)}</td>
          </tr>
        `,
					)
					.join("")}
        <tr>
          <td colspan="2" style="padding: 8px 0; color: #6b7280;">Subtotal</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 500;">${formatPrice(order.subtotal)}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 8px 0; color: #6b7280;">Shipping</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 500;">${formatPrice(order.shippingCost)}</td>
        </tr>
        <tr style="border-top: 2px solid #4F46E5;">
          <td colspan="2" style="padding: 8px 0; font-weight: 600; color: #111827;">Total</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #4F46E5; font-size: 16px;">${formatPrice(order.total)}</td>
        </tr>
      </table>
    </div>
  `,
		)
		.join("");

	// Get first order's shipping address (same for all orders in group)
	const shippingAddr = orders[0]!.shippingAddress;
	const addressHTML = `
    <p style="margin: 5px 0; line-height: 1.6; color: #374151;">
      <strong>${shippingAddr.fullName}</strong><br/>
      ${shippingAddr.phone}${shippingAddr.alternatePhone ? ` / ${shippingAddr.alternatePhone}` : ""}<br/>
      ${shippingAddr.addressLine1}<br/>
      ${shippingAddr.addressLine2 ? `${shippingAddr.addressLine2}<br/>` : ""}
      ${shippingAddr.city}, ${shippingAddr.district}${shippingAddr.postalCode ? ` ${shippingAddr.postalCode}` : ""}<br/>
      ${shippingAddr.deliveryInstructions ? `<em style="color: #6b7280;">Note: ${shippingAddr.deliveryInstructions}</em>` : ""}
    </p>
  `;

	const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 30px 20px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
        Order Confirmed! 🎉
      </h1>
      <p style="margin: 10px 0 0 0; color: #E0E7FF; font-size: 14px;">
        Thank you for your order, ${userName}
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 30px 20px;">

      <!-- Order Numbers -->
      <div style="background: #EEF2FF; border-left: 4px solid #4F46E5; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #4F46E5; font-weight: 600;">
          Order Number${orders.length > 1 ? "s" : ""}: ${orderNumbers}
        </p>
      </div>

      <!-- Order Items -->
      <h2 style="margin: 0 0 15px 0; color: #111827; font-size: 18px; font-weight: 600;">
        Order Summary
      </h2>
      ${itemsHTML}

      <!-- Grand Total (if multiple orders) -->
      ${
				orders.length > 1
					? `
      <div style="margin: 20px 0; padding: 15px; background: #F3F4F6; border-radius: 8px; text-align: right;">
        <span style="font-size: 18px; font-weight: 700; color: #111827;">Grand Total: </span>
        <span style="font-size: 20px; font-weight: 700; color: #4F46E5;">${formatPrice(grandTotal)}</span>
      </div>
      `
					: ""
			}

      <!-- Shipping Address -->
      <h2 style="margin: 30px 0 15px 0; color: #111827; font-size: 18px; font-weight: 600;">
        Delivery Address
      </h2>
      ${addressHTML}

      <!-- Payment Info -->
      <div style="margin: 25px 0; padding: 15px; background: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #92400E;">
          <strong style="display: block; margin-bottom: 5px;">💰 Payment Method: Cash on Delivery (COD)</strong>
          Please keep the exact amount (${formatPrice(grandTotal)}) ready when receiving your order.
        </p>
      </div>

      <!-- Baby Safety Reminder -->
      <div style="margin: 25px 0; padding: 15px; background: #FEF2F2; border-left: 4px solid #DC2626; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #991B1B;">
          <strong style="display: block; margin-bottom: 5px;">👶 Safety Reminder</strong>
          Please verify all products match your child's age before accepting delivery.
        </p>
      </div>

      <!-- Footer CTA -->
      <div style="margin: 30px 0; text-align: center;">
        <a href="https://kinedao.com" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Continue Shopping
        </a>
      </div>

    </div>

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

	await sendEmail({
		to: userEmail,
		subject: `Order Confirmed - ${orderNumbers} | KineDao`,
		html,
	});
}
