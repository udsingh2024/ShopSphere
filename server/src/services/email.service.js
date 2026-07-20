const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Configure SMTP transport details
const getTransporter = () => {
  const host = process.env.EMAIL_HOST || 'smtp.mailtrap.io';
  const port = process.env.EMAIL_PORT || 2525;
  const user = process.env.EMAIL_USER || 'mock_user';
  const pass = process.env.EMAIL_PASS || 'mock_pass';

  // Fallback to beautiful console logger if not configured
  const isMock = user === 'mock_user';
  if (isMock) {
    return {
      sendMail: async (options) => {
        logger.info(`[MOCK EMAIL SENT] To: ${options.to} | Subject: ${options.subject} | Attachments Count: ${options.attachments?.length || 0}`);
        return { messageId: `mock_${Date.now()}` };
      },
    };
  }

  return nodemailer.createTransport({
    host,
    port,
    auth: {
      user,
      pass,
    },
  });
};

/**
 * Send order placement confirmation with invoice attachment.
 */
const sendOrderConfirmation = async (userEmail, order, invoiceBuffer, invoiceNumber) => {
  try {
    const transporter = getTransporter();
    
    const mailOptions = {
      from: `"ShopSphere Fulfillment" <no-reply@shopsphere.com>`,
      to: userEmail,
      subject: `Order Confirmed - Invoice #${invoiceNumber}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #6366f1;">Thank you for your order!</h2>
          <p>Hi,</p>
          <p>Your order has been placed successfully. Below are your order summary details:</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p><strong>Order Reference ID:</strong> ${order._id}</p>
          <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
          <p><strong>Paid Total Amount:</strong> $${order.financials.total.toFixed(2)}</p>
          <p><strong>Payment Method:</strong> ${order.paymentInfo.method.toUpperCase()}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p>We have attached the PDF invoice statement to this email for your records.</p>
          <p style="margin-top: 30px; font-size: 12px; color: #888;">ShopSphere E-Commerce System</p>
        </div>
      `,
      attachments: [
        {
          filename: `Invoice_${invoiceNumber}.pdf`,
          content: invoiceBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Order confirmation email sent to ${userEmail} (ID: ${info.messageId})`);
    return info;
  } catch (error) {
    logger.error(`Error sending order confirmation email: ${error.message}`);
  }
};

/**
 * Send Payment Failure email.
 */
const sendPaymentFailed = async (userEmail, orderAmount, errMessage) => {
  try {
    const transporter = getTransporter();
    
    const mailOptions = {
      from: `"ShopSphere Billing" <billing@shopsphere.com>`,
      to: userEmail,
      subject: 'Transaction Failed - ShopSphere Payment Alert',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fee2e2; border-radius: 8px; background-color: #fef2f2;">
          <h2 style="color: #ef4444;">Payment Attempt Failed</h2>
          <p>Hi,</p>
          <p>We were unable to process your payment of <strong>$${orderAmount.toFixed(2)}</strong> for your current cart checkout transaction.</p>
          <p style="background-color: #fff; padding: 10px; border-left: 4px solid #ef4444; margin: 20px 0; font-family: monospace;">
            Error Details: ${errMessage || 'Card declined / Authentication failed'}
          </p>
          <p>No funds were charged from your account. Please log in and check your payment methods to try checkout again.</p>
          <p style="margin-top: 30px; font-size: 12px; color: #888;">ShopSphere E-Commerce System</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Payment failure email sent to ${userEmail}`);
    return info;
  } catch (error) {
    logger.error(`Error sending payment failed email: ${error.message}`);
  }
};

/**
 * Send Refund success confirmation.
 */
const sendRefundConfirmation = async (userEmail, refundAmount, orderId) => {
  try {
    const transporter = getTransporter();
    
    const mailOptions = {
      from: `"ShopSphere Billing" <billing@shopsphere.com>`,
      to: userEmail,
      subject: 'Refund Processed - ShopSphere Transaction Update',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #d1fae5; border-radius: 8px; background-color: #ecfdf5;">
          <h2 style="color: #10b981;">Refund Successful</h2>
          <p>Hi,</p>
          <p>A refund of <strong>$${refundAmount.toFixed(2)}</strong> was processed successfully for your order <strong>#${orderId.substring(18)}</strong>.</p>
          <p>The refunded amount should reflect back in your original source transaction account within 5-7 business days.</p>
          <p style="margin-top: 30px; font-size: 12px; color: #888;">ShopSphere E-Commerce System</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Refund confirmation email sent to ${userEmail}`);
    return info;
  } catch (error) {
    logger.error(`Error sending refund email: ${error.message}`);
  }
};

/**
 * Send Shipping status update notices.
 */
const sendShippingUpdate = async (userEmail, trackingNumber, orderStatus, carrier) => {
  try {
    const transporter = getTransporter();
    
    const mailOptions = {
      from: `"ShopSphere Delivery" <delivery@shopsphere.com>`,
      to: userEmail,
      subject: `Shipping Update - Order ${orderStatus.toUpperCase()}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0f2fe; border-radius: 8px; background-color: #f0f9ff;">
          <h2 style="color: #0284c7;">Transit Status Modified</h2>
          <p>Hi,</p>
          <p>Your package status has been updated to: <strong>${orderStatus.toUpperCase()}</strong>.</p>
          <p><strong>Shipping Carrier:</strong> ${carrier}</p>
          <p><strong>Tracking Number reference:</strong> <span style="font-family: monospace; font-weight: bold;">${trackingNumber || 'N/A'}</span></p>
          <p>You can use this tracking identifier to check delivery progress on the courier dashboard.</p>
          <p style="margin-top: 30px; font-size: 12px; color: #888;">ShopSphere E-Commerce System</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Shipping update email sent to ${userEmail}`);
    return info;
  } catch (error) {
    logger.error(`Error sending shipping update email: ${error.message}`);
  }
};

const sendVerificationEmail = async (userEmail, name, token) => {
  try {
    const transporter = getTransporter();
    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/verify-email/${token}`;
    const mailOptions = {
      from: `"ShopSphere Verification" <no-reply@shopsphere.com>`,
      to: userEmail,
      subject: 'Verify Your Email - ShopSphere',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #6366f1;">Welcome to ShopSphere!</h2>
          <p>Hi ${name},</p>
          <p>Please verify your email address by clicking the link below:</p>
          <a href="${verificationUrl}" style="background-color: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Verify Email</a>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `,
    };
    return await transporter.sendMail(mailOptions);
  } catch (error) {
    logger.error(`Error sending verification email: ${error.message}`);
  }
};

const sendResetPasswordEmail = async (userEmail, name, token) => {
  try {
    const transporter = getTransporter();
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/reset-password/${token}`;
    const mailOptions = {
      from: `"ShopSphere Support" <support@shopsphere.com>`,
      to: userEmail,
      subject: 'Reset Your Password - ShopSphere',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2>Reset Your Password</h2>
          <p>Hi ${name},</p>
          <p>We received a request to reset your password. Click the link below to set a new password:</p>
          <a href="${resetUrl}" style="background-color: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Reset Password</a>
          <p>This link is valid for 1 hour. If you did not request this, please ignore this email.</p>
        </div>
      `,
    };
    return await transporter.sendMail(mailOptions);
  } catch (error) {
    logger.error(`Error sending reset password email: ${error.message}`);
  }
};

const sendWelcomeEmail = async (userEmail, name) => {
  try {
    const transporter = getTransporter();
    const mailOptions = {
      from: `"ShopSphere Welcomes You" <no-reply@shopsphere.com>`,
      to: userEmail,
      subject: 'Welcome to ShopSphere!',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2>Your Account is Verified!</h2>
          <p>Hi ${name},</p>
          <p>Thank you for verifying your email address. Welcome to ShopSphere!</p>
        </div>
      `,
    };
    return await transporter.sendMail(mailOptions);
  } catch (error) {
    logger.error(`Error sending welcome email: ${error.message}`);
  }
};

const sendAccountDeletedEmail = async (userEmail, name) => {
  try {
    const transporter = getTransporter();
    const mailOptions = {
      from: `"ShopSphere Accounts" <no-reply@shopsphere.com>`,
      to: userEmail,
      subject: 'Account Deleted - ShopSphere',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2>Account Deleted Successfully</h2>
          <p>Hi ${name},</p>
          <p>As requested, your account has been successfully deleted from ShopSphere. We are sorry to see you go!</p>
        </div>
      `,
    };
    return await transporter.sendMail(mailOptions);
  } catch (error) {
    logger.error(`Error sending account deletion email: ${error.message}`);
  }
};

module.exports = {
  sendOrderConfirmation,
  sendPaymentFailed,
  sendRefundConfirmation,
  sendShippingUpdate,
  sendVerificationEmail,
  sendResetPasswordEmail,
  sendWelcomeEmail,
  sendAccountDeletedEmail,
};
